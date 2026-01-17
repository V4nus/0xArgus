/**
 * x402 Paid Liquidity Depth API
 *
 * Returns cumulative liquidity curve data for any supported pool.
 * Payment: $0.002 USDC per request via x402 protocol.
 *
 * Query params:
 *   - chainId: Chain identifier (base, ethereum, bsc, arbitrum, polygon, solana)
 *   - poolAddress: Pool address
 *   - priceUsd: Current price in USD (optional, will be fetched if not provided)
 *   - maxLevels: Max price levels to return (default: 100)
 *   - precision: Price precision for subdividing levels (optional)
 */

import { NextRequest, NextResponse } from 'next/server';

// 直接调用内部 API
async function fetchLiquidityDepth(
  chainId: string,
  poolAddress: string,
  priceUsd: number,
  maxLevels: number = 100,
  precision: number = 0
) {
  const params = new URLSearchParams({
    chainId,
    poolAddress,
    priceUsd: priceUsd.toString(),
    maxLevels: maxLevels.toString(),
  });

  if (precision > 0) {
    params.set('precision', precision.toString());
  }

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
  const maxLevels = parseInt(searchParams.get('maxLevels') || '100');
  const precision = parseFloat(searchParams.get('precision') || '0');
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

    // 获取流动性深度数据
    const result = await fetchLiquidityDepth(chainId, poolAddress, priceUsd, maxLevels, precision);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch liquidity depth',
        },
        { status: 500 }
      );
    }

    const { data } = result;

    // 计算累积流动性曲线
    let cumulativeBidLiquidity = 0;
    let cumulativeAskLiquidity = 0;

    const bidCurve = data.bids.map((bid: any) => {
      cumulativeBidLiquidity += bid.liquidityUSD;
      return {
        price: bid.price,
        liquidityUSD: bid.liquidityUSD,
        cumulativeLiquidityUSD: cumulativeBidLiquidity,
        token0Amount: bid.token0Amount,
        token1Amount: bid.token1Amount,
        priceImpactPercent: ((data.currentPrice - bid.price) / data.currentPrice) * 100,
      };
    });

    const askCurve = data.asks.map((ask: any) => {
      cumulativeAskLiquidity += ask.liquidityUSD;
      return {
        price: ask.price,
        liquidityUSD: ask.liquidityUSD,
        cumulativeLiquidityUSD: cumulativeAskLiquidity,
        token0Amount: ask.token0Amount,
        token1Amount: ask.token1Amount,
        priceImpactPercent: ((ask.price - data.currentPrice) / data.currentPrice) * 100,
      };
    });

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
        bidCurve,
        askCurve,
        stats: {
          totalBidLiquidity: cumulativeBidLiquidity,
          totalAskLiquidity: cumulativeAskLiquidity,
          bidLevels: bidCurve.length,
          askLevels: askCurve.length,
          // 深度指标
          depthRatio: cumulativeBidLiquidity > 0
            ? cumulativeAskLiquidity / cumulativeBidLiquidity
            : 0,
          // 1% 价格变动所需流动性
          liquidityAt1PercentBid: bidCurve.find((b: any) => b.priceImpactPercent >= 1)?.cumulativeLiquidityUSD || 0,
          liquidityAt1PercentAsk: askCurve.find((a: any) => a.priceImpactPercent >= 1)?.cumulativeLiquidityUSD || 0,
          // 5% 价格变动所需流动性
          liquidityAt5PercentBid: bidCurve.find((b: any) => b.priceImpactPercent >= 5)?.cumulativeLiquidityUSD || 0,
          liquidityAt5PercentAsk: askCurve.find((a: any) => a.priceImpactPercent >= 5)?.cumulativeLiquidityUSD || 0,
        },
      },
      meta: {
        chainId,
        poolAddress,
        timestamp: Date.now(),
        pricing: {
          cost: '$0.002',
          currency: 'USDC',
          network: 'Base',
        },
      },
    });
  } catch (error) {
    console.error('[x402/liquidity-depth] Error:', error);
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
