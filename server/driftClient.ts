import { Connection, PublicKey } from "@solana/web3.js";

const AFX_TREASURY_WALLET = process.env.APRICITY_TREASURY_WALLET || "";

let builderPubkey: PublicKey | null = null;
try {
  if (AFX_TREASURY_WALLET) {
    builderPubkey = new PublicKey(AFX_TREASURY_WALLET);
  }
} catch {
  builderPubkey = null;
}

export async function getBuilderReferrerInfo(): Promise<{
  referrer: PublicKey;
  referrerStats: PublicKey;
} | undefined> {
  if (!builderPubkey) return undefined;
  try {
    const { getUserAccountPublicKey, getUserStatsAccountPublicKey } = await import("@drift-labs/sdk");
    const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
    const referrer = await getUserAccountPublicKey(DRIFT_PROGRAM_ID, builderPubkey, 0);
    const referrerStats = getUserStatsAccountPublicKey(DRIFT_PROGRAM_ID, builderPubkey);
    return { referrer, referrerStats };
  } catch (e: any) {
    console.warn("[driftClient] Failed to derive builder referrer info:", e.message);
    return undefined;
  }
}

export async function ensureBuilderApproved(
  connection: Connection,
  _userPublicKey: PublicKey
): Promise<boolean> {
  if (!builderPubkey) {
    console.warn("[driftClient] No APRICITY_TREASURY_WALLET set (AFX_TREASURY_WALLET), skipping builder approval");
    return false;
  }
  try {
    const { getUserAccountPublicKey } = await import("@drift-labs/sdk");
    const DRIFT_PROGRAM_ID = new PublicKey("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
    const builderAccount = await getUserAccountPublicKey(DRIFT_PROGRAM_ID, builderPubkey!, 0);
    const acctInfo = await connection.getAccountInfo(builderAccount);
    if (!acctInfo) {
      console.warn("[driftClient] Builder account not found on-chain. Builder code fee sharing unavailable.");
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn("[driftClient] Builder approval check failed:", e.message);
    return false;
  }
}

export const DRIFT_PERP_MARKETS: Record<string, number> = {
  "SOL-PERP": 0,
  "BTC-PERP": 1,
  "ETH-PERP": 2,
  "APT-PERP": 3,
  "1MBONK-PERP": 4,
  "POL-PERP": 5,
  "ARB-PERP": 6,
  "DOGE-PERP": 7,
  "BNB-PERP": 8,
  "SUI-PERP": 9,
  "1MPEPE-PERP": 10,
  "OP-PERP": 11,
  "RENDER-PERP": 12,
  "XRP-PERP": 13,
  "HNT-PERP": 14,
  "INJ-PERP": 15,
  "LINK-PERP": 16,
  "JTO-PERP": 17,
  "TIA-PERP": 18,
  "JUP-PERP": 19,
  "WIF-PERP": 20,
};

export const DRIFT_SPOT_MARKET_INDICES: Record<string, number> = {
  USDC: 0,
  SOL: 1,
  BTC: 2,
  ETH: 3,
  USDT: 4,
  JTO: 5,
  JUP: 6,
  PYTH: 7,
  RNDR: 8,
  W: 9,
};

export const DRIFT_VAULTS: Record<string, string> = {
  USDC_EARN: "JCNCMFXo5M5qwUPg2Utu1u6YWp3MbygxqBsBeXXJfrpR",
  SOL_EARN: "Fzvz1NWfQMBB2DFMtg4RFMsAWiGNPnpBJrh9CKo2S1J",
  SUPERCHARGER: "DpBWNJJpN4VzFUP2QyFnTHEZZEwUHnRNHCMJ3JFx9Ey4",
};

const PERP_INDEX_TO_SYMBOL = Object.fromEntries(
  Object.entries(DRIFT_PERP_MARKETS).map(([k, v]) => [v, k])
);
const SPOT_INDEX_TO_SYMBOL = Object.fromEntries(
  Object.entries(DRIFT_SPOT_MARKET_INDICES).map(([k, v]) => [v, k])
);
export { PERP_INDEX_TO_SYMBOL, SPOT_INDEX_TO_SYMBOL };

function patchConnectionForNoBatch(connection: Connection): void {
  const originalRpcRequest = (connection as any)._rpcRequest.bind(connection);
  (connection as any)._rpcBatchRequest = async function (
    requests: Array<{ methodName: string; args: any[] }>
  ) {
    if (requests.length === 0) return [];
    const results = [];
    for (const req of requests) {
      try {
        const rpcResult = await originalRpcRequest(req.methodName, req.args);
        results.push(rpcResult);
      } catch (error: any) {
        results.push({ error: { message: error.message } });
      }
    }
    return results;
  };
}

function getRpcUrl(): string {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (heliusKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  }
  return "https://api.mainnet-beta.solana.com";
}

export async function createDriftClient(userPublicKey: string) {
  const { DriftClient, BulkAccountLoader } = await import("@drift-labs/sdk");

  const connection = new Connection(getRpcUrl(), { commitment: "confirmed" });
  patchConnectionForNoBatch(connection);
  const pubkey = new PublicKey(userPublicKey);

  const dummyWallet = {
    publicKey: pubkey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
    payer: { publicKey: pubkey } as any,
  };

  const accountLoader = new BulkAccountLoader(connection, "confirmed", 0);

  const driftClient = new DriftClient({
    connection,
    wallet: dummyWallet as any,
    env: "mainnet-beta" as any,
    activeSubAccountId: undefined,
    subAccountIds: [],
    skipLoadUsers: true,
    accountSubscription: {
      type: "polling" as any,
      accountLoader,
    },
  });

  await driftClient.subscribe();

  let userExists = false;
  try {
    const { getUserAccountPublicKey } = await import("@drift-labs/sdk");
    const userAccountPubkey = await getUserAccountPublicKey(
      driftClient.program.programId,
      pubkey,
      0
    );
    const acctInfo = await connection.getAccountInfo(userAccountPubkey);
    if (acctInfo) {
      await driftClient.addUser(0, pubkey);
      userExists = true;
    }
  } catch (e: any) {
    userExists = false;
  }

  return { driftClient, connection, pubkey, userExists };
}

export async function getDriftUser(driftClient: any, pubkey: PublicKey) {
  const user = driftClient.getUser();
  await user.fetchAccounts();
  return user;
}
