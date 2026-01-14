import { NextRequest, NextResponse } from 'next/server';

// 0x API endpoints per chain
const ZEROX_API_BASE: Record<number, string> = {
  1: 'https://api.0x.org',      // Ethereum
  8453: 'https://base.api.0x.org', // Base
  42161: 'https://arbitrum.api.0x.org', // Arbitrum
  137: 'https://polygon.api.0x.org', // Polygon
  10: 'https://optimism.api.0x.org', // Optimism
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const chainId = parseInt(searchParams.get('chainId') || '1');
  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const takerAddress = searchParams.get('takerAddress');
  const slippageBps = parseInt(searchParams.get('slippageBps') || '50');

  if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const baseUrl = ZEROX_API_BASE[chainId];
  if (!baseUrl) {
    return NextResponse.json(
      { error: `Chain ${chainId} not supported by 0x` },
      { status: 400 }
    );
  }

  // Convert slippage from basis points to percentage
  const slippagePercentage = slippageBps / 10000;

  const queryParams = new URLSearchParams({
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    slippagePercentage: slippagePercentage.toString(),
  });

  try {
    const response = await fetch(`${baseUrl}/swap/v1/quote?${queryParams}`, {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('0x API error:', errorData);
      return NextResponse.json(
        { error: errorData.reason || `0x API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      sellAmount: data.sellAmount,
      buyAmount: data.buyAmount,
      price: data.price,
      guaranteedPrice: data.guaranteedPrice,
      to: data.to,
      data: data.data,
      value: data.value,
      gasPrice: data.gasPrice,
      estimatedGas: data.estimatedGas,
      allowanceTarget: data.allowanceTarget,
      sellTokenAddress: data.sellTokenAddress,
      buyTokenAddress: data.buyTokenAddress,
    });
  } catch (error) {
    console.error('0x quote fetch error:', error);
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch quote from 0x' },
      { status: 500 }
    );
  }
}
