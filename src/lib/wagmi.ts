import { http, createConfig } from 'wagmi';
import { mainnet, base, arbitrum, polygon, bsc } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - you should get your own at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

export const config = createConfig({
  chains: [mainnet, base, arbitrum, polygon, bsc],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
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
