/**
 * Unified formatting utilities for numbers, prices, and tokens
 * Consolidates repeated formatting logic across components
 */

/**
 * Format a number with appropriate suffixes (K, M, B, T)
 */
export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
  }
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }

  return `${sign}${absValue.toFixed(decimals)}`;
}

/**
 * Format a price with intelligent decimal places based on magnitude
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) return '$0.00';

  const absPrice = Math.abs(price);

  // For very small prices, show more decimals
  if (absPrice < 0.000001) {
    return `$${price.toExponential(2)}`;
  }
  if (absPrice < 0.01) {
    return `$${price.toFixed(6)}`;
  }
  if (absPrice < 1) {
    return `$${price.toFixed(4)}`;
  }
  if (absPrice < 1000) {
    return `$${price.toFixed(2)}`;
  }

  // For large prices, use number formatting
  return `$${formatNumber(price, 2)}`;
}

/**
 * Format a USD amount with dollar sign
 */
export function formatUSD(amount: number | undefined | null, decimals = 2): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1e6) {
    return `${sign}$${formatNumber(absAmount, decimals)}`;
  }

  return `${sign}$${absAmount.toFixed(decimals)}`;
}

/**
 * Format a token balance with appropriate decimals
 */
export function formatBalance(
  balance: number | bigint | undefined | null,
  decimals = 4
): string {
  if (balance === undefined || balance === null) return '0';

  const numBalance = typeof balance === 'bigint' ? Number(balance) : balance;

  if (isNaN(numBalance)) return '0';

  // For very small balances
  if (numBalance < 0.0001) {
    return numBalance.toExponential(2);
  }

  // For normal balances
  if (numBalance < 1) {
    return numBalance.toFixed(6);
  }

  return numBalance.toFixed(decimals);
}

/**
 * Format a percentage with sign
 */
export function formatPercentage(
  value: number | undefined | null,
  decimals = 2,
  includeSign = true
): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';

  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a price precision value (for order book)
 */
export function formatPrecision(precision: number, decimals: number): string {
  if (precision <= 0 || !isFinite(precision)) return '0';

  // Calculate appropriate decimal places based on precision
  const log = Math.log10(precision);
  const suggestedDecimals = Math.max(0, Math.ceil(-log) + 2);
  const effectiveDecimals = Math.min(suggestedDecimals, decimals);

  return precision.toFixed(effectiveDecimals);
}

/**
 * Format a large number with commas (e.g., 1,234,567)
 */
export function formatWithCommas(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';

  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a timestamp to a human-readable date
 */
export function formatDate(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Shorten an Ethereum address (0x1234...5678)
 */
export function shortenAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address || address.length < startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format a transaction hash with link-friendly format
 */
export function shortenTxHash(hash: string): string {
  return shortenAddress(hash, 10, 8);
}

/**
 * Parse and validate a number input (returns null if invalid)
 */
export function parseNumberInput(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || !isFinite(parsed)) return null;

  return parsed;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a gas price in Gwei
 */
export function formatGwei(wei: bigint | number): string {
  const gwei = typeof wei === 'bigint' ? Number(wei) / 1e9 : wei / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

/**
 * Calculate and format percentage change
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): { value: number; formatted: string } {
  if (oldValue === 0) return { value: 0, formatted: '0%' };

  const change = ((newValue - oldValue) / oldValue) * 100;
  return {
    value: change,
    formatted: formatPercentage(change),
  };
}
