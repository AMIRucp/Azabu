

export const JUPITER_PLATFORM_FEE_BPS = (() => {
  const v = parseInt(process.env.JUPITER_PLATFORM_FEE_BPS || "0", 10);
  if (!Number.isFinite(v) || v < 0 || v > 255) return 0;
  return v;
})();

export const JUPITER_FEE_ACCOUNT = process.env.JUPITER_FEE_ACCOUNT || "";

export const HL_BUILDER_ADDRESS = process.env.HL_BUILDER_ADDRESS || "";

export const HL_BUILDER_FEE_TENTHS_BPS = (() => {
  const v = parseInt(process.env.HL_BUILDER_FEE_TENTHS_BPS || "1", 10);
  if (!Number.isFinite(v) || v < 0 || v > 100) return 1;
  return v;
})();

export const DRIFT_BUILDER_WALLET = process.env.APRICITY_TREASURY_WALLET || "";
