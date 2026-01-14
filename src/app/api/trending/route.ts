import { NextResponse } from 'next/server';

// Cache for trending pools data
interface TrendingPool {
  symbol: string;
  name: string;
  pair: string;
  chain: string;
  chainLabel: string;
  poolAddress: string;
  logo: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  mcap: number;
  liquidityRatio: number;
}

interface CachedData {
  pools: TrendingPool[];
  timestamp: number;
}

// In-memory cache (persists across requests in the same server instance)
const cache: Record<string, CachedData> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// DexScreener API
const DEXSCREENER_API = 'https://api.dexscreener.com';

// Chain configurations
const CHAIN_CONFIG: Record<string, { dexscreenerId: string; label: string }> = {
  base: { dexscreenerId: 'base', label: 'Base' },
  bsc: { dexscreenerId: 'bsc', label: 'BSC' },
  solana: { dexscreenerId: 'solana', label: 'SOL' },
  ethereum: { dexscreenerId: 'ethereum', label: 'ETH' },
};

async function fetchTrendingFromDexScreener(chainId: string): Promise<TrendingPool[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];

  try {
    // DexScreener provides trending/boosted pairs
    const response = await fetch(
      `${DEXSCREENER_API}/latest/dex/pairs/${config.dexscreenerId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // 5 min cache at edge
      }
    );

    if (!response.ok) {
      console.error(`DexScreener API error for ${chainId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const pairs = data.pairs || [];

    // Sort by volume and take top 30
    const sortedPairs = pairs
      .filter((p: any) => p.liquidity?.usd > 10000 && p.volume?.h24 > 1000)
      .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 30);

    return sortedPairs.map((pair: any) => {
      const liquidity = pair.liquidity?.usd || 0;
      const mcap = pair.fdv || pair.marketCap || liquidity * 10; // Fallback estimate
      const liquidityRatio = mcap > 0 ? (liquidity / mcap) * 100 : 0;

      return {
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        name: pair.baseToken?.name || 'Unknown Token',
        pair: `${pair.baseToken?.symbol || '?'}/${pair.quoteToken?.symbol || '?'}`,
        chain: chainId,
        chainLabel: config.label,
        poolAddress: pair.pairAddress || '',
        logo: pair.info?.imageUrl || '',
        price: parseFloat(pair.priceUsd) || 0,
        change24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: liquidity,
        mcap: mcap,
        liquidityRatio: liquidityRatio,
      };
    });
  } catch (error) {
    console.error(`Error fetching trending for ${chainId}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get('chain') || 'base';

  // Check cache
  const cached = cache[chain];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      pools: cached.pools,
      cached: true,
      cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
    });
  }

  // Fetch fresh data
  const pools = await fetchTrendingFromDexScreener(chain);

  // Update cache
  cache[chain] = {
    pools,
    timestamp: Date.now(),
  };

  return NextResponse.json({
    pools,
    cached: false,
    cacheAge: 0,
  });
}

// Endpoint to pre-warm cache for all chains
export async function POST() {
  const chains = Object.keys(CHAIN_CONFIG);
  const results: Record<string, number> = {};

  await Promise.all(
    chains.map(async (chain) => {
      const pools = await fetchTrendingFromDexScreener(chain);
      cache[chain] = {
        pools,
        timestamp: Date.now(),
      };
      results[chain] = pools.length;
    })
  );

  return NextResponse.json({
    message: 'Cache warmed',
    results,
  });
}
