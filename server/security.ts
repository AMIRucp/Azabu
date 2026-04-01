import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit } from "./rateLimiter";

const DEFAULT_MAX_REQUESTS = 60;
const TRADE_MAX_REQUESTS = 10;
const AUTH_MAX_REQUESTS = 5;

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function rateLimit(
  req: NextRequest,
  maxRequests = DEFAULT_MAX_REQUESTS
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = getClientIP(req);
  const path = new URL(req.url).pathname;
  const key = `${ip}:${path}`;
  return checkRateLimit(key, maxRequests);
}

export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  maxRequests = DEFAULT_MAX_REQUESTS
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const { allowed, remaining, resetAt } = await rateLimit(req, maxRequests);
    if (!allowed) return rateLimitResponse(resetAt);

    const response = await handler(req, ...args);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  };
}

export function withTradeRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withRateLimit(handler, TRADE_MAX_REQUESTS);
}

export function withAuthRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withRateLimit(handler, AUTH_MAX_REQUESTS);
}

export function sanitizeString(input: string, maxLength = 500): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:\s*text\/html/gi, "")
    .slice(0, maxLength)
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxStringLength = 500
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value, maxStringLength);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, maxStringLength);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export function validateWalletAddress(address: string): {
  valid: boolean;
  type: "solana" | "evm" | "unknown";
} {
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return { valid: true, type: "solana" };
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: true, type: "evm" };
  }
  return { valid: false, type: "unknown" };
}

export function validateNumericParam(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function validatePositiveAmount(value: unknown): number | null {
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num) || num <= 0) return null;
  return num;
}

export function generateRequestId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function logSecurityEvent(
  event: string,
  req: NextRequest,
  details?: Record<string, unknown>
): void {
  const ip = getClientIP(req);
  const path = new URL(req.url).pathname;
  console.warn(
    `[SECURITY] ${event} | ip=${ip} path=${path}`,
    details ? JSON.stringify(details) : ""
  );
}

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
