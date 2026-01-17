/**
 * Common Validators
 *
 * Centralized validation utilities to avoid code duplication.
 */

// ============ Address Validation ============

/** EVM address format (0x + 40 hex chars) */
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/** V4 Pool ID format (0x + 64 hex chars) */
export const V4_POOL_ID_REGEX = /^0x[a-fA-F0-9]{64}$/;

/** Solana address format (Base58, 32-44 chars) */
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Hex string format */
export const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Check if string is a valid EVM address
 */
export function isEVMAddress(address: string): boolean {
  return EVM_ADDRESS_REGEX.test(address);
}

/**
 * Check if string is a valid V4 pool ID
 */
export function isV4PoolId(poolId: string): boolean {
  return V4_POOL_ID_REGEX.test(poolId);
}

/**
 * Check if string is a valid Solana address
 */
export function isSolanaAddress(address: string): boolean {
  return SOLANA_ADDRESS_REGEX.test(address);
}

/**
 * Check if string is a valid hex string
 */
export function isHexString(hex: string): boolean {
  return HEX_STRING_REGEX.test(hex);
}

/**
 * Validate address based on chain
 */
export function isValidAddress(address: string, chainId: string): boolean {
  if (chainId === 'solana') {
    return isSolanaAddress(address);
  }
  return isEVMAddress(address) || isV4PoolId(address);
}

// ============ Number Validation ============

/**
 * Safely parse a float, returning default for invalid values
 */
export function safeParseFloat(
  value: string | number | undefined | null,
  defaultValue = 0
): number {
  if (value === undefined || value === null) return defaultValue;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}

/**
 * Safely parse an integer, returning default for invalid values
 */
export function safeParseInt(
  value: string | number | undefined | null,
  defaultValue = 0
): number {
  if (value === undefined || value === null) return defaultValue;
  const num = typeof value === 'number' ? Math.floor(value) : parseInt(value, 10);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}

/**
 * Check if number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Clamp a number to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============ Chain Validation ============

/** Supported EVM chains */
export const SUPPORTED_EVM_CHAINS = [
  'ethereum',
  'base',
  'bsc',
  'arbitrum',
  'polygon',
  'optimism',
  'avalanche',
] as const;

export type SupportedEVMChain = typeof SUPPORTED_EVM_CHAINS[number];

/** All supported chains including Solana */
export const SUPPORTED_CHAINS = [...SUPPORTED_EVM_CHAINS, 'solana'] as const;

export type SupportedChain = typeof SUPPORTED_CHAINS[number];

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: string): chainId is SupportedChain {
  return (SUPPORTED_CHAINS as readonly string[]).includes(chainId);
}

/**
 * Check if chain is an EVM chain
 */
export function isEVMChain(chainId: string): chainId is SupportedEVMChain {
  return (SUPPORTED_EVM_CHAINS as readonly string[]).includes(chainId);
}

// ============ Time Interval Validation ============

export const VALID_TIME_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;

export type TimeInterval = typeof VALID_TIME_INTERVALS[number];

/**
 * Check if interval is valid
 */
export function isValidInterval(interval: string): interval is TimeInterval {
  return (VALID_TIME_INTERVALS as readonly string[]).includes(interval);
}

// ============ API Response Validation ============

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate common API parameters
 */
export function validatePoolParams(
  chainId: string | null,
  poolAddress: string | null
): ValidationResult {
  if (!chainId) {
    return { valid: false, error: 'Missing chainId parameter' };
  }

  if (!poolAddress) {
    return { valid: false, error: 'Missing poolAddress parameter' };
  }

  if (!isSupportedChain(chainId)) {
    return { valid: false, error: `Unsupported chain: ${chainId}` };
  }

  if (!isValidAddress(poolAddress, chainId)) {
    return { valid: false, error: 'Invalid pool address format' };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  limit: number | string | null,
  offset: number | string | null,
  maxLimit = 1000
): ValidationResult & { limit: number; offset: number } {
  const parsedLimit = safeParseInt(limit, 100);
  const parsedOffset = safeParseInt(offset, 0);

  if (parsedLimit < 1 || parsedLimit > maxLimit) {
    return {
      valid: false,
      error: `Limit must be between 1 and ${maxLimit}`,
      limit: parsedLimit,
      offset: parsedOffset,
    };
  }

  if (parsedOffset < 0) {
    return {
      valid: false,
      error: 'Offset must be non-negative',
      limit: parsedLimit,
      offset: parsedOffset,
    };
  }

  return { valid: true, limit: parsedLimit, offset: parsedOffset };
}
