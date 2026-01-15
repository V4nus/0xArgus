import { NextRequest, NextResponse } from 'next/server';
import {
  getLPPositions,
  getPositionsNearPrice,
  formatPosition,
  tickToPrice,
  LPPosition,
} from '@/lib/lp-positions';
import { getV4LPPositionsFromDune, isDuneAvailable } from '@/lib/dune';

// Check if it's a V4 pool ID (32 bytes = 64 hex chars + 0x prefix)
function isV4Pool(poolAddress: string): boolean {
  return poolAddress.length === 66; // 0x + 64 hex chars
}

// Convert price to approximate tick
function priceToTick(price: number, token0Decimals: number = 18, token1Decimals: number = 18): number {
  const adjustedPrice = price / Math.pow(10, token0Decimals - token1Decimals);
  return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
}

// Aggregated active position
interface ActivePosition {
  owner: string;
  tickLower: number;
  tickUpper: number;
  netLiquidity: bigint;
  lastTxHash: string;
  lastBlockNumber: number;
  lastTimestamp: number;
  mintCount: number;
  burnCount: number;
}

// Aggregate LP events to get current active positions
function aggregateActivePositions(positions: LPPosition[]): ActivePosition[] {
  // Group by (owner, tickLower, tickUpper)
  const positionMap = new Map<string, ActivePosition>();

  for (const pos of positions) {
    const key = `${pos.owner.toLowerCase()}-${pos.tickLower}-${pos.tickUpper}`;

    const liquidity = BigInt(pos.liquidity || '0');
    const isMint = pos.type === 'mint';

    if (positionMap.has(key)) {
      const existing = positionMap.get(key)!;
      // Add or subtract liquidity based on event type
      if (isMint) {
        existing.netLiquidity = existing.netLiquidity + liquidity;
        existing.mintCount++;
      } else {
        existing.netLiquidity = existing.netLiquidity - liquidity;
        existing.burnCount++;
      }
      // Update to most recent transaction
      if (pos.timestamp > existing.lastTimestamp) {
        existing.lastTxHash = pos.txHash;
        existing.lastBlockNumber = pos.blockNumber;
        existing.lastTimestamp = pos.timestamp;
      }
    } else {
      positionMap.set(key, {
        owner: pos.owner,
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
        netLiquidity: isMint ? liquidity : -liquidity,
        lastTxHash: pos.txHash,
        lastBlockNumber: pos.blockNumber,
        lastTimestamp: pos.timestamp,
        mintCount: isMint ? 1 : 0,
        burnCount: isMint ? 0 : 1,
      });
    }
  }

  // Filter to positions with positive liquidity and convert to array
  return Array.from(positionMap.values())
    .filter(p => p.netLiquidity > 0n)
    .sort((a, b) => {
      // Sort by liquidity (descending), then by timestamp (most recent first)
      const liqDiff = Number(b.netLiquidity - a.netLiquidity);
      if (liqDiff !== 0) return liqDiff > 0 ? 1 : -1;
      return b.lastTimestamp - a.lastTimestamp;
    });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const priceStr = searchParams.get('price');
  const tickRangeStr = searchParams.get('tickRange');
  const token0Decimals = parseInt(searchParams.get('token0Decimals') || '18');
  const token1Decimals = parseInt(searchParams.get('token1Decimals') || '18');
  const token0Symbol = searchParams.get('token0Symbol') || 'Token0';
  const token1Symbol = searchParams.get('token1Symbol') || 'Token1';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { error: 'Missing required parameters: chainId, poolAddress' },
      { status: 400 }
    );
  }

  try {
    let allPositions: LPPosition[] = [];
    let source = 'rpc';

    // For V4 pools, try Dune first (much faster)
    if (isV4Pool(poolAddress) && isDuneAvailable()) {
      console.log('[LP API] V4 pool detected, trying Dune...');
      const dunePositions = await getV4LPPositionsFromDune(chainId, poolAddress, limit * 2);

      if (dunePositions && dunePositions.length > 0) {
        // Convert Dune format to LPPosition format
        allPositions = dunePositions.map(pos => ({
          owner: pos.owner,
          tickLower: pos.tickLower,
          tickUpper: pos.tickUpper,
          liquidity: pos.liquidityDelta.replace('-', ''), // Absolute value
          amount0: '0',
          amount1: '0',
          txHash: pos.txHash,
          blockNumber: pos.blockNumber,
          timestamp: pos.timestamp,
          type: pos.type === 'add' ? 'mint' : 'burn',
        }));
        source = 'dune';
        console.log(`[LP API] Got ${allPositions.length} positions from Dune`);
      } else {
        console.log('[LP API] Dune returned no data, falling back to RPC...');
      }
    }

    // Fall back to RPC scanning if Dune didn't work
    if (allPositions.length === 0) {
      allPositions = await getLPPositions(chainId, poolAddress, forceRefresh);
      source = 'rpc';
    }

    let filteredPositions: LPPosition[] = allPositions;

    // If price is provided, filter to positions near that price
    if (priceStr) {
      const price = parseFloat(priceStr);
      const targetTick = priceToTick(price, token0Decimals, token1Decimals);
      const tickRange = parseInt(tickRangeStr || '2000'); // Default ±2000 ticks (~20% price range)

      filteredPositions = getPositionsNearPrice(allPositions, targetTick, tickRange);
    }

    // Sort by timestamp (most recent first)
    filteredPositions.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results for event history
    const limitedPositions = filteredPositions.slice(0, limit);

    // Format for display (event history)
    const formattedPositions = limitedPositions.map(pos =>
      formatPosition(pos, token0Decimals, token1Decimals, token0Symbol, token1Symbol)
    );

    // Calculate statistics
    const mintCount = filteredPositions.filter(p => p.type === 'mint').length;
    const burnCount = filteredPositions.filter(p => p.type === 'burn').length;
    const uniqueOwners = new Set(filteredPositions.map(p => p.owner)).size;

    // Aggregate to get current active LP positions (with net liquidity > 0)
    const activePositions = aggregateActivePositions(allPositions);

    // Format active positions for display
    const formattedActivePositions = activePositions.slice(0, limit).map(pos => {
      const priceLower = tickToPrice(pos.tickLower, token0Decimals, token1Decimals);
      const priceUpper = tickToPrice(pos.tickUpper, token0Decimals, token1Decimals);

      return {
        owner: pos.owner,
        ownerShort: `${pos.owner.slice(0, 6)}...${pos.owner.slice(-4)}`,
        tickLower: pos.tickLower,
        tickUpper: pos.tickUpper,
        priceLower,
        priceUpper,
        liquidity: pos.netLiquidity.toString(),
        lastTxHash: pos.lastTxHash,
        lastTimestamp: new Date(pos.lastTimestamp * 1000).toLocaleString(),
        mintCount: pos.mintCount,
        burnCount: pos.burnCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        // Event history (Add/Remove events)
        positions: formattedPositions,
        // Current active LP positions with net liquidity > 0
        activePositions: formattedActivePositions,
        stats: {
          total: filteredPositions.length,
          displayed: formattedPositions.length,
          mints: mintCount,
          burns: burnCount,
          uniqueLPs: uniqueOwners,
          activePositionCount: activePositions.length,
        },
        source, // 'dune' or 'rpc'
        cached: !forceRefresh && source === 'rpc',
        totalCached: allPositions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching LP positions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch LP positions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
