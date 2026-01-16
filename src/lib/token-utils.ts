/**
 * Token utility functions
 * Consolidates repeated token-related logic
 */

import type { PublicClient } from 'viem';
import { parseAbi } from 'viem';

// ERC20 ABI for token info queries
const ERC20_ABI = parseAbi([
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
]);

// Cache for token info to avoid repeated RPC calls
interface TokenInfo {
  decimals: number;
  symbol: string;
  name: string;
}

interface CacheEntry {
  data: TokenInfo;
  timestamp: number;
}

const tokenInfoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get token information (decimals, symbol, name) with caching
 */
export async function getTokenInfo(
  client: PublicClient,
  tokenAddress: string
): Promise<TokenInfo> {
  // Check cache first
  const cacheKey = `${client.chain?.id || 'unknown'}-${tokenAddress.toLowerCase()}`;
  const cached = tokenInfoCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Batch query all token info
    const [decimals, symbol, name] = await Promise.all([
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name',
      }),
    ]);

    const info: TokenInfo = {
      decimals: Number(decimals),
      symbol: symbol as string,
      name: name as string,
    };

    // Cache the result
    tokenInfoCache.set(cacheKey, {
      data: info,
      timestamp: Date.now(),
    });

    return info;
  } catch (error) {
    console.warn(`Failed to get token info for ${tokenAddress}:`, error);

    // Return defaults
    return {
      decimals: 18,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
    };
  }
}

/**
 * Get only token decimals (faster than full info)
 */
export async function getTokenDecimals(
  client: PublicClient,
  tokenAddress: string
): Promise<number> {
  const info = await getTokenInfo(client, tokenAddress);
  return info.decimals;
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
  client: PublicClient,
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint> {
  try {
    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress as `0x${string}`],
    });

    return balance as bigint;
  } catch (error) {
    console.warn(`Failed to get balance for ${tokenAddress}:`, error);
    return 0n;
  }
}

/**
 * Check if an address is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if an address is likely a token contract (has code)
 */
export async function isTokenContract(
  client: PublicClient,
  address: string
): Promise<boolean> {
  if (!isValidAddress(address)) return false;

  try {
    const code = await client.getBytecode({
      address: address as `0x${string}`,
    });

    return code !== undefined && code !== '0x';
  } catch {
    return false;
  }
}

/**
 * Check if a token is native (ETH, MATIC, BNB, etc.)
 */
export function isNativeToken(address: string, chainId?: number): boolean {
  const lowerAddress = address.toLowerCase();

  // Common native token addresses
  const nativeAddresses = [
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Generic ETH placeholder
    '0x0000000000000000000000000000000000000000', // Zero address
  ];

  // WETH/WMATIC/WBNB addresses by chain
  const wrappedNativeByChain: Record<number, string[]> = {
    1: ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'], // WETH on Ethereum
    8453: ['0x4200000000000000000000000000000000000006'], // WETH on Base
    56: ['0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'], // WBNB on BSC
    137: ['0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'], // WMATIC on Polygon
  };

  // Check generic native addresses
  if (nativeAddresses.includes(lowerAddress)) return true;

  // Check chain-specific wrapped native
  if (chainId && wrappedNativeByChain[chainId]) {
    return wrappedNativeByChain[chainId].includes(lowerAddress);
  }

  return false;
}

/**
 * Get native token symbol for a chain
 */
export function getNativeTokenSymbol(chainId: number): string {
  const nativeSymbols: Record<number, string> = {
    1: 'ETH',
    8453: 'ETH',
    56: 'BNB',
    137: 'MATIC',
    42161: 'ETH',
    10: 'ETH',
  };

  return nativeSymbols[chainId] || 'ETH';
}

/**
 * Convert token amount from wei to human-readable format
 */
export function fromWei(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Convert human-readable amount to wei
 */
export function toWei(amount: number, decimals: number): bigint {
  const multiplier = Math.pow(10, decimals);
  return BigInt(Math.floor(amount * multiplier));
}

/**
 * Calculate token price impact for a trade
 */
export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  currentPrice: number
): number {
  if (currentPrice === 0 || inputAmount === 0) return 0;

  const expectedOutput = inputAmount * currentPrice;
  const priceImpact = ((expectedOutput - outputAmount) / expectedOutput) * 100;

  return Math.max(0, priceImpact); // Price impact is always positive
}

/**
 * Sort tokens by a standard order (for pair naming)
 */
export function sortTokens(
  token0: { address: string; symbol: string },
  token1: { address: string; symbol: string }
): [typeof token0, typeof token1] {
  // Sort by address (standard Uniswap ordering)
  return token0.address.toLowerCase() < token1.address.toLowerCase()
    ? [token0, token1]
    : [token1, token0];
}

/**
 * Format a token pair name (e.g., "WETH/USDC")
 */
export function formatPairName(baseSymbol: string, quoteSymbol: string): string {
  return `${baseSymbol}/${quoteSymbol}`;
}

/**
 * Clear token info cache (useful for testing or forcing refresh)
 */
export function clearTokenCache(): void {
  tokenInfoCache.clear();
}
