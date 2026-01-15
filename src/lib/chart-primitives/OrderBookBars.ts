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

    // Calculate max liquidity for line width scaling
    const maxLiquidity = this._orders.length > 0
      ? Math.max(...this._orders.map(o => o.liquidityUSD))
      : 0;

    console.log(`[OrderBookBars] Creating ${this._orders.length} price lines, maxLiquidity=${maxLiquidity}`);

    // Create price lines for each order
    let createdCount = 0;
    this._orders.forEach(order => {
      // Use rank for color/width: rank 1 = darkest/thickest, rank 5 = lightest/thinnest
      // ratio: 1.0 for rank 1, 0.0 for rank 5
      const ratio = order.rank > 0 ? (6 - order.rank) / 5 : 0;  // rank 1 -> 1.0, rank 5 -> 0.2

      // Calculate line width based on rank (1-4 pixels)
      // rank 1 = 4px, rank 5 = 1px
      const lineWidth = Math.max(1, Math.round(ratio * 4)) as 1 | 2 | 3 | 4;

      // Gradient colors based on rank
      // Bids: dark green (rank 1) -> light green (rank 5)
      // Asks: dark red (rank 1) -> light red (rank 5)
      let color: string;
      if (order.type === 'bid') {
        // Green gradient: rgb(34, 180, 34) dark -> rgb(144, 238, 144) light
        const r = Math.round(144 - ratio * (144 - 34));
        const g = Math.round(238 - ratio * (238 - 180));
        const b = Math.round(144 - ratio * (144 - 34));
        color = `rgba(${r}, ${g}, ${b}, 0.9)`;
      } else {
        // Red gradient: rgb(220, 38, 38) dark -> rgb(255, 182, 182) light
        const r = Math.round(255 - ratio * (255 - 220));
        const g = Math.round(182 - ratio * (182 - 38));
        const b = Math.round(182 - ratio * (182 - 38));
        color = `rgba(${r}, ${g}, ${b}, 0.9)`;
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
