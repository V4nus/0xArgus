'use client';

import {
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
  IPriceLine,
  CreatePriceLineOptions,
} from 'lightweight-charts';

// Order data structure
export interface OrderBookOrder {
  price: number;
  liquidityUSD: number;
  type: 'bid' | 'ask';
  rank: number;  // 1-5, closer to current price = lower rank
}

// Format liquidity for display
function formatLiquidity(liquidity: number): string {
  if (liquidity >= 1000000) {
    return `$${(liquidity / 1000000).toFixed(1)}M`;
  } else if (liquidity >= 1000) {
    return `$${(liquidity / 1000).toFixed(1)}K`;
  } else {
    return `$${liquidity.toFixed(0)}`;
  }
}

// Main primitive class using price lines
export class OrderBookBarsPrimitive implements ISeriesPrimitive<Time> {
  private _orders: OrderBookOrder[] = [];
  private _priceLines: IPriceLine[] = [];
  private _requestUpdate?: () => void;
  private _series?: SeriesAttachedParameter<Time>;

  // Called when attached to a series
  attached(param: SeriesAttachedParameter<Time>): void {
    this._series = param;
    this._requestUpdate = param.requestUpdate;
  }

  // Called when detached from a series
  detached(): void {
    this._clearPriceLines();
    this._series = undefined;
    this._requestUpdate = undefined;
  }

  // Update orders data
  setOrders(orders: OrderBookOrder[]) {
    console.log(`[OrderBookBars] setOrders called with ${orders.length} orders`);
    this._orders = orders;
    this._updatePriceLines();
    this._requestUpdate?.();
  }

  // Clear all orders
  clearOrders() {
    this._orders = [];
    this._clearPriceLines();
    this._requestUpdate?.();
  }

  private _clearPriceLines() {
    if (!this._series) return;

    // Remove all existing price lines
    this._priceLines.forEach(line => {
      try {
        this._series!.series.removePriceLine(line);
      } catch {
        // Line may already be removed
      }
    });
    this._priceLines = [];
  }

  private _updatePriceLines() {
    if (!this._series) {
      console.log('[OrderBookBars] _updatePriceLines: No series attached');
      return;
    }

    // Clear existing lines first
    this._clearPriceLines();

    console.log(`[OrderBookBars] Creating ${this._orders.length} price lines`);

    // Separate bids and asks, then sort by liquidity to get relative ranking
    const bids = this._orders.filter(o => o.type === 'bid');
    const asks = this._orders.filter(o => o.type === 'ask');

    // Sort by liquidityUSD descending to determine rank (highest = rank 0)
    const sortedBids = [...bids].sort((a, b) => b.liquidityUSD - a.liquidityUSD);
    const sortedAsks = [...asks].sort((a, b) => b.liquidityUSD - a.liquidityUSD);

    // Create rank map: liquidityUSD -> rank index (0 = highest)
    const bidRankMap = new Map<number, number>();
    const askRankMap = new Map<number, number>();
    sortedBids.forEach((bid, idx) => bidRankMap.set(bid.liquidityUSD, idx));
    sortedAsks.forEach((ask, idx) => askRankMap.set(ask.liquidityUSD, idx));

    // Create price lines for each order
    let createdCount = 0;
    this._orders.forEach(order => {
      // Calculate intensity based on relative rank within bids or asks
      // Rank 0 (highest liquidity) = intensity 1.0 (darkest)
      // Rank N (lowest liquidity) = intensity ~0.1 (lightest)
      let intensity: number;
      if (order.type === 'bid') {
        const rank = bidRankMap.get(order.liquidityUSD) ?? 0;
        const total = sortedBids.length;
        // Highest liquidity (rank 0) -> 1.0, lowest -> 0.15
        intensity = total > 1 ? 1.0 - (rank / (total - 1)) * 0.85 : 1.0;
      } else {
        const rank = askRankMap.get(order.liquidityUSD) ?? 0;
        const total = sortedAsks.length;
        intensity = total > 1 ? 1.0 - (rank / (total - 1)) * 0.85 : 1.0;
      }

      // Ensure minimum intensity
      intensity = Math.max(0.15, intensity);

      // Calculate line width based on intensity (1-4 pixels)
      const lineWidth = Math.max(1, Math.min(4, Math.ceil(intensity * 4))) as 1 | 2 | 3 | 4;

      // Gradient colors based on relative rank
      // Bids (green): light (#90EE90) -> dark (#22B422)
      // Asks (red): light (#FFB6B6) -> dark (#DC2626)
      let color: string;
      if (order.type === 'bid') {
        // Green gradient: light rgb(144, 238, 144) -> dark rgb(34, 180, 34)
        const r = Math.round(144 - intensity * (144 - 34));
        const g = Math.round(238 - intensity * (238 - 180));
        const b = Math.round(144 - intensity * (144 - 34));
        color = `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.5})`;
      } else {
        // Red gradient: light rgb(255, 182, 182) -> dark rgb(220, 38, 38)
        const r = Math.round(255 - intensity * (255 - 220));
        const g = Math.round(182 - intensity * (182 - 38));
        const b = Math.round(182 - intensity * (182 - 38));
        color = `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.5})`;
      }

      const options: CreatePriceLineOptions = {
        price: order.price,
        color: color,
        lineWidth: lineWidth,
        lineStyle: 0, // Solid line
        axisLabelVisible: true,
        title: formatLiquidity(order.liquidityUSD),
      };

      try {
        const line = this._series!.series.createPriceLine(options);
        this._priceLines.push(line);
        createdCount++;
      } catch (e) {
        console.error(`[OrderBookBars] Failed to create price line at ${order.price}:`, e);
      }
    });
    console.log(`[OrderBookBars] Successfully created ${createdCount} price lines`);
  }

  // Called on each chart update to refresh positions
  updateAllViews() {
    // Price lines auto-update with chart, no manual refresh needed
  }
}
