import {
  ArrowRightLeft, TrendingUp, BarChart3, LineChart, Landmark,
  Send, Wallet, Bell, Coins, Search, ShieldCheck, DollarSign, Repeat,
  Shield, Target, ShoppingCart, Activity
} from "lucide-react";

const features = [
  {
    icon: ArrowRightLeft,
    title: "Swap",
    description: "Swap any Solana token instantly",
    example: "swap 1 SOL for USDC",
  },
  {
    icon: DollarSign,
    title: "Limit Orders",
    description: "Set buy/sell orders at target prices",
    example: "buy 10 SOL at $120",
  },
  {
    icon: Shield,
    title: "Stop Loss",
    description: "Auto-sell if price drops to protect your position",
    example: "stop loss SOL at $80",
  },
  {
    icon: Target,
    title: "Take Profit",
    description: "Auto-sell when price reaches your target",
    example: "take profit SOL at $200",
  },
  {
    icon: Shield,
    title: "OCO Orders",
    description: "Combined stop loss + take profit, one cancels the other",
    example: "SL 80 TP 200 SOL",
  },
  {
    icon: ShoppingCart,
    title: "Auto-Buy",
    description: "Set trigger orders to buy on dips or breakouts",
    example: "buy SOL if it drops below $80",
  },
  {
    icon: Repeat,
    title: "DCA / Recurring Buys",
    description: "Dollar-cost average into any token",
    example: "buy $50 of SOL every day",
  },
  {
    icon: Activity,
    title: "Market Intelligence",
    description: "AI-analyzed market snapshots, Solana ecosystem data, trending tokens, gainers and losers with tiered deep-dive analysis",
    example: "how's the market",
  },
  {
    icon: BarChart3,
    title: "Tokenized Stocks",
    description: "Trade stocks like AAPL, TSLA on Solana",
    example: "buy $100 of Tesla stock",
  },
  {
    icon: LineChart,
    title: "Earn Yield (JLP)",
    description: "Earn passive yield with Jupiter LP",
    example: "earn yield with 500 USDC",
  },
  {
    icon: Landmark,
    title: "Stake SOL (jupSOL)",
    description: "Liquid staking via Jupiter",
    example: "stake 10 SOL",
  },
  {
    icon: Landmark,
    title: "Lend / Borrow",
    description: "Lend tokens to earn interest or borrow",
    example: "lend 1000 USDC",
  },
  {
    icon: Send,
    title: "Send Tokens",
    description: "Transfer tokens to any Solana address",
    example: "send 5 SOL to [address]",
  },
  {
    icon: Wallet,
    title: "Portfolio",
    description: "View your token balances and values",
    example: "my portfolio",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Get notified when tokens hit target prices",
    example: "alert me when SOL hits $200",
  },
  {
    icon: Coins,
    title: "Launch Token (FREE)",
    description: "Create a token for free on Solana",
    example: "launch a token called MOON",
  },
  {
    icon: Search,
    title: "Token Research",
    description: "Get detailed info on any token",
    example: "tell me about WIF",
  },
  {
    icon: ShieldCheck,
    title: "Safety Scanner",
    description: "Analyze tokens for rug pull risks",
    example: "is BONK safe?",
  },
];

export function CapabilitiesCard() {
  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{
        background: '#111520',
        border: '1px solid #1B2030',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
      data-testid="capabilities-card"
    >
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: '#1C1C1F' }}
      >
        <Activity className="h-4 w-4" style={{ color: '#E6EDF3' }} />
        <span className="text-title3">What I can do</span>
      </div>

      <div className="p-4 space-y-1">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'transparent' }}
            data-testid={`capability-${feature.title.toLowerCase().replace(/[\s\/]+/g, '-')}`}
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: '#1C1C1F' }}
            >
              <feature.icon className="h-4 w-4" style={{ color: '#E6EDF3' }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-body-emphasis">{feature.title}</span>
              <span className="text-footnote" style={{ color: '#9BA4AE' }}>
                {feature.description}
              </span>
              <span
                className="text-footnote mt-1 font-mono"
                style={{ color: '#6B7280', fontSize: '11px' }}
              >
                "{feature.example}"
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
