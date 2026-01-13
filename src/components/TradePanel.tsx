'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CHAIN_ID_MAP } from '@/lib/wagmi';
import type { CowSwapWidgetHandler } from '@cowprotocol/widget-lib';

// CoW Swap supported chain IDs
const COW_SUPPORTED_CHAINS = [1, 100, 42161, 11155111, 8453]; // Ethereum, Gnosis, Arbitrum, Sepolia, Base

interface TradePanelProps {
  chainId: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseSymbol: string;
  quoteSymbol: string;
}

export default function TradePanel({
  chainId,
  baseTokenAddress,
  quoteTokenAddress,
  baseSymbol,
  quoteSymbol,
}: TradePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<CowSwapWidgetHandler | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const targetChainId = CHAIN_ID_MAP[chainId] || 1;
  const isSupportedChain = COW_SUPPORTED_CHAINS.includes(targetChainId);
  const isCorrectChain = currentChainId === targetChainId;

  // Initialize CoW Swap Widget when expanded
  useEffect(() => {
    if (!isExpanded || !widgetContainerRef.current || !isSupportedChain) return;

    const initWidget = async () => {
      const { createCowSwapWidget, TradeType } = await import('@cowprotocol/widget-lib');
      type CowSwapWidgetParams = Parameters<typeof createCowSwapWidget>[1]['params'];

      // Determine sell/buy tokens based on trade type
      const sellToken = tradeType === 'buy' ? quoteTokenAddress : baseTokenAddress;
      const buyToken = tradeType === 'buy' ? baseTokenAddress : quoteTokenAddress;
      const sellSymbol = tradeType === 'buy' ? quoteSymbol : baseSymbol;
      const buySymbol = tradeType === 'buy' ? baseSymbol : quoteSymbol;

      const params: CowSwapWidgetParams = {
        appCode: '0xArgus',
        width: '100%',
        height: '500px',
        chainId: targetChainId,
        tradeType: TradeType.SWAP,
        sell: {
          asset: sellToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            ? sellSymbol
            : sellToken,
        },
        buy: {
          asset: buyToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
            ? buySymbol
            : buyToken,
        },
        theme: 'dark',
        standaloneMode: false,
        disableToastMessages: false,
        hideBridgeInfo: true,
        hideOrdersTable: false,
      };

      // Clear previous widget if exists
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = '';
      }

      // Create widget with provider if connected
      const provider = isConnected && typeof window !== 'undefined'
        ? (window as { ethereum?: unknown }).ethereum
        : undefined;

      widgetRef.current = createCowSwapWidget(
        widgetContainerRef.current!,
        {
          params,
          provider: provider as Parameters<typeof createCowSwapWidget>[1]['provider'],
        }
      );
    };

    initWidget();

    return () => {
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = '';
      }
      widgetRef.current = null;
    };
  }, [isExpanded, tradeType, targetChainId, baseTokenAddress, quoteTokenAddress, baseSymbol, quoteSymbol, isConnected, isSupportedChain]);

  // Update widget when trade type changes
  useEffect(() => {
    if (!widgetRef.current || !isExpanded) return;

    const sellToken = tradeType === 'buy' ? quoteTokenAddress : baseTokenAddress;
    const buyToken = tradeType === 'buy' ? baseTokenAddress : quoteTokenAddress;
    const sellSymbol = tradeType === 'buy' ? quoteSymbol : baseSymbol;
    const buySymbol = tradeType === 'buy' ? baseSymbol : quoteSymbol;

    widgetRef.current.updateParams({
      appCode: '0xArgus',
      sell: {
        asset: sellToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
          ? sellSymbol
          : sellToken,
      },
      buy: {
        asset: buyToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
          ? buySymbol
          : buyToken,
      },
    });
  }, [tradeType, baseTokenAddress, quoteTokenAddress, baseSymbol, quoteSymbol, isExpanded]);

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleSwitchChain = () => {
    switchChain({ chainId: targetChainId });
  };

  // Collapsed view - just buy/sell buttons
  if (!isExpanded) {
    return (
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Trade {baseSymbol}</span>
          {isConnected && (
            <span className="text-xs text-gray-400 truncate max-w-[100px]">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setTradeType('buy');
              setIsExpanded(true);
            }}
            className="flex-1 py-2 px-3 bg-[#3fb950] hover:bg-[#3fb950]/80 text-white text-sm font-medium rounded transition-colors"
          >
            Buy
          </button>
          <button
            onClick={() => {
              setTradeType('sell');
              setIsExpanded(true);
            }}
            className="flex-1 py-2 px-3 bg-[#f85149] hover:bg-[#f85149]/80 text-white text-sm font-medium rounded transition-colors"
          >
            Sell
          </button>
        </div>

        {!isSupportedChain && (
          <div className="mt-2 text-xs text-yellow-500 text-center">
            CoW Swap not available on this chain
          </div>
        )}
      </div>
    );
  }

  // Expanded view - full trading interface
  return (
    <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-[#30363d] rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-sm font-medium">
            {tradeType === 'buy' ? 'Buy' : 'Sell'} {baseSymbol}
          </span>
        </div>

        {/* Trade type toggle */}
        <div className="flex gap-1 bg-[#21262d] rounded p-0.5">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              tradeType === 'buy'
                ? 'bg-[#3fb950] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              tradeType === 'sell'
                ? 'bg-[#f85149] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      {/* Wallet Connection / Chain Switch */}
      {!isConnected ? (
        <div className="p-4">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-3 bg-[#58a6ff] hover:bg-[#58a6ff]/80 disabled:opacity-50 text-white font-medium rounded transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Connect your wallet to trade
          </p>
        </div>
      ) : !isCorrectChain ? (
        <div className="p-4">
          <button
            onClick={handleSwitchChain}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-600/80 text-white font-medium rounded transition-colors"
          >
            Switch to {chainId.charAt(0).toUpperCase() + chainId.slice(1)}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Please switch to the correct network
          </p>
        </div>
      ) : !isSupportedChain ? (
        <div className="p-4 text-center">
          <p className="text-yellow-500 text-sm">
            CoW Swap is not available on {chainId}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supported: Ethereum, Arbitrum, Base, Gnosis
          </p>
        </div>
      ) : (
        <>
          {/* CoW Swap Widget Container */}
          <div
            ref={widgetContainerRef}
            className="min-h-[500px]"
          />

          {/* Footer with wallet info */}
          <div className="px-3 py-2 border-t border-[#30363d] flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="text-[#f85149] hover:text-[#f85149]/80 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      )}

      {/* Powered by CoW */}
      <div className="px-3 py-2 border-t border-[#30363d] text-center">
        <a
          href="https://cow.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Powered by CoW Protocol - MEV Protected
        </a>
      </div>
    </div>
  );
}
