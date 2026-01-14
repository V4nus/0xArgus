/**
 * 0x API integration for instant swaps
 * Used for small trades where CoW batch auctions may timeout
 */

// Chains supported by 0x
export const ZEROX_SUPPORTED_CHAINS = [1, 8453, 42161, 137, 10];

export function isZeroXSupported(chainId: number): boolean {
  return ZEROX_SUPPORTED_CHAINS.includes(chainId);
}

export interface ZeroXQuoteParams {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress: string;
  slippageBps?: number;
}

export interface ZeroXQuote {
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  estimatedGas: string;
  allowanceTarget: string;
  sellTokenAddress: string;
  buyTokenAddress: string;
}

/**
 * Get a swap quote from 0x API via our server-side route
 * This returns transaction data ready to be executed
 */
export async function getZeroXQuote(params: ZeroXQuoteParams): Promise<ZeroXQuote> {
  const { chainId, sellToken, buyToken, sellAmount, takerAddress, slippageBps = 50 } = params;

  const queryParams = new URLSearchParams({
    chainId: chainId.toString(),
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    slippageBps: slippageBps.toString(),
  });

  const response = await fetch(`/api/zerox-quote?${queryParams}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `0x API error: ${response.status}`);
  }

  return response.json();
}

// Minimum trade amounts for CoW (below this, use 0x)
// Values in USD equivalent
export const COW_MIN_TRADE_USD = 50;

/**
 * Determine which aggregator to use based on trade size
 * @param amountUsd The trade amount in USD
 * @returns 'cow' for batch auction or 'zerox' for instant swap
 */
export function selectAggregator(amountUsd: number): 'cow' | 'zerox' {
  return amountUsd >= COW_MIN_TRADE_USD ? 'cow' : 'zerox';
}
