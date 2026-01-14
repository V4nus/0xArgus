import { http, createConfig } from 'wagmi';
import { mainnet, base, arbitrum, polygon, bsc } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Wallet connectors configuration
// Only MetaMask, OKX Wallet, and Binance Wallet
export const config = createConfig({
  chains: [mainnet, base, arbitrum, polygon, bsc],
  connectors: [
    // MetaMask - using built-in target
    injected({ target: 'metaMask' }),
    // OKX Wallet - using custom target with name override
    injected({
      target: {
        id: 'okxWallet',
        name: 'OKX Wallet',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: typeof window !== 'undefined' ? (window as any).okxwallet : undefined,
      },
    }),
    // Binance Wallet - using custom target with name override
    injected({
      target: {
        id: 'binanceWallet',
        name: 'Binance Wallet',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: typeof window !== 'undefined' ? (window as any).BinanceChain : undefined,
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  // Disable auto-discovery to only show our specified wallets
  multiInjectedProviderDiscovery: false,
});

// Chain ID mapping from our chainId strings to wagmi chain IDs
export const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: mainnet.id,
  base: base.id,
  arbitrum: arbitrum.id,
  polygon: polygon.id,
  bsc: bsc.id,
};

// Reverse mapping
export const CHAIN_NAME_MAP: Record<number, string> = {
  [mainnet.id]: 'ethereum',
  [base.id]: 'base',
  [arbitrum.id]: 'arbitrum',
  [polygon.id]: 'polygon',
  [bsc.id]: 'bsc',
};
