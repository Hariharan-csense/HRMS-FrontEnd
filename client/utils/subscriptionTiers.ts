export interface PricingTier {
  min_users: number;
  max_users: number | null;
  price: number;
  yearly_price: number;
}
export const readTiers = (value: unknown): PricingTier[] => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
};
export const tierRate = (
  record: { pricing_tiers?: PricingTier[] },
  count: number,
  cycle: "monthly" | "yearly",
) => {
  const tier = readTiers(record.pricing_tiers).find(
    (t) =>
      count >= t.min_users && (t.max_users === null || count <= t.max_users),
  );
  return tier
    ? Number(cycle === "yearly" ? tier.yearly_price : tier.price)
    : undefined;
};
