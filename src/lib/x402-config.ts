// x402 Payment Configuration
// https://docs.cdp.coinbase.com/x402/quickstart-for-sellers

// 收款地址 - 替换为你的 Base 链 USDC 地址
export const X402_PAY_TO_ADDRESS = process.env.X402_PAY_TO_ADDRESS || '0x0000000000000000000000000000000000000000';

// Facilitator URL
// 测试网: https://x402.org/facilitator
// 生产环境: https://api.cdp.coinbase.com/platform/v2/x402
export const X402_FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

// 网络配置 (CAIP-2 格式)
export const X402_NETWORKS = {
  // Base Mainnet
  BASE_MAINNET: 'eip155:8453',
  // Base Sepolia (测试网)
  BASE_SEPOLIA: 'eip155:84532',
} as const;

// 当前使用的网络
export const X402_NETWORK = process.env.X402_NETWORK === 'mainnet'
  ? X402_NETWORKS.BASE_MAINNET
  : X402_NETWORKS.BASE_SEPOLIA;

// API 定价配置
export const X402_PRICING = {
  // Order Book API - 每次查询
  ORDERBOOK: '$0.001',
  // Liquidity Depth API - 每次查询
  LIQUIDITY_DEPTH: '$0.002',
  // Batch API - 批量查询
  BATCH: '$0.005',
} as const;

// API 路由配置
export const X402_ROUTES = {
  ORDERBOOK: '/api/x402/orderbook',
  LIQUIDITY_DEPTH: '/api/x402/liquidity-depth',
} as const;

// 检查 x402 是否已配置
export function isX402Configured(): boolean {
  return X402_PAY_TO_ADDRESS !== '0x0000000000000000000000000000000000000000';
}
