/**
 * Unified Cache Management Utility
 *
 * Provides a consistent caching interface with:
 * - Automatic TTL expiration
 * - Memory limit enforcement
 * - Periodic cleanup
 * - Statistics tracking
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface CacheOptions {
  maxSize?: number; // Maximum number of entries
  defaultTTL?: number; // Default TTL in ms
  cleanupInterval?: number; // How often to run cleanup (ms)
  onEvict?: (key: string, entry: CacheEntry<unknown>) => void;
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxSize: 1000,
  defaultTTL: 60000, // 1 minute
  cleanupInterval: 30000, // 30 seconds
  onEvict: () => {},
};

export class CacheManager<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;
  private stats: CacheStats = { size: 0, hits: 0, misses: 0, evictions: 0 };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCleanup();
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Enforce max size - evict least recently used if needed
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.options.defaultTTL,
      accessCount: 1,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.options.onEvict(key, entry as CacheEntry<unknown>);
        cleaned++;
      }
    }

    this.stats.size = this.cache.size;
    return cleaned;
  }

  /**
   * Destroy the cache manager (stop cleanup timer)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }

  // Private methods

  private startCleanup(): void {
    // Only run cleanup in browser or Node.js (not during SSR builds)
    if (typeof window !== 'undefined' || typeof process !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, this.options.cleanupInterval);

      // Prevent timer from keeping Node.js process alive
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      if (entry) {
        this.options.onEvict(oldestKey, entry as CacheEntry<unknown>);
      }
    }
  }
}

// ============ Singleton Instances ============

// Pool info cache (longer TTL, smaller size)
export const poolInfoCache = new CacheManager({
  maxSize: 500,
  defaultTTL: 60000, // 1 minute
  cleanupInterval: 30000,
});

// Token info cache (very long TTL - token metadata rarely changes)
export const tokenInfoCache = new CacheManager<{ decimals: number; symbol: string }>({
  maxSize: 2000,
  defaultTTL: 3600000, // 1 hour
  cleanupInterval: 300000, // 5 minutes
});

// Liquidity depth cache (short TTL)
export const liquidityDepthCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 5000, // 5 seconds
  cleanupInterval: 10000,
});

// OHLCV cache (medium TTL)
export const ohlcvCache = new CacheManager({
  maxSize: 300,
  defaultTTL: 60000, // 1 minute
  cleanupInterval: 30000,
});

// Search results cache
export const searchCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 60000, // 1 minute
  cleanupInterval: 30000,
});

// ============ Helper Functions ============

/**
 * Generate a cache key from multiple parts
 */
export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join(':');
}

/**
 * Wrap an async function with caching
 */
export function withCache<T>(
  cache: CacheManager<T>,
  keyFn: (...args: unknown[]) => string,
  fn: (...args: unknown[]) => Promise<T>,
  ttl?: number
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]): Promise<T> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
}
