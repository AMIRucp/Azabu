export function serializeBigInt<T>(obj: T): T {
  if (typeof obj === "bigint") {
    return obj.toString() as T;
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as T;
  }
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = serializeBigInt(v);
    }
    return out as T;
  }
  return obj;
}
