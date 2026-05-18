import { ethers } from "ethers";

const OWNER_KEYS = ["user", "account", "wallet", "owner"] as const;

export function filterAsterPositionRiskForUser(rows: unknown[], requestedUser: string): unknown[] {
  let req: string;
  try {
    req = ethers.getAddress(requestedUser).toLowerCase();
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  let anyRowHasOwnerKey = false;
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    for (const k of OWNER_KEYS) {
      const v = o[k];
      if (v == null) continue;
      const s = String(v).trim();
      if (/^0x[a-fA-F0-9]{40}$/i.test(s)) {
        anyRowHasOwnerKey = true;
        break;
      }
    }
    if (anyRowHasOwnerKey) break;
  }

  if (!anyRowHasOwnerKey) return rows;

  return rows.filter((r) => {
    if (!r || typeof r !== "object") return false;
    const o = r as Record<string, unknown>;
    let rowHadOwnerField = false;
    for (const k of OWNER_KEYS) {
      if (!(k in o) || o[k] == null) continue;
      const s = String(o[k]).trim();
      if (!/^0x[a-fA-F0-9]{40}$/i.test(s)) continue;
      rowHadOwnerField = true;
      try {
        if (ethers.getAddress(s).toLowerCase() !== req) return false;
      } catch {
        return false;
      }
    }
    if (!rowHadOwnerField) return false;
    return true;
  });
}

export function filterAsterPositionsDropSignerTaggedRows(
  rows: unknown[],
  requestedUser: string,
  signerAddress: string
): unknown[] {
  let req: string;
  let sig: string;
  try {
    req = ethers.getAddress(requestedUser).toLowerCase();
    sig = ethers.getAddress(signerAddress).toLowerCase();
  } catch {
    return rows;
  }
  if (req === sig) return rows;

  return rows.filter((r) => {
    if (!r || typeof r !== "object") return false;
    const o = r as Record<string, unknown>;
    for (const k of OWNER_KEYS) {
      if (!(k in o) || o[k] == null) continue;
      const s = String(o[k]).trim();
      if (!/^0x[a-fA-F0-9]{40}$/i.test(s)) continue;
      try {
        if (ethers.getAddress(s).toLowerCase() === sig) return false;
      } catch {
        continue;
      }
    }
    return true;
  });
}

export function sanitizeAsterPositionRiskPayload(
  rawRows: unknown[],
  requestedUser: string,
  signerAddress: string
): unknown[] {
  let rows = rawRows;
  rows = filterAsterPositionRiskForUser(rows, requestedUser);
  rows = filterAsterPositionsDropSignerTaggedRows(rows, requestedUser, signerAddress);
  return rows;
}

export function coerceAsterFapiArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const data = o.data;
    if (Array.isArray(data)) return data;
    const result = o.result;
    if (Array.isArray(result)) return result;
  }
  return null;
}

function looksLikePositionRow(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!("symbol" in o)) return false;
  return (
    "positionAmt" in o ||
    "positionAMT" in o ||
    "positionSize" in o ||
    "notional" in o ||
    "positionValue" in o
  );
}

export function coerceAsterPositionRiskRows(raw: unknown): unknown[] | null {
  const direct = coerceAsterFapiArray(raw);
  if (direct) return direct;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const positions = o.positions;
    if (Array.isArray(positions)) return positions;
    const list = o.list;
    if (Array.isArray(list)) return list;
    const values = Object.values(o).filter(looksLikePositionRow);
    if (values.length > 0) return values;
  }
  return null;
}
