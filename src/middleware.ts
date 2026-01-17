import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// x402 配置 - 直接在 middleware 中定义以避免 edge runtime 问题
const X402_PAY_TO_ADDRESS = process.env.X402_PAY_TO_ADDRESS || '0x0000000000000000000000000000000000000000';
const X402_NETWORK = process.env.X402_NETWORK === 'mainnet' ? 'eip155:8453' : 'eip155:84532';

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// API 定价 (以 USDC 最小单位，6位小数)
const PRICING = {
  '/api/x402/orderbook': {
    amount: '1000', // $0.001 = 1000 units (6 decimals)
    description: 'Order Book API - Real-time bid/ask liquidity depth data',
  },
  '/api/x402/liquidity-depth': {
    amount: '2000', // $0.002 = 2000 units (6 decimals)
    description: 'Liquidity Depth API - Cumulative liquidity curves with price impact',
  },
};

function isX402Configured(): boolean {
  return X402_PAY_TO_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

// 创建 402 Payment Required 响应
function createPaymentRequiredResponse(path: string) {
  const pricing = PRICING[path as keyof typeof PRICING];
  if (!pricing) return null;

  const paymentRequired = {
    x402Version: 2,
    error: 'Payment required',
    accepts: [
      {
        scheme: 'exact',
        network: X402_NETWORK,
        amount: pricing.amount,
        asset: `eip155:8453/erc20:${USDC_ADDRESS}`,
        payTo: X402_PAY_TO_ADDRESS,
        maxTimeoutSeconds: 300,
        extra: {},
      },
    ],
    resource: {
      url: path,
      description: pricing.description,
      mimeType: 'application/json',
    },
  };

  return new NextResponse(JSON.stringify(paymentRequired), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'true',
    },
  });
}

// 验证支付头 (简化版 - 生产环境应该调用 facilitator 验证)
function hasValidPayment(request: NextRequest): boolean {
  const paymentHeader = request.headers.get('payment-signature') || request.headers.get('x-payment');
  // 如果有支付头，暂时假设有效（实际应该验证）
  return !!paymentHeader;
}

// 导出中间件
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('[x402 Middleware] Processing:', pathname);

  // 只对 /api/x402/ 路由应用支付验证
  if (pathname.startsWith('/api/x402/')) {
    console.log('[x402 Middleware] x402 route detected');
    // 如果未配置，返回错误
    if (!isX402Configured()) {
      return NextResponse.json(
        {
          error: 'Payment system not configured',
          message: 'x402 payment is not available on this server',
        },
        { status: 503 }
      );
    }

    // 检查是否有有效支付
    if (!hasValidPayment(request)) {
      // 返回 402 Payment Required
      const paymentResponse = createPaymentRequiredResponse(pathname);
      if (paymentResponse) {
        return paymentResponse;
      }
    }

    // 有支付或不需要支付的路由，继续处理
    return NextResponse.next();
  }

  // 其他路由直接通过
  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: [
    // 匹配所有 API 路由以便调试
    '/api/:path*',
  ],
};
