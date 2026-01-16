/**
 * Centralized cache configuration
 * All cache TTLs and strategies in one place
 */

/**
 * Cache TTL (Time To Live) configuration in milliseconds
 */
export const CACHE_TTL = {
  // API Data Caches
  POOL_INFO: 60 * 1000, // 1 minute - Pool metadata changes rarely
  OHLCV: 60 * 1000, // 1 minute - Historical candles don't change
  OHLCV_LATEST: 10 * 1000, // 10 seconds - Latest candle updates frequently
  SEARCH: 60 * 1000, // 1 minute - Search results
  TOKEN_INFO: 60 * 60 * 1000, // 1 hour - Token decimals/symbol rarely change
  LIQUIDITY_DEPTH: 5 * 1000, // 5 seconds - On-chain liquidity changes fast
  TRENDING: 60 * 60 * 1000, // 1 hour - Trending pools update hourly
  LARGE_TRADES: 30 * 1000, // 30 seconds - Trade history
  QUOTE_PRICE: 60 * 1000, // 1 minute - USD price of quote tokens

  // Database Caches
  LP_POSITIONS: 2 * 60 * 60 * 1000, // 2 hours - Sync interval
  LIQUIDITY_SNAPSHOT: 5 * 60 * 1000, // 5 minutes - Historical snapshots

  // Component State Caches
  WALLET_BALANCE: 10 * 1000, // 10 seconds - User balance
  ALLOWANCE: 30 * 1000, // 30 seconds - Token allowance
} as const;

/**
 * Polling intervals for real-time data
 */
export const POLL_INTERVAL = {
  // Real-time Updates
  PRICE: 1 * 1000, // 1 second - Real-time price
  OHLCV: 10 * 1000, // 10 seconds - Chart updates
  LIQUIDITY_DEPTH: 6 * 1000, // 6 seconds - Slightly after API cache expires (5s)
  TRADES: 5 * 1000, // 5 seconds - Recent trades
  BALANCE: 15 * 1000, // 15 seconds - Wallet balance updates

  // Background Updates
  LP_SYNC: 2 * 60 * 60 * 1000, // 2 hours - LP position sync
  POOL_STATS: 30 * 1000, // 30 seconds - Pool statistics
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  // Per IP rate limits
  DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 req/min
  LIQUIDITY: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 req/min (expensive queries)
  SEARCH: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req/min

  // Global rate limits for external APIs
  DEXSCREENER: { maxRequests: 300, windowMs: 60 * 1000 }, // DexScreener limit
  GECKOTERMINAL: { maxRequests: 300, windowMs: 60 * 1000 }, // GeckoTerminal limit
  DUNE: { maxRequests: 20, windowMs: 60 * 1000 }, // Dune Analytics (free tier)
} as const;

/**
 * Cache size limits (number of entries)
 */
export const CACHE_SIZE_LIMIT = {
  MEMORY_CACHE: 1000, // Max entries in memory cache
  POOL_INFO: 500,
  OHLCV: 100, // Per pool, per interval
  TOKEN_INFO: 1000,
  SEARCH: 100,
} as const;

/**
 * WebSocket configuration
 */
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 1000, // Initial reconnect delay (ms)
  MAX_RECONNECT_INTERVAL: 30000, // Max reconnect delay (30s)
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000, // Heartbeat every 30s
  TIMEOUT: 10000, // Connection timeout (10s)
} as const;

/**
 * RPC configuration
 */
export const RPC_CONFIG = {
  TIMEOUT: 30000, // 30 seconds RPC timeout
  MAX_RETRIES: 3, // Retry failed requests 3 times
  RETRY_DELAY: 1000, // Wait 1s between retries
  BATCH_SIZE: 256, // Max items per multicall batch
} as const;

/**
 * Database query limits
 */
export const DB_LIMITS = {
  MAX_LP_POSITIONS: 1000, // Max LP positions to fetch at once
  MAX_TRADES: 500, // Max trades to fetch at once
  MAX_OHLCV_CANDLES: 1000, // Max candles per query
  PAGINATION_SIZE: 50, // Default pagination size
} as const;

/**
 * Check if cache should be refreshed based on data type
 */
export function shouldRefreshCache(
  dataType: keyof typeof CACHE_TTL,
  lastUpdate: number
): boolean {
  const ttl = CACHE_TTL[dataType];
  return Date.now() - lastUpdate > ttl;
}

/**
 * Get optimal polling interval based on user visibility
 */
export function getAdaptivePollingInterval(
  baseInterval: number,
  isVisible: boolean
): number {
  // Slow down polling when tab is not visible
  return isVisible ? baseInterval : baseInterval * 4;
}

/**
 * Cache cleanup interval (remove expired entries)
 */
export const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean every 5 minutes

/**
 * Calculate backoff delay for retries
 */
export function calculateBackoff(attempt: number, baseDelay = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30s
}
