export type AlertTier = "free" | "pro";
export const ACTIVE_ALERT_LIMITS = { free: 0, pro: null } as const;
export function canCreatePriceAlert(tier: AlertTier, alerts: readonly { triggered: boolean }[]): boolean {
  const limit = ACTIVE_ALERT_LIMITS[tier];
  return limit === null || alerts.filter((alert) => alert.triggered === false).length < limit;
}