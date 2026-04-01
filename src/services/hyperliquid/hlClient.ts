const HL_API = 'https://api.hyperliquid.xyz';

export async function hlInfoPost(body: Record<string, unknown>, signal?: AbortSignal) {
  const res = await fetch(`${HL_API}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HL info ${res.status}`);
  return res.json();
}

export async function hlExchangePost(body: Record<string, unknown>, signal?: AbortSignal) {
  const res = await fetch(`${HL_API}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HL exchange ${res.status}`);
  return res.json();
}

export { HL_API };
