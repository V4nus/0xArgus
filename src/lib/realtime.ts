// Real-time price streaming using DexPaprika SSE and polling fallback

export interface RealtimePrice {
  price: number;
  timestamp: number;
}

export interface PriceUpdate {
  price: number;
  priceChange: number;
  timestamp: number;
}

// Real-time OHLCV bar
export interface RealtimeBar {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVUpdate {
  bar: RealtimeBar;
  isNewBar: boolean; // True if this is a new candle, false if updating current
}

// Trade event estimated from price movement
export interface TradeEvent {
  type: 'buy' | 'sell';
  price: number;
  priceChange: number; // Percentage change
  estimatedVolumeUsd: number; // Estimated based on price impact
  timestamp: number;
}

type PriceCallback = (update: PriceUpdate) => void;
type OHLCVCallback = (update: OHLCVUpdate) => void;
type TradeCallback = (trade: TradeEvent) => void;

// Interval durations in milliseconds
const INTERVAL_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

// DexPaprika SSE stream for real-time token prices
export class RealtimePriceService {
  private eventSource: EventSource | null = null;
  private callbacks: Map<string, Set<PriceCallback>> = new Map();
  private lastPrices: Map<string, number> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  // OHLCV tracking
  private ohlcvCallbacks: Map<string, Set<OHLCVCallback>> = new Map();
  private currentBars: Map<string, RealtimeBar> = new Map();
  private barIntervals: Map<string, string> = new Map(); // key -> interval (e.g., '1h')

  // Trade tracking
  private tradeCallbacks: Map<string, Set<TradeCallback>> = new Map();
  private poolLiquidity: Map<string, number> = new Map(); // key -> liquidity USD for volume estimation

  // Subscribe to real-time price updates for a token
  subscribe(
    chainId: string,
    tokenAddress: string,
    callback: PriceCallback
  ): () => void {
    const key = `${chainId}:${tokenAddress}`;

    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
      this.startStream(chainId, tokenAddress, key);
    }

