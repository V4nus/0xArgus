import { http, createConfig } from 'wagmi';
import { mainnet, base, arbitrum, polygon, bsc } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Custom wallet connectors for MetaMask, OKX Wallet, Binance Wallet
// These use injected providers (window.ethereum, window.okxwallet, window.BinanceChain)

// MetaMask connector
const metaMaskConnector = () => injected({
  target: 'metaMask',
});

// OKX Wallet connector
const okxWalletConnector = () => injected({
  target() {
    if (typeof window === 'undefined') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = (window as any).okxwallet;
    if (!provider) return undefined;
    return {
      id: 'okxWallet',
      name: 'OKX Wallet',
      provider,
    };
  },
});

// Binance Wallet connector
const binanceWalletConnector = () => injected({
  target() {
    if (typeof window === 'undefined') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = (window as any).BinanceChain;
    if (!provider) return undefined;
    return {
      id: 'binanceWallet',
      name: 'Binance Wallet',
      provider,
    };
  },
});

// Wallet connectors configuration
export const config = createConfig({
  chains: [mainnet, base, arbitrum, polygon, bsc],
  connectors: [
    // MetaMask
    metaMaskConnector(),
    // OKX Wallet
    okxWalletConnector(),
    // Binance Wallet
    binanceWalletConnector(),
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
