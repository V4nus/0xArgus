/**
 * x402 Paid Order Book API
 *
 * Returns real-time order book data for any supported pool.
 * Payment: $0.001 USDC per request via x402 protocol.
 *
 * Query params:
 *   - chainId: Chain identifier (base, ethereum, bsc, arbitrum, polygon, solana)
 *   - poolAddress: Pool address
 *   - maxLevels: Max price levels to return (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server';

// 重用现有的流动性深度逻辑
async function fetchOrderBook(
  chainId: string,
  poolAddress: string,
  priceUsd: number,
  maxLevels: number = 50
) {
  // 调用内部 API
  const params = new URLSearchParams({
    chainId,
    poolAddress,
    priceUsd: priceUsd.toString(),
    maxLevels: maxLevels.toString(),
  });

  const internalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/liquidity-depth?${params}`;

  const response = await fetch(internalUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch liquidity data: ${response.status}`);
  }

  return response.json();
}

// 获取当前价格
async function getCurrentPrice(chainId: string, poolAddress: string): Promise<number> {
  try {
    const params = new URLSearchParams({ chainId, poolAddress });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pool?${params}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.priceUsd || 0;
    }
  } catch (error) {
    console.error('Failed to fetch price:', error);
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const maxLevels = parseInt(searchParams.get('maxLevels') || '50');
  const priceUsdParam = searchParams.get('priceUsd');

  // 验证必需参数
  if (!chainId || !poolAddress) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters',
        required: ['chainId', 'poolAddress'],
      },
      { status: 400 }
    );
  }

  try {
    // 获取当前价格（如果未提供）
    let priceUsd = priceUsdParam ? parseFloat(priceUsdParam) : 0;
    if (!priceUsd || priceUsd <= 0) {
      priceUsd = await getCurrentPrice(chainId, poolAddress);
    }

    if (!priceUsd || priceUsd <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to determine current price. Please provide priceUsd parameter.',
        },
        { status: 400 }
      );
    }

    // 获取订单簿数据
    const result = await fetchOrderBook(chainId, poolAddress, priceUsd, maxLevels);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch order book',
        },
        { status: 500 }
      );
    }

    const { data } = result;

    // 格式化响应
    return NextResponse.json({
      success: true,
      data: {
        poolType: data.poolType,
        currentPrice: data.currentPrice,
        token0: {
          symbol: data.token0Symbol,
          decimals: data.token0Decimals,
        },
        token1: {
          symbol: data.token1Symbol,
          decimals: data.token1Decimals,
        },
        bids: data.bids.map((bid: any) => ({
          price: bid.price,
          liquidityUSD: bid.liquidityUSD,
          token0Amount: bid.token0Amount,
          token1Amount: bid.token1Amount,
        })),
        asks: data.asks.map((ask: any) => ({
          price: ask.price,
          liquidityUSD: ask.liquidityUSD,
          token0Amount: ask.token0Amount,
          token1Amount: ask.token1Amount,
        })),
        stats: {
          totalBidLiquidity: data.bids.reduce((sum: number, b: any) => sum + b.liquidityUSD, 0),
          totalAskLiquidity: data.asks.reduce((sum: number, a: any) => sum + a.liquidityUSD, 0),
          bidLevels: data.bids.length,
          askLevels: data.asks.length,
        },
      },
      meta: {
        chainId,
        poolAddress,
        timestamp: Date.now(),
        pricing: {
          cost: '$0.001',
          currency: 'USDC',
          network: 'Base',
        },
      },
    });
  } catch (error) {
    console.error('[x402/orderbook] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
