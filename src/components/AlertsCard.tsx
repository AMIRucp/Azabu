import { Bell, BellRing, BellOff, Trash2, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PriceAlert } from "@/hooks/usePriceAlerts";

interface AlertsCardProps {
  data: {
    type: "set_alert" | "view_alerts" | "remove_alert";
    token?: string;
    targetPrice?: number;
    condition?: "above" | "below";
    alertId?: string;
    thresholdType?: "absolute" | "percentage";
    percentageChange?: number;
    referencePrice?: number;
    currentPrice?: number;
  };
  alerts: PriceAlert[];
  onAddAlert?: (
    token: string,
    targetPrice: number,
    condition: "above" | "below",
    thresholdType?: "absolute" | "percentage",
    percentageChange?: number,
    referencePrice?: number
  ) => void;
  onRemoveAlert?: (id: string) => void;
  onRemoveAllAlerts?: () => void;
  notificationsEnabled?: boolean;
  notificationsDenied?: boolean;
  onEnableNotifications?: () => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function AlertsCard({ data, alerts, onAddAlert, onRemoveAlert, onRemoveAllAlerts, notificationsEnabled, notificationsDenied, onEnableNotifications }: AlertsCardProps) {
  if (data.type === "set_alert" && data.token && data.targetPrice && data.condition) {
    const thresholdType = data.thresholdType || "absolute";
    const existing = alerts.find(
      a => a.token === data.token && a.targetPrice === data.targetPrice && a.condition === data.condition && !a.triggered
    );

    const isPercentage = thresholdType === "percentage";

    return (
      <Card
        className="overflow-visible border-0 p-4"
        style={{ background: "#0F1320", border: "1px solid #1B2030" }}
        data-testid="card-set-alert"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "#1B2030" }}
          >
            {isPercentage ? (
              <Percent className="w-5 h-5" style={{ color: "#9BA4AE" }} />
            ) : (
              <Bell className="w-5 h-5" style={{ color: "#E6EDF3" }} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#E6EDF3" }}>
              Price Alert
            </p>
            <p className="text-xs" style={{ color: "#9BA4AE" }}>
              {isPercentage && data.percentageChange
                ? `${data.token} moves ${data.condition === "above" ? "up" : "down"} ${Math.abs(data.percentageChange)}%`
                : `${data.token} ${data.condition === "above" ? "rises above" : "drops below"} $${formatPrice(data.targetPrice)}`
              }
            </p>
            {data.currentPrice && (
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                Current: ${formatPrice(data.currentPrice)}
              </p>
            )}
          </div>
        </div>

        {existing ? (
          <p className="text-xs" style={{ color: "#9BA4AE" }}>
            This alert is already active.
          </p>
        ) : (
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => onAddAlert?.(
                data.token!,
                data.targetPrice!,
                data.condition!,
                thresholdType,
                data.percentageChange,
                data.referencePrice || data.currentPrice
              )}
              data-testid="button-confirm-alert"
            >
              <Bell className="w-4 h-4 mr-2" />
              Set Alert
            </Button>
            {notificationsDenied ? (
              <p className="w-full text-xs py-1.5 text-center" style={{ color: "#6B7280" }}>
                Browser notifications blocked. Update your browser settings to enable them.
              </p>
            ) : notificationsEnabled === false && onEnableNotifications ? (
              <button
                onClick={onEnableNotifications}
                className="w-full text-xs py-1.5 rounded flex items-center justify-center gap-1.5"
                style={{ color: "#9BA4AE" }}
                data-testid="button-enable-notifications"
              >
                <BellOff className="w-3 h-3" />
                Enable browser notifications
              </button>
            ) : null}
          </div>
        )}
      </Card>
    );
  }

  if (data.type === "view_alerts") {
    const activeAlerts = alerts.filter(a => !a.triggered);

    return (
      <Card
        className="overflow-visible border-0 p-4"
        style={{ background: "#0F1320", border: "1px solid #1B2030" }}
        data-testid="card-view-alerts"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "#1B2030" }}
            >
              <BellRing className="w-5 h-5" style={{ color: "#E6EDF3" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#E6EDF3" }}>
                Active Alerts
              </p>
              <p className="text-xs" style={{ color: "#9BA4AE" }}>
                {activeAlerts.length} alert{activeAlerts.length !== 1 ? "s" : ""} set
              </p>
            </div>
          </div>
          {activeAlerts.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveAllAlerts?.()}
              data-testid="button-clear-all-alerts"
            >
              Clear All
            </Button>
          )}
        </div>

        {activeAlerts.length === 0 ? (
          <div className="text-xs space-y-1.5" style={{ color: "#6B7280" }}>
            <p>No active alerts.</p>
            <p>Try:</p>
            <ul className="list-none space-y-0.5 ml-1">
              <li>"alert me when SOL hits $200"</li>
              <li>"notify me if BTC drops below $50000"</li>
              <li>"alert me if ETH moves up 10%"</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg"
                style={{ background: "#1C1C1F" }}
                data-testid={`alert-item-${alert.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {alert.condition === "above" ? (
                    <TrendingUp className="w-4 h-4 shrink-0" style={{ color: "#22C55E" }} />
                  ) : (
                    <TrendingDown className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#E6EDF3" }}>
                      {alert.token}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#9BA4AE" }}>
                      {alert.thresholdType === "percentage" && alert.percentageChange
                        ? `${alert.condition === "above" ? "Up" : "Down"} ${Math.abs(alert.percentageChange)}%`
                        : `${alert.condition === "above" ? "Above" : "Below"} $${formatPrice(alert.targetPrice)}`
                      }
                      {alert.currentPrice ? ` (now $${alert.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })})` : ""}
                    </p>
                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      {timeAgo(alert.createdAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveAlert?.(alert.id)}
                  data-testid={`button-remove-alert-${alert.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeAlerts.length > 0 && (notificationsDenied ? (
          <p className="w-full text-xs py-2 mt-3 text-center" style={{ color: "#6B7280" }}>
            Browser notifications blocked. Update your browser settings to enable them.
          </p>
        ) : notificationsEnabled === false && onEnableNotifications ? (
          <button
            onClick={onEnableNotifications}
            className="w-full text-xs py-2 mt-3 rounded flex items-center justify-center gap-1.5"
            style={{ color: "#9BA4AE", background: "#111520" }}
            data-testid="button-enable-notifications-view"
          >
            <BellOff className="w-3 h-3" />
            Enable browser notifications for alerts
          </button>
        ) : null)}
      </Card>
    );
  }

  if (data.type === "remove_alert") {
    return (
      <Card
        className="overflow-visible border-0 p-4"
        style={{ background: "#0F1320", border: "1px solid #1B2030" }}
        data-testid="card-remove-alert"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "#1B2030" }}
          >
            <Bell className="w-5 h-5" style={{ color: "#9BA4AE" }} />
          </div>
          <p className="text-sm" style={{ color: "#E6EDF3" }}>
            Alert removed.
          </p>
        </div>
      </Card>
    );
  }

  return null;
}
