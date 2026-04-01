import { ListOrdered, ArrowUpRight, ArrowDownRight, ShieldAlert, Target, ShoppingCart, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrdersCardProps {
  orders: any[];
}

function formatAmount(amount: number): string {
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M';
  if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K';
  if (amount < 0.001 && amount > 0) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(6);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function formatPrice(price: number): string {
  if (price === 0) return '--';
  if (price < 0.0001 && price > 0) return '$' + price.toExponential(2);
  if (price < 1) return '$' + price.toFixed(6);
  return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFrequency(seconds: number): string {
  if (seconds <= 60) return 'every min';
  if (seconds <= 3600) return 'hourly';
  if (seconds <= 86400) return 'daily';
  if (seconds <= 604800) return 'weekly';
  return 'monthly';
}

const ORDER_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  limit_buy: { label: 'Limit Buy', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: ArrowDownRight },
  limit_sell: { label: 'Limit Sell', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: ArrowUpRight },
  stop_loss: { label: 'Stop Loss', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: ShieldAlert },
  take_profit: { label: 'Take Profit', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: Target },
  auto_buy: { label: 'Auto Buy', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: ShoppingCart },
  dca: { label: 'DCA', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: RefreshCw },
};

function getOrderConfig(order: any) {
  const type = order.orderType || (order.side === 'buy' ? 'limit_buy' : 'limit_sell');
  return ORDER_TYPE_CONFIG[type] || ORDER_TYPE_CONFIG['limit_buy'];
}

export function OrdersCard({ orders }: OrdersCardProps) {
  if (!orders || orders.length === 0) {
    return (
      <div
        className="w-full max-w-sm rounded-xl p-5 text-center text-footnote"
        style={{ background: '#111520', border: '1px solid #1B2030' }}
        data-testid="orders-empty-card"
      >
        No active orders found.
      </div>
    );
  }

  const triggerOrders = orders.filter(o => o.orderSource !== 'dca');
  const dcaOrders = orders.filter(o => o.orderSource === 'dca');
  const hasMixed = triggerOrders.length > 0 && dcaOrders.length > 0;

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="orders-card"
    >
      <div className="px-5 py-4 border-b flex items-center justify-between gap-2 flex-wrap" style={{ borderColor: '#1B2030' }}>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4" style={{ color: '#9BA4AE' }} />
          <span className="text-title3" data-testid="text-orders-count">Active orders ({orders.length})</span>
        </div>
      </div>

      {hasMixed && triggerOrders.length > 0 && (
        <div className="px-5 py-2 border-b" style={{ borderColor: '#1B2030', background: '#0F1320' }}>
          <span className="text-footnote" style={{ color: '#9BA4AE' }} data-testid="text-trigger-section-label">
            Trigger / Limit ({triggerOrders.length})
          </span>
        </div>
      )}

      {triggerOrders.map((order: any, i: number) => {
        const config = getOrderConfig(order);
        const IconComp = config.icon;

        return (
          <div
            key={order.account || `trigger-${i}`}
            className="flex items-center justify-between gap-3 px-5 py-3 border-b transition-colors"
            style={{ borderColor: '#1B2030' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0F1320')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            data-testid={`row-order-${i}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                style={{ background: config.bg }}
                data-testid={`icon-order-side-${i}`}
              >
                <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-emphasis truncate" data-testid={`text-order-label-${i}`}>
                    {order.targetAmount ? formatAmount(order.targetAmount) : ''} {order.targetToken || ''}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] leading-tight px-1.5 py-0 no-default-hover-elevate no-default-active-elevate"
                    style={{ color: config.color, borderColor: config.color + '40' }}
                    data-testid={`badge-order-type-${i}`}
                  >
                    {config.label}
                  </Badge>
                </div>
                {order.triggerPrice && order.triggerPrice > 0 ? (
                  <span className="text-mono" data-testid={`text-order-price-${i}`}>
                    {formatPrice(order.triggerPrice)}
                  </span>
                ) : order.inputSymbol && order.outputSymbol ? (
                  <span className="text-mono" data-testid={`text-order-pair-${i}`}>
                    {order.inputSymbol} → {order.outputSymbol}
                  </span>
                ) : (
                  <span className="text-mono" data-testid={`text-order-account-${i}`}>
                    {order.account ? `${order.account.slice(0, 6)}...${order.account.slice(-4)}` : 'Unknown'}
                  </span>
                )}
              </div>
            </div>
            <div
              className="text-footnote shrink-0 px-2 py-0.5 rounded-md"
              style={{ background: '#1C1C1F', color: '#9BA4AE' }}
              data-testid={`text-order-status-${i}`}
            >
              {order.state || 'active'}
            </div>
          </div>
        );
      })}

      {hasMixed && dcaOrders.length > 0 && (
        <div className="px-5 py-2 border-b" style={{ borderColor: '#1B2030', background: '#0F1320' }}>
          <span className="text-footnote" style={{ color: '#9BA4AE' }} data-testid="text-dca-section-label">
            Recurring / DCA ({dcaOrders.length})
          </span>
        </div>
      )}

      {dcaOrders.map((order: any, i: number) => {
        const config = ORDER_TYPE_CONFIG['dca'];
        const IconComp = config.icon;
        const globalIdx = triggerOrders.length + i;

        return (
          <div
            key={order.account || `dca-${i}`}
            className="flex items-center justify-between gap-3 px-5 py-3 border-b transition-colors"
            style={{ borderColor: '#1B2030' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0F1320')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            data-testid={`row-order-${globalIdx}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                style={{ background: config.bg }}
                data-testid={`icon-order-side-${globalIdx}`}
              >
                <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-emphasis truncate" data-testid={`text-order-label-${globalIdx}`}>
                    {order.inputSymbol} → {order.targetToken}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] leading-tight px-1.5 py-0 no-default-hover-elevate no-default-active-elevate"
                    style={{ color: config.color, borderColor: config.color + '40' }}
                    data-testid={`badge-order-type-${globalIdx}`}
                  >
                    {config.label}
                  </Badge>
                </div>
                <span className="text-mono" data-testid={`text-order-frequency-${globalIdx}`}>
                  {order.cycleFrequency ? formatFrequency(order.cycleFrequency) : 'recurring'}
                  {order.targetAmount > 0 ? ` · ${formatAmount(order.targetAmount)} remaining` : ''}
                </span>
              </div>
            </div>
            <div
              className="text-footnote shrink-0 px-2 py-0.5 rounded-md"
              style={{ background: '#1C1C1F', color: '#9BA4AE' }}
              data-testid={`text-order-status-${globalIdx}`}
            >
              {order.state || 'active'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