    this.callbacks.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.stopStream(key);
          this.callbacks.delete(key);
        }
      }
    };
  }

  private async startStream(chainId: string, tokenAddress: string, key: string) {
    // Directly use polling for now (SSE causes issues in development)
    console.log(`[Realtime] Starting polling stream for ${key}`);
    this.startPolling(chainId, tokenAddress, key);
  }

  private startPolling(chainId: string, address: string, key: string) {
    // Poll DexScreener API every 2 seconds for better real-time experience
    // Still within rate limits: 300 req/min = 5 req/s
    console.log(`[Polling] Started for chainId=${chainId}, address=${address}`);

    // Determine if address is a pool (40 chars) or token (40 chars)
    // For now, we'll try both endpoints
    const isPoolAddress = address.length === 42 && address.startsWith('0x');

    const poll = async () => {
      try {
        let price: number | null = null;

        // Try pool-specific endpoint first (more accurate for specific pool)
        if (isPoolAddress) {
          try {
            const poolResponse = await fetch(
              `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${address}`
            );
            const poolData = await poolResponse.json();

            if (poolData.pair?.priceUsd) {
              price = parseFloat(poolData.pair.priceUsd);
              console.log(`[Polling] Pool price for ${key}: $${price.toFixed(8)}`);
            }
          } catch (poolError) {
            console.warn('[Polling] Pool endpoint failed, trying token endpoint');
          }
        }

        // Fallback to token endpoint if pool endpoint failed
        if (price === null) {
          const tokenResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${address}`
          );
          const tokenData = await tokenResponse.json();

          console.log(`[Polling] Received ${tokenData.pairs?.length || 0} pairs for ${address}`);

          const pair = tokenData.pairs?.find((p: { chainId: string }) => p.chainId === chainId);

          if (pair?.priceUsd) {
            price = parseFloat(pair.priceUsd);
            console.log(`[Polling] Token price for ${key}: $${price.toFixed(8)}`);
          } else {
            console.warn(`[Polling] No matching pair found for chainId=${chainId}`);
            if (tokenData.pairs && tokenData.pairs.length > 0) {
              console.log('[Polling] Available chainIds:', tokenData.pairs.map((p: any) => p.chainId).join(', '));
            }
          }
        }

        // Notify subscribers if we got a price
        if (price !== null) {
          this.notifySubscribers(key, price);
        }
      } catch (e) {
        console.error('[Polling] Error:', e);
      }
    };

    // Initial fetch
    poll();

    // Set up interval - 2 seconds for smoother updates
    const interval = setInterval(poll, 2000);
    this.pollingIntervals.set(key, interval);
  }

  private notifySubscribers(key: string, newPrice: number) {
    const lastPrice = this.lastPrices.get(key) || newPrice;
    const priceChange = lastPrice > 0
      ? ((newPrice - lastPrice) / lastPrice) * 100
      : 0;

    this.lastPrices.set(key, newPrice);

    const update: PriceUpdate = {
      price: newPrice,
      priceChange,
      timestamp: Date.now(),
    };

    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(update));
    }

    // Emit trade event if price changed significantly (> 0.01%)
    if (Math.abs(priceChange) > 0.01) {
      const tradeCallbacks = this.tradeCallbacks.get(key);
      if (tradeCallbacks && tradeCallbacks.size > 0) {
        // Estimate trade volume based on price impact and pool liquidity
        // Price impact formula: priceChange ≈ 2 * tradeVolume / poolLiquidity
        // So tradeVolume ≈ priceChange * poolLiquidity / 2
        const liquidity = this.poolLiquidity.get(key) || 100000; // Default 100k if unknown
        const estimatedVolumeUsd = Math.abs(priceChange / 100) * liquidity / 2;

        const trade: TradeEvent = {
          type: priceChange > 0 ? 'buy' : 'sell',
          price: newPrice,
          priceChange,
          estimatedVolumeUsd,
          timestamp: Date.now(),
        };

        tradeCallbacks.forEach((cb) => cb(trade));
      }
    }
  }

  private stopStream(key: string) {
    // Stop SSE
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Stop polling
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
    }

    this.lastPrices.delete(key);
  }

  // Subscribe to real-time OHLCV updates
  subscribeOHLCV(
    chainId: string,
    tokenAddress: string,
    interval: string,
    initialBar: RealtimeBar | null,
    callback: OHLCVCallback
  ): () => void {
    const key = `${chainId}:${tokenAddress}:ohlcv:${interval}`;
    const priceKey = `${chainId}:${tokenAddress}`;

    if (!this.ohlcvCallbacks.has(key)) {
      this.ohlcvCallbacks.set(key, new Set());
      this.barIntervals.set(key, interval);

      // Initialize current bar
      if (initialBar) {
        this.currentBars.set(key, { ...initialBar });
      }
    }

    this.ohlcvCallbacks.get(key)!.add(callback);

    // Subscribe to price updates to build OHLCV
    const priceCallback = (update: PriceUpdate) => {
      this.updateOHLCVBar(key, update.price, interval);
    };

    // Ensure we're subscribed to price updates
    if (!this.callbacks.has(priceKey)) {
      this.callbacks.set(priceKey, new Set());
      this.startStream(chainId, tokenAddress, priceKey);
    }
    this.callbacks.get(priceKey)!.add(priceCallback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.ohlcvCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.ohlcvCallbacks.delete(key);
          this.currentBars.delete(key);
          this.barIntervals.delete(key);
        }
      }
      // Remove price callback
      const priceCallbacks = this.callbacks.get(priceKey);
      if (priceCallbacks) {
        priceCallbacks.delete(priceCallback);
        // If no more price subscribers and no trade subscribers, stop the stream
        if (priceCallbacks.size === 0 && !this.tradeCallbacks.has(priceKey)) {
          this.stopStream(priceKey);
          this.callbacks.delete(priceKey);
        }
      }
    };
  }

  // Update OHLCV bar with new price
  private updateOHLCVBar(key: string, price: number, interval: string) {
    const now = Date.now();
    const intervalMs = INTERVAL_MS[interval] || INTERVAL_MS['1h'];
    const currentBarTime = Math.floor(now / intervalMs) * intervalMs / 1000; // Unix seconds

    let bar = this.currentBars.get(key);
    let isNewBar = false;

    if (!bar || bar.time < currentBarTime) {
      // New bar started
      isNewBar = true;
      // CRITICAL FIX: New bar's open price should equal previous bar's close price
      // This prevents price jumps between candles
      const previousClose = bar?.close ?? price; // Fallback to current price if no previous bar
      bar = {
        time: currentBarTime,
        open: previousClose,  // ✅ Use previous bar's close as new bar's open
        high: Math.max(previousClose, price),
        low: Math.min(previousClose, price),
        close: price,
        volume: 0,
      };
      this.currentBars.set(key, bar);
    } else {
      // Update existing bar
      bar.high = Math.max(bar.high, price);
      bar.low = Math.min(bar.low, price);
      bar.close = price;
    }

    // Notify subscribers
    const callbacks = this.ohlcvCallbacks.get(key);
    if (callbacks) {
      const update: OHLCVUpdate = { bar: { ...bar }, isNewBar };
      callbacks.forEach((cb) => cb(update));
    }
  }

  // Get current bar for a subscription
  getCurrentBar(chainId: string, tokenAddress: string, interval: string): RealtimeBar | null {
    const key = `${chainId}:${tokenAddress}:ohlcv:${interval}`;
    return this.currentBars.get(key) || null;
  }

  // Subscribe to trade events (estimated from price movements)
  subscribeTrades(
    chainId: string,
    tokenAddress: string,
    liquidityUsd: number,
    callback: TradeCallback
  ): () => void {
    const key = `${chainId}:${tokenAddress}`;

    // Store pool liquidity for volume estimation
    this.poolLiquidity.set(key, liquidityUsd);

    if (!this.tradeCallbacks.has(key)) {
      this.tradeCallbacks.set(key, new Set());
    }
    this.tradeCallbacks.get(key)!.add(callback);

    // Ensure we're subscribed to price updates
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
      this.startStream(chainId, tokenAddress, key);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.tradeCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.tradeCallbacks.delete(key);
          this.poolLiquidity.delete(key);
        }
      }
    };
  }

  // Update pool liquidity for better volume estimation
  setPoolLiquidity(chainId: string, tokenAddress: string, liquidityUsd: number) {
    const key = `${chainId}:${tokenAddress}`;
    this.poolLiquidity.set(key, liquidityUsd);
  }

  // Clean up all subscriptions
  destroy() {
    this.eventSource?.close();
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    this.callbacks.clear();
    this.lastPrices.clear();
    this.ohlcvCallbacks.clear();
    this.currentBars.clear();
    this.barIntervals.clear();
    this.tradeCallbacks.clear();
    this.poolLiquidity.clear();
  }
}

// Singleton instance
let realtimeService: RealtimePriceService | null = null;

export function getRealtimeService(): RealtimePriceService {
  if (!realtimeService) {
    realtimeService = new RealtimePriceService();
  }
  return realtimeService;
}
