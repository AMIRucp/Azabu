/**
 * Integrator / referral fee configuration
 *
 * Environment variables to set:
 *
 * JUPITER_PLATFORM_FEE_BPS   – Basis points charged on Jupiter swaps (50 = 0.5%).
 *                               Jupiter takes 20%, Azabu receives 80%.
 *                               Valid range: 0–255.
 *
 * JUPITER_FEE_ACCOUNT        – Base-58 Solana token account that receives Jupiter
 *                               platform fees (derive from referral key + USDC mint).
 *
 * HL_REFERRAL_CODE           – Your Hyperliquid referral code (set once per user
 *                               account when their trading agent is approved).
 *                               Must first be registered at app.hyperliquid.xyz.
 *
 * HL_BUILDER_ADDRESS         – Hyperliquid EVM address for builder fee collection.
 *
 * HL_BUILDER_FEE_TENTHS_BPS  – Fee in tenths of a basis point (1 = 0.1 bps).
 *                               Max 100 (= 10 bps = 0.1%). Defaults to 1.
 *
 * APRICITY_TREASURY_WALLET   – Solana wallet used as Drift builder/referrer pubkey.
 *                               Already wired into drift perp-order route.
 */

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
