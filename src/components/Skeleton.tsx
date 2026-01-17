'use client';

import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

function SkeletonBase({
  className = '',
  variant = 'rect',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-[#21262d]';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'rounded',
    rect: 'rounded',
    circle: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${animateClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export const Skeleton = memo(SkeletonBase);

// Pre-built skeleton components for common UI patterns

export const SkeletonText = memo(function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
});

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <Skeleton variant="circle" width={size} height={size} className={className} />;
});

// Pool Card Skeleton
export const PoolCardSkeleton = memo(function PoolCardSkeleton() {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <SkeletonAvatar size={36} />
        <div className="flex-1">
          <Skeleton height={20} className="w-32 mb-1" />
          <Skeleton height={14} className="w-20" />
        </div>
        <Skeleton height={24} className="w-16" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height={40} />
        <Skeleton height={40} />
      </div>
    </div>
  );
});

// Chart Skeleton
export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="w-full h-full bg-[#0d1117] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
        <Skeleton width={120} height={20} />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={32} height={24} />
          ))}
        </div>
      </div>
      {/* Chart area */}
      <div className="p-4 h-[calc(100%-50px)] flex flex-col justify-end">
        <div className="flex items-end gap-1 h-full">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-[#21262d] animate-pulse rounded-t"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// Order Book Skeleton
export const OrderBookSkeleton = memo(function OrderBookSkeleton() {
  return (
    <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={80} height={18} />
        <Skeleton width={60} height={24} />
      </div>
      {/* Asks */}
      <div className="space-y-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`ask-${i}`} className="flex gap-2">
            <Skeleton height={16} className="flex-1" />
            <Skeleton height={16} className="w-16" />
            <Skeleton height={16} className="w-20" />
          </div>
        ))}
      </div>
      {/* Current Price */}
      <div className="bg-[#30363d] rounded py-2 my-2">
        <Skeleton height={20} className="w-24 mx-auto" />
      </div>
      {/* Bids */}
      <div className="space-y-1 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`bid-${i}`} className="flex gap-2">
            <Skeleton height={16} className="flex-1" />
            <Skeleton height={16} className="w-16" />
            <Skeleton height={16} className="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Trade Panel Skeleton
export const TradePanelSkeleton = memo(function TradePanelSkeleton() {
  return (
    <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#30363d]">
        <Skeleton width={60} height={20} />
      </div>
      {/* Buy/Sell Toggle */}
      <div className="flex border-b border-[#30363d]">
        <Skeleton className="flex-1 h-12" />
        <Skeleton className="flex-1 h-12" />
      </div>
      {/* Form */}
      <div className="p-3 space-y-3">
        <Skeleton height={14} className="w-20" />
        <Skeleton height={48} />
        <Skeleton height={8} />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={32} height={16} />
          ))}
        </div>
        <Skeleton height={14} className="w-16" />
        <Skeleton height={48} />
        <Skeleton height={44} className="rounded-lg" />
      </div>
    </div>
  );
});

// Trade History Skeleton
export const TradeHistorySkeleton = memo(function TradeHistorySkeleton() {
  return (
    <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={80} height={18} />
        <Skeleton width={40} height={18} />
      </div>
      {/* Table Header */}
      <div className="flex gap-2 mb-2 pb-2 border-b border-[#30363d]">
        <Skeleton height={12} className="w-16" />
        <Skeleton height={12} className="w-20" />
        <Skeleton height={12} className="flex-1" />
        <Skeleton height={12} className="w-16" />
      </div>
      {/* Rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Skeleton height={16} className="w-16" />
            <Skeleton height={16} className="w-20" />
            <Skeleton height={16} className="flex-1" />
            <Skeleton height={16} className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Pool Page Full Skeleton
export const PoolPageSkeleton = memo(function PoolPageSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton width={32} height={32} variant="circle" />
            <SkeletonAvatar size={36} />
            <div>
              <Skeleton width={120} height={20} className="mb-1" />
              <Skeleton width={80} height={24} />
            </div>
          </div>
          <Skeleton width={100} height={36} className="rounded-lg" />
        </div>
      </div>
      {/* Stats Bar */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-2">
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={80} height={16} />
          ))}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-2 flex gap-2 overflow-hidden">
        {/* Order Book */}
        <div className="w-72 flex-shrink-0">
          <OrderBookSkeleton />
        </div>
        {/* Chart */}
        <div className="flex-1">
          <ChartSkeleton />
        </div>
        {/* Trade Panel + History */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2">
          <TradePanelSkeleton />
          <div className="flex-1">
            <TradeHistorySkeleton />
          </div>
        </div>
      </div>
    </div>
  );
});

export default Skeleton;
