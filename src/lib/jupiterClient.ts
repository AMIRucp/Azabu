export const JUP_QUOTE_API = "/api/swap";
export const JUP_TOKEN_ALL = "https://token.jup.ag/all";
export const JUP_TOKEN_STRICT = "https://token.jup.ag/strict";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const KNOWN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  JTO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  PYTH: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  MSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  JITOSOL: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  BTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  ETH: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  RENDER: "rndrizKT3MK1iimdxRdTEMQvmgzmNY3Z7GZABGPCZQ",
  PAXG: "CpMah17kLowWgMgZJvHGJLMkseGm1bFMbg5xmGCsU7rm",
  ONDO: "FLAGdji7XDXH4cBUJNciR4i5TeLaKoLYbHcb1F9HEiEA",
  PRCL: "4LLbsb5ReP3yEtYzmXewyGjcRJMx2EoYi546C2oiY5sA",
  HNT: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
  MOBILE: "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
  IOT: "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns",
  MAPLE: "JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtS",
};

export const KNOWN_DECIMALS: Record<string, number> = {
  "So11111111111111111111111111111111111111112": 9,
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": 6,
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": 6,
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": 5,
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": 6,
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": 6,
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3": 6,
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh": 8,
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": 8,
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": 9,
  "FLAGdji7XDXH4cBUJNciR4i5TeLaKoLYbHcb1F9HEiEA": 6,
  "4LLbsb5ReP3yEtYzmXewyGjcRJMx2EoYi546C2oiY5sA": 6,
  "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux": 8,
  "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6": 6,
  "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns": 6,
  "JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtS": 6,
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": 9,
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": 6,
  "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": 6,
  "rndrizKT3MK1iimdxRdTEMQvmgzmNY3Z7GZABGPCZQ": 8,
  "CpMah17kLowWgMgZJvHGJLMkseGm1bFMbg5xmGCsU7rm": 8,
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL": 9,
};

export interface JupToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  daily_volume?: number;
}

let _jupTokenMap: Map<string, JupToken> | null = null;
let _jupTokenFetch: Promise<Map<string, JupToken>> | null = null;

export async function jupLoadTokenMap(): Promise<Map<string, JupToken>> {
  if (_jupTokenMap) return _jupTokenMap;
  if (_jupTokenFetch) return _jupTokenFetch;
  _jupTokenFetch = (async () => {
    let list: any[] = [];
    try {
      const r = await fetch(JUP_TOKEN_ALL);
      if (r.ok) list = await r.json();
    } catch {}
    if (!list.length) {
      try {
        const r = await fetch(JUP_TOKEN_STRICT);
        if (r.ok) list = await r.json();
      } catch {}
    }
    const map = new Map<string, JupToken>();
    for (const t of list) {
      if (!t.symbol || !t.address) continue;
      const key = t.symbol.toUpperCase();
      const existing = map.get(key);
      if (!existing || (t.daily_volume ?? 0) > (existing.daily_volume ?? 0))
        map.set(key, t);
    }
    _jupTokenMap = map;
    _jupTokenFetch = null;
    return map;
  })();
  return _jupTokenFetch;
}

export async function jupResolve(
  symbol: string
): Promise<{ mint: string; symbol: string; name: string; decimals: number; logoURI?: string } | null> {
  const sym = (symbol || "").toUpperCase();
  if (KNOWN_MINTS[sym]) {
    const mint = KNOWN_MINTS[sym];
    return { mint, symbol: sym, name: symbol, decimals: KNOWN_DECIMALS[mint] ?? 6 };
  }
  const map = await jupLoadTokenMap();
  const token = map.get(sym);
  if (!token) {
    for (const [k, v] of map) {
      if (k.startsWith(sym))
        return { mint: v.address, symbol: v.symbol, name: v.name, decimals: v.decimals ?? 6, logoURI: v.logoURI };
    }
    return null;
  }
  return { mint: token.address, symbol: token.symbol, name: token.name, decimals: token.decimals ?? 6, logoURI: token.logoURI };
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  inputAmount: string,
  inputDecimals: number,
  slippageBps: string
) {
  const amountIn = Math.floor(parseFloat(inputAmount) * 10 ** inputDecimals);
  if (!amountIn || amountIn <= 0) return null;

  const params: Record<string, string> = {
    inputMint,
    outputMint,
    amount: amountIn.toString(),
  };

  if (slippageBps === "auto") {
    params.autoSlippage = "true";
    params.autoSlippageCollisionUsdValue = "1000";
    params.maxAutoSlippageBps = "300";
  } else {
    params.slippageBps = String(Math.round(parseFloat(slippageBps) * 100));
  }

  const res = await fetch(`${JUP_QUOTE_API}/quote?${new URLSearchParams(params)}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Quote failed: ${body.slice(0, 120)}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function buildSwap(quoteResponse: any, walletPubkey: string) {
  const res = await fetch(`${JUP_QUOTE_API}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: walletPubkey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
      asLegacyTransaction: false,
    }),
  });
  if (!res.ok) throw new Error(`Swap build failed (${res.status})`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function fetchBalances(pubkey: string, rpcUrl: string) {
  try {
    const solRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [pubkey, { commitment: "confirmed" }],
      }),
    });
    const solData = await solRes.json();
    const solBalance = (solData.result?.value ?? 0) / 1e9;

    const splRes = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "getTokenAccountsByOwner",
        params: [
          pubkey,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed", commitment: "confirmed" },
        ],
      }),
    });
    const splData = await splRes.json();
    const tokens: Record<string, number> = {};
    for (const acct of splData.result?.value || []) {
      const info = acct.account?.data?.parsed?.info;
      if (!info) continue;
      const mint = info.mint;
      const amt = parseFloat(info.tokenAmount?.uiAmount || 0);
      if (amt > 0) tokens[mint] = amt;
    }
    return { sol: solBalance, tokens };
  } catch {
    return { sol: 0, tokens: {} as Record<string, number> };
  }
}
