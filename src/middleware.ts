import { NextRequest, NextResponse } from "next/server";

// Edge middleware: in-memory rate limiting as fast first-line defense.
// DB-backed persistent rate limiting is applied at route level via server/security.ts withRateLimit().
const RATE_LIMIT_WINDOW = 60_000;
const API_MAX = 60;
const TRADE_PATHS = [
  "/api/aster/open-position",
  "/api/aster/close-position",
  "/api/drift/perp-order",
  "/api/swap/execute",
  "/api/send",
  "/api/trigger/execute",
  "/api/submit-transaction",
  "/api/submit-fee-tx",
  "/api/bonkfun/launch",
  "/api/pumpfun/launch",
  "/api/dca/execute",
  "/api/lend/deposit",
  "/api/lend/withdraw",

];
const TRADE_MAX = 10;

const MAX_BODY_SIZE = 1_048_576;
const TRADE_MAX_BODY_SIZE = 102_400;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}, 30_000);

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRate(ip: string, path: string, max: number): boolean {
  const key = `${ip}:${path}`;
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    store.set(key, entry);
  }
  entry.count++;
  return entry.count <= max;
}

function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") || "";

  if (!origin && !referer) return false;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = getIP(req);
    const isTrade = TRADE_PATHS.some((p) => pathname.startsWith(p));
    const max = isTrade ? TRADE_MAX : API_MAX;

    if (!checkRate(ip, pathname, max)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
      if (!checkOrigin(req)) {
        return NextResponse.json(
          { error: "Request blocked" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }

      const contentLength = req.headers.get("content-length");
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        const limit = isTrade ? TRADE_MAX_BODY_SIZE : MAX_BODY_SIZE;
        if (!isNaN(size) && size > limit) {
          return NextResponse.json(
            { error: "Request payload too large" },
            { status: 413, headers: { "X-Content-Type-Options": "nosniff" } }
          );
        }
      }
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  if (req.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
