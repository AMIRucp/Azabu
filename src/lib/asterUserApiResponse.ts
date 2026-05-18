import { NextResponse } from "next/server";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Vary: "x-evm-address",
} as const;

export function asterPrivateJson(body: unknown, init?: { status?: number }): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: PRIVATE_HEADERS,
  });
}
