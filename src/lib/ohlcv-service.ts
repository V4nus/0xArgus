// OHLCV Pre-computation Service
// Fetches and caches candlestick data for faster queries

import prisma from '@/lib/db';
import axios from 'axios';
import { TimeInterval, OHLCVData } from '@/types';


const GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

// Chain ID mapping for GeckoTerminal
const CHAIN_TO_GECKO: Record<string, string> = {
  'base': 'base',
  'ethereum': 'eth',
  'bsc': 'bsc',
  'arbitrum': 'arbitrum',
  'polygon': 'polygon_pos',
  'solana': 'solana',
};

// Time interval to milliseconds
const INTERVAL_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

// GeckoTerminal API params
const INTERVAL_TO_GECKO: Record<string, { aggregate: number; timeframe: string }> = {
  '1m': { aggregate: 1, timeframe: 'minute' },
  '5m': { aggregate: 5, timeframe: 'minute' },
  '15m': { aggregate: 15, timeframe: 'minute' },
  '1h': { aggregate: 1, timeframe: 'hour' },
  '4h': { aggregate: 4, timeframe: 'hour' },
  '1d': { aggregate: 1, timeframe: 'day' },
};

// Supported intervals for pre-computation
const SYNC_INTERVALS: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

/**
 * Fetch OHLCV data from GeckoTerminal API
 */
