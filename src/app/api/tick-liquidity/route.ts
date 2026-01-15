/**
 * API: Get tick liquidity distribution for a pool
 * Returns liquidity at each initialized tick and large liquidity clusters
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanPoolLiquidity, tickToPrice } from '@/lib/tick-liquidity';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const token0Decimals = parseInt(searchParams.get('token0Decimals') || '18');
  const token1Decimals = parseInt(searchParams.get('token1Decimals') || '18');
  const tickRange = parseInt(searchParams.get('tickRange') || '5000');
  const tickSpacing = searchParams.get('tickSpacing') ? parseInt(searchParams.get('tickSpacing')!) : undefined;
  const priceUsd = parseFloat(searchParams.get('priceUsd') || '0'); // Current USD price for calculations

  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { error: 'Missing chainId or poolAddress' },
      { status: 400 }
    );
  }

  try {
    console.log(`[API tick-liquidity] Scanning ${chainId}/${poolAddress.slice(0, 10)}...`);

    const result = await scanPoolLiquidity(
      chainId,
      poolAddress,
      token0Decimals,
      token1Decimals,
      tickRange,
      tickSpacing
    );

    // Convert prices to USD if priceUsd is provided
    // The tick prices are in token0/token1 ratio, we need to convert to USD
    let ticksWithUsd = result.ticks;
    let clustersWithUsd = result.clusters;

    if (priceUsd > 0) {
      // Calculate conversion factor from token ratio to USD
      // currentPrice (from tick) * factor = priceUsd
      const factor = priceUsd / result.currentPrice;

      ticksWithUsd = result.ticks.map(t => ({
        ...t,
        priceUsd: t.price * factor,
      }));

      clustersWithUsd = result.clusters.map(c => ({
        ...c,
        priceLowerUsd: c.priceLower * factor,
        priceUpperUsd: c.priceUpper * factor,
      }));
    }

    // Format for response
    const response = {
      success: true,
      data: {
        currentTick: result.currentTick,
        currentPrice: result.currentPrice,
        currentPriceUsd: priceUsd || undefined,
        totalLiquidity: result.totalLiquidity,

        // All initialized ticks with liquidity (sorted by tick)
        ticks: ticksWithUsd.slice(0, 500), // Limit to 500 ticks

        // Large liquidity clusters (potential "big orders")
        clusters: clustersWithUsd.map(c => ({
          tickLower: c.tickLower,
          tickUpper: c.tickUpper,
          priceLower: c.priceLower,
          priceUpper: c.priceUpper,
          priceLowerUsd: (c as { priceLowerUsd?: number }).priceLowerUsd,
          priceUpperUsd: (c as { priceUpperUsd?: number }).priceUpperUsd,
          totalLiquidity: c.totalLiquidity,
          tickCount: c.tickCount,
        })),

        stats: {
          totalTicks: result.ticks.length,
          clusterCount: result.clusters.length,
          tickRange,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API tick-liquidity] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to scan tick liquidity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
