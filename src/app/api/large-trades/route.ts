import { NextRequest, NextResponse } from 'next/server';

export interface LargeTrade {
  txHash: string;
  type: 'buy' | 'sell';
  volumeUsd: number;
  price: number;
  amount: number;
  timestamp: string;
  blockNumber: number;
}

interface GeckoTrade {
  attributes: {
    tx_hash: string;
    block_timestamp: string;
    block_number: number;
    kind: string;
    from_token_amount: string;
    to_token_amount: string;
    price_from_in_usd: string;
    price_to_in_usd: string;
    volume_in_usd: string;
  };
}

// Chain configurations
const CHAIN_CONFIG: Record<string, { geckoId: string }> = {
  base: { geckoId: 'base' },
  ethereum: { geckoId: 'eth' },
  bsc: { geckoId: 'bsc' },
  arbitrum: { geckoId: 'arbitrum' },
  polygon: { geckoId: 'polygon_pos' },
  solana: { geckoId: 'solana' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get('chainId');
  const poolAddress = searchParams.get('poolAddress');
  const threshold = parseInt(searchParams.get('threshold') || '1000'); // Default $1000

  if (!chainId || !poolAddress) {
    return NextResponse.json(
      { success: false, error: 'Missing chainId or poolAddress' },
      { status: 400 }
    );
  }

  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    return NextResponse.json(
      { success: false, error: `Unsupported chain: ${chainId}` },
      { status: 400 }
    );
  }

  try {
    // Fetch trades with minimum volume threshold
    const response = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${config.geckoId}/pools/${poolAddress}/trades?trade_volume_in_usd_greater_than=${threshold}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 10 },
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        trades: [],
        message: 'No data available',
      });
    }

    const result = await response.json();
    if (!result.data || !Array.isArray(result.data)) {
      return NextResponse.json({
        success: true,
        trades: [],
      });
    }

    const trades: LargeTrade[] = result.data.map((trade: GeckoTrade) => {
      const attrs = trade.attributes;
      const isBuy = attrs.kind === 'buy';
      const baseTokenPrice = isBuy
        ? parseFloat(attrs.price_to_in_usd) || 0
        : parseFloat(attrs.price_from_in_usd) || 0;
      const amount = isBuy
        ? parseFloat(attrs.to_token_amount) || 0
        : parseFloat(attrs.from_token_amount) || 0;

      return {
        txHash: attrs.tx_hash,
        type: isBuy ? 'buy' : 'sell',
        volumeUsd: parseFloat(attrs.volume_in_usd) || 0,
        price: baseTokenPrice,
        amount,
        timestamp: attrs.block_timestamp,
        blockNumber: attrs.block_number,
      };
    });

    // Sort by timestamp (newest first) and filter by volume
    const sortedTrades = trades
      .filter(t => t.volumeUsd >= threshold)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      trades: sortedTrades,
      count: sortedTrades.length,
      threshold,
    });
  } catch (error) {
    console.error('Large trades API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch large trades' },
      { status: 500 }
    );
  }
}