async function fetchOHLCVFromAPI(
  chainId: string,
  poolAddress: string,
  interval: string,
  limit: number = 300
): Promise<OHLCVData[]> {
  const geckoChain = CHAIN_TO_GECKO[chainId] || chainId;
  const params = INTERVAL_TO_GECKO[interval];

  if (!params) {
    console.error(`Unsupported interval: ${interval}`);
    return [];
  }

  try {
    const response = await axios.get(
      `${GECKOTERMINAL_API}/networks/${geckoChain}/pools/${poolAddress}/ohlcv/${params.timeframe}`,
      {
        params: {
          aggregate: params.aggregate,
          limit,
          currency: 'usd',
        },
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    const ohlcvList = response.data?.data?.attributes?.ohlcv_list || [];

    return ohlcvList.map((item: number[]) => {
      const timestamp = item[0];
      const timeInSeconds = timestamp > 1e12 ? Math.floor(timestamp / 1000) : timestamp;
      return {
        time: timeInSeconds,
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
      };
    }).reverse(); // Oldest first
  } catch (error) {
    console.error(`Error fetching OHLCV for ${chainId}/${poolAddress}:`, error);
    return [];
  }
}

/**
 * Round timestamp to interval boundary
 */
function roundToInterval(timestamp: Date, intervalMs: number): Date {
  const ms = timestamp.getTime();
  return new Date(Math.floor(ms / intervalMs) * intervalMs);
}

/**
 * Save OHLCV candles to database
 */
async function saveCandles(
  chainId: string,
  poolAddress: string,
  interval: string,
  candles: OHLCVData[]
): Promise<number> {
  if (candles.length === 0) return 0;

  const poolAddrLower = poolAddress.toLowerCase();
  let savedCount = 0;

  // Batch upsert candles
  for (const candle of candles) {
    const timestamp = new Date(candle.time * 1000);

    try {
      await prisma.oHLCVCandle.upsert({
        where: {
          chainId_poolAddress_interval_timestamp: {
            chainId,
            poolAddress: poolAddrLower,
            interval,
            timestamp,
          },
        },
        update: {
          high: Math.max(candle.high, candle.open, candle.close),
          low: Math.min(candle.low, candle.open, candle.close),
          close: candle.close,
          volume: candle.volume,
          updatedAt: new Date(),
        },
        create: {
          chainId,
          poolAddress: poolAddrLower,
          interval,
          timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          tradeCount: 0,
        },
      });
      savedCount++;
    } catch (error) {
      // Ignore duplicate errors
      console.error(`Error saving candle:`, error);
    }
  }

  return savedCount;
}

/**
 * Sync OHLCV data for a specific pool and interval
 */
export async function syncPoolOHLCV(
  chainId: string,
  poolAddress: string,
  interval: TimeInterval = '1h',
  limit: number = 300
): Promise<{ success: boolean; candleCount: number; message: string }> {
  const poolAddrLower = poolAddress.toLowerCase();

  try {
    // Fetch from API
    const candles = await fetchOHLCVFromAPI(chainId, poolAddrLower, interval, limit);

    if (candles.length === 0) {
      return { success: false, candleCount: 0, message: 'No data returned from API' };
    }

    // Save to database
    const savedCount = await saveCandles(chainId, poolAddrLower, interval, candles);

    // Update sync status
    const lastCandle = candles[candles.length - 1];
    await prisma.oHLCVSyncStatus.upsert({
      where: {
        chainId_poolAddress_interval: {
          chainId,
          poolAddress: poolAddrLower,
          interval,
        },
      },
      update: {
        lastSyncTime: new Date(lastCandle.time * 1000),
        lastFetchTime: new Date(),
        isActive: true,
      },
      create: {
        chainId,
        poolAddress: poolAddrLower,
        interval,
        lastSyncTime: new Date(lastCandle.time * 1000),
        lastFetchTime: new Date(),
        isActive: true,
      },
    });

    return {
      success: true,
      candleCount: savedCount,
      message: `Synced ${savedCount} candles for ${interval}`,
    };
  } catch (error) {
    console.error(`Error syncing OHLCV for ${chainId}/${poolAddress}/${interval}:`, error);
    return {
      success: false,
      candleCount: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all intervals for a pool
 */
export async function syncPoolAllIntervals(
  chainId: string,
  poolAddress: string
): Promise<{ interval: string; success: boolean; candleCount: number }[]> {
  const results = [];

  for (const interval of SYNC_INTERVALS) {
    // Rate limit: wait 200ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = await syncPoolOHLCV(chainId, poolAddress, interval);
    results.push({
      interval,
      success: result.success,
      candleCount: result.candleCount,
    });
  }

  return results;
}

/**
 * Get cached OHLCV data from database
 */
export async function getCachedOHLCV(
  chainId: string,
  poolAddress: string,
  interval: TimeInterval,
  limit: number = 300
): Promise<OHLCVData[]> {
  const poolAddrLower = poolAddress.toLowerCase();

  try {
    const candles = await prisma.oHLCVCandle.findMany({
      where: {
        chainId,
        poolAddress: poolAddrLower,
        interval,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    // Convert to OHLCVData format and reverse for oldest-first order
    return candles.reverse().map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
  } catch (error) {
    console.error(`Error getting cached OHLCV:`, error);
    return [];
  }
}

/**
 * Get OHLCV data with fallback to API if not cached
 */
export async function getOHLCVWithFallback(
  chainId: string,
  poolAddress: string,
  interval: TimeInterval,
  limit: number = 300
): Promise<{ data: OHLCVData[]; source: 'cache' | 'api' }> {
  // Try cache first
  const cached = await getCachedOHLCV(chainId, poolAddress, interval, limit);

  if (cached.length > 0) {
    // Check if cache is fresh enough (within 2 intervals)
    const intervalMs = INTERVAL_MS[interval] || 3600000;
    const latestCandleTime = cached[cached.length - 1].time * 1000;
    const now = Date.now();

    if (now - latestCandleTime < intervalMs * 2) {
      return { data: cached, source: 'cache' };
    }
  }

  // Cache miss or stale - fetch from API and update cache
  const apiData = await fetchOHLCVFromAPI(chainId, poolAddress, interval, limit);

  if (apiData.length > 0) {
    // Save to cache in background (don't wait)
    saveCandles(chainId, poolAddress, interval, apiData).catch(console.error);
  }

  return { data: apiData.length > 0 ? apiData : cached, source: apiData.length > 0 ? 'api' : 'cache' };
}

/**
 * Check sync status for a pool
 */
export async function getSyncStatus(
  chainId: string,
  poolAddress: string
): Promise<{ interval: string; lastSyncTime: Date; isActive: boolean }[]> {
  const poolAddrLower = poolAddress.toLowerCase();

  const statuses = await prisma.oHLCVSyncStatus.findMany({
    where: {
      chainId,
      poolAddress: poolAddrLower,
    },
    orderBy: {
      interval: 'asc',
    },
  });

  return statuses.map((s) => ({
    interval: s.interval,
    lastSyncTime: s.lastSyncTime,
    isActive: s.isActive,
  }));
}

/**
 * Register a pool for OHLCV sync (called when user views a pool)
 */
export async function registerPoolForSync(
  chainId: string,
  poolAddress: string
): Promise<void> {
  const poolAddrLower = poolAddress.toLowerCase();

  // Check if already registered for at least one interval
  const existing = await prisma.oHLCVSyncStatus.findFirst({
    where: {
      chainId,
      poolAddress: poolAddrLower,
    },
  });

  if (!existing) {
    // Trigger initial sync for all intervals in background
    console.log(`Registering pool for OHLCV sync: ${chainId}/${poolAddress}`);
    syncPoolAllIntervals(chainId, poolAddress).catch(console.error);
  }
}

/**
 * Get pools that need sync (for background job)
 */
export async function getPoolsNeedingSync(
  maxAge: number = 60000 // 1 minute
): Promise<{ chainId: string; poolAddress: string; interval: string }[]> {
  const cutoff = new Date(Date.now() - maxAge);

  const statuses = await prisma.oHLCVSyncStatus.findMany({
    where: {
      isActive: true,
      lastFetchTime: {
        lt: cutoff,
      },
    },
    orderBy: {
      lastFetchTime: 'asc',
    },
    take: 10, // Process 10 at a time
  });

  return statuses.map((s) => ({
    chainId: s.chainId,
    poolAddress: s.poolAddress,
    interval: s.interval,
  }));
}

/**
 * Background job: Sync all active pools
 */
export async function runSyncJob(): Promise<void> {
  console.log('Running OHLCV sync job...');

  const poolsToSync = await getPoolsNeedingSync();

  for (const pool of poolsToSync) {
    try {
      await syncPoolOHLCV(pool.chainId, pool.poolAddress, pool.interval as TimeInterval, 50);
      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Sync failed for ${pool.chainId}/${pool.poolAddress}:`, error);
    }
  }

  console.log(`OHLCV sync job completed. Processed ${poolsToSync.length} pools.`);
}
