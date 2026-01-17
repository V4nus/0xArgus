/**
 * Real-time Pool Events Service
 *
 * Uses polling to check for pool updates and trigger Order Book refreshes.
 * Supports: V2, V3, V4 (EVM) and Solana
 *
 * Note: WebSocket event subscription was removed due to browser compatibility
 * issues with viem's WebSocket transport. Polling provides reliable updates.
 */

// Event types that affect liquidity
export type PoolEventType = 'swap' | 'mint' | 'burn' | 'sync';

export interface PoolEvent {
  type: PoolEventType;
  poolAddress: string;
  chainId: string;
  timestamp: number;
  txHash?: string;
}

type PoolEventCallback = (event: PoolEvent) => void;

// Polling intervals (in milliseconds)
const POLL_INTERVAL_ACTIVE = 3000; // 3 seconds for active pools
const POLL_INTERVAL_IDLE = 10000; // 10 seconds for idle state

interface Subscription {
  chainId: string;
  poolAddress: string;
  poolType: 'v2' | 'v3' | 'v4';
  callbacks: Set<PoolEventCallback>;
  pollInterval?: NodeJS.Timeout;
  lastActivity: number;
}

class PoolEventsService {
  private subscriptions = new Map<string, Subscription>();
  private isClient = typeof window !== 'undefined';

  private getSubscriptionKey(chainId: string, poolAddress: string): string {
    return `${chainId}:${poolAddress.toLowerCase()}`;
  }

  /**
   * Subscribe to pool events (uses polling)
   */
  subscribe(
    chainId: string,
    poolAddress: string,
    poolType: 'v2' | 'v3' | 'v4',
    callback: PoolEventCallback
  ): () => void {
    // Skip on server side
    if (!this.isClient) {
      return () => {};
    }

    const key = this.getSubscriptionKey(chainId, poolAddress);

    // Check if subscription already exists
    let subscription = this.subscriptions.get(key);

    if (subscription) {
      // Add callback to existing subscription
      subscription.callbacks.add(callback);
      subscription.lastActivity = Date.now();
      console.log(`[PoolEvents] Added callback to existing subscription: ${key}`);
    } else {
      // Create new subscription
      subscription = {
        chainId,
        poolAddress,
        poolType,
        callbacks: new Set([callback]),
        lastActivity: Date.now(),
      };
      this.subscriptions.set(key, subscription);

      // Start polling
      this.startPolling(subscription);
      console.log(`[PoolEvents] Started polling for ${poolType} pool: ${key}`);
    }

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(key);
      if (sub) {
        sub.callbacks.delete(callback);
        if (sub.callbacks.size === 0) {
          // No more callbacks, stop polling
          if (sub.pollInterval) {
            clearInterval(sub.pollInterval);
          }
          this.subscriptions.delete(key);
          console.log(`[PoolEvents] Removed subscription: ${key}`);
        }
      }
    };
  }

  /**
   * Start polling for pool updates
   */
  private startPolling(subscription: Subscription) {
    const key = this.getSubscriptionKey(subscription.chainId, subscription.poolAddress);

    // Clear any existing interval
    if (subscription.pollInterval) {
      clearInterval(subscription.pollInterval);
    }

    // Determine poll interval based on activity
    const getPollInterval = () => {
      const timeSinceActivity = Date.now() - subscription.lastActivity;
      // If no activity in last 30 seconds, slow down polling
      return timeSinceActivity > 30000 ? POLL_INTERVAL_IDLE : POLL_INTERVAL_ACTIVE;
    };

    const poll = () => {
      if (!this.subscriptions.has(key)) {
        return;
      }

      // Emit a sync event to trigger refresh
      const event: PoolEvent = {
        type: 'sync',
        poolAddress: subscription.poolAddress,
        chainId: subscription.chainId,
        timestamp: Date.now(),
      };

      subscription.callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[PoolEvents] Polling callback error:', error);
        }
      });
    };

    // Start with initial poll
    poll();

    // Set up recurring polls
    subscription.pollInterval = setInterval(() => {
      poll();

      // Adjust interval if needed (recreate interval with new timing)
      const currentInterval = getPollInterval();
      const sub = this.subscriptions.get(key);
      if (sub && sub.pollInterval) {
        // Check if we need to adjust the interval
        const timeSinceActivity = Date.now() - sub.lastActivity;
        if (timeSinceActivity > 30000 && currentInterval === POLL_INTERVAL_ACTIVE) {
          // Switch to idle polling
          clearInterval(sub.pollInterval);
          sub.pollInterval = setInterval(poll, POLL_INTERVAL_IDLE);
          console.log(`[PoolEvents] Switched to idle polling for ${key}`);
        }
      }
    }, POLL_INTERVAL_ACTIVE);
  }

  /**
   * Mark subscription as active (resets to fast polling)
   */
  markActive(chainId: string, poolAddress: string) {
    const key = this.getSubscriptionKey(chainId, poolAddress);
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.lastActivity = Date.now();

      // If currently in idle mode, restart with active polling
      if (subscription.pollInterval) {
        clearInterval(subscription.pollInterval);
        this.startPolling(subscription);
      }
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((subscription, key) => {
      if (subscription.pollInterval) {
        clearInterval(subscription.pollInterval);
      }
    });
    this.subscriptions.clear();
    console.log('[PoolEvents] Cleaned up all subscriptions');
  }

  /**
   * Get subscription count (for debugging)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Singleton instance
let poolEventsService: PoolEventsService | null = null;

export function getPoolEventsService(): PoolEventsService {
  if (!poolEventsService) {
    poolEventsService = new PoolEventsService();
  }
  return poolEventsService;
}

/**
 * Detect pool type from address
 */
export function detectPoolType(poolAddress: string): 'v2' | 'v3' | 'v4' {
  // V4 pools have 66-character hex ID (0x + 64 chars)
  if (poolAddress.length === 66) {
    return 'v4';
  }
  // For V2/V3, we'd need to check on-chain, but default to V3 for now
  // The actual detection happens in the API
  return 'v3';
}
