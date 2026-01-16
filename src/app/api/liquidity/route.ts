import { NextRequest, NextResponse } from 'next/server';
import { getLiquidityDepth, getSimpleLiquidity, getV4LiquidityDepth, detectPoolType } from '@/lib/liquidity';
import { getLatestLiquidityFromDb, syncLiquidityDepth, syncPoolInfo } from '@/lib/db-sync';

// Validate EVM address (20 bytes = 40 hex chars + 0x prefix)
function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Check if it's a V4 pool ID (32 bytes = 64 hex chars + 0x prefix)
function isV4PoolId(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const priceUsd = parseFloat(searchParams.get('priceUsd') || '0');
  const token0Address = searchParams.get('token0Address');
  const token1Address = searchParams.get('token1Address');
  const levels = parseInt(searchParams.get('levels') || '0'); // 0 = full range (all ticks)
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!chainId || !poolAddress) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (chainId === 'solana') {
    return NextResponse.json({ error: 'Solana not supported yet' }, { status: 400 });
  }

  const cacheHeaders = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' };

  try {
    // Try database first (unless force refresh)
    if (!forceRefresh && !isV4PoolId(poolAddress)) {
      try {
        const dbData = await getLatestLiquidityFromDb(chainId, poolAddress);
        if (dbData && (dbData.bids.length > 0 || dbData.asks.length > 0)) {
          console.log('Serving liquidity from database');
          return NextResponse.json(
            { type: 'depth', data: dbData, version: 'v3', source: 'database' },
            { headers: cacheHeaders }
          );
        }
      } catch (dbError) {
        console.warn('Database lookup failed, falling back to RPC:', dbError);
      }
    }

    // Check if address is valid EVM format (for V2/V3)
    if (!isV4PoolId(poolAddress) && !isValidEvmAddress(poolAddress)) {
      return NextResponse.json({
        error: 'Pool address format not supported for on-chain queries. This may be a non-standard pool type.'
      }, { status: 400 });
    }

    // Detect pool type first
    const poolType = await detectPoolType(chainId, poolAddress);
    console.log(`[Liquidity API] Pool ${poolAddress} detected as ${poolType}`);

    // Handle based on pool type
    if (poolType === 'v4') {
      if (!token0Address || !token1Address) {
        return NextResponse.json({
          error: 'V4 pools require token addresses'
        }, { status: 400 });
      }

      const depth = await getV4LiquidityDepth(
        chainId,
        poolAddress,
        priceUsd,
        token0Address,
        token1Address,
        levels
      );

      if (depth && (depth.bids.length > 0 || depth.asks.length > 0)) {
        return NextResponse.json(
          { type: 'depth', data: depth, version: 'v4', source: 'rpc' },
          { headers: cacheHeaders }
        );
      }

      return NextResponse.json({ error: 'No V4 liquidity data available' }, { status: 404 });
    }

    if (poolType === 'v3') {
      const depth = await getLiquidityDepth(chainId, poolAddress, priceUsd, levels);

      if (depth && (depth.bids.length > 0 || depth.asks.length > 0)) {
        // Save to database in background (don't await)
        syncPoolInfo(chainId, poolAddress).catch(console.error);
        syncLiquidityDepth(chainId, poolAddress, priceUsd).catch(console.error);

        return NextResponse.json(
          { type: 'depth', data: depth, version: 'v3', source: 'rpc' },
          { headers: cacheHeaders }
        );
      }

      return NextResponse.json({ error: 'No V3 liquidity data available' }, { status: 404 });
    }

    if (poolType === 'v2') {
      // V2 pools use constant product formula (x*y=k) with continuous liquidity
      // They don't have discrete tick levels like V3/V4, so we show simple reserves
      const simple = await getSimpleLiquidity(chainId, poolAddress);
      if (simple) {
        return NextResponse.json(
          { type: 'simple', data: simple, version: 'v2', source: 'rpc' },
          { headers: cacheHeaders }
        );
      }

      return NextResponse.json({ error: 'No V2 liquidity data available' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Unknown pool type - cannot fetch liquidity data' }, { status: 404 });
  } catch (error) {
    console.error('Liquidity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch liquidity data' }, { status: 500 });
  }
}
