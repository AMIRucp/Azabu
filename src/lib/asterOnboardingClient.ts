import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import { fetchAsterSetupStatus } from "@/lib/asterSetupStatusClient";
import type { AsterSetupStatus } from "@/lib/asterSetupStatus";
import {
  ensureWalletOnBscChain,
  restoreWalletChain,
  signAsterWeb3MessageWithWallet,
} from "@/lib/asterWeb3Sign";

type EthProvider = {
  chainId?: string;
  request: (args: { method: string; params: unknown[] }) => Promise<string>;
};

export async function fetchAsterAgentAddress(walletAddress: string): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/aster/agent-address?userAddress=${encodeURIComponent(walletAddress)}`,
      { headers: asterWalletHeaders(walletAddress), cache: "no-store" }
    );
    const data = (await res.json()) as { agentAddress?: string; error?: string };
    if (!res.ok || !data.agentAddress) return null;
    return data.agentAddress;
  } catch {
    return null;
  }
}

type PreparePayload = {
  alreadyExists?: boolean;
  agentAddress?: string;
  needsCreate?: boolean;
  prepare?: boolean;
  message?: string;
  nonce?: string;
  error?: string;
};

type CreatePayload = {
  success?: boolean;
  alreadyExists?: boolean;
  agentAddress?: string;
  error?: string;
  nonceExpired?: boolean;
  duplicateLabel?: boolean;
  needsNewSign?: boolean;
};

async function asterCreateApiKeyWorkflow(
  walletAddress: string,
  ethereum: EthProvider,
  options?: { forceWeb3?: boolean; onStatus?: (msg: string) => void },
): Promise<{ agentAddress: string }> {
  const forceWeb3 = options?.forceWeb3 === true;
  const onStatus = options?.onStatus;
  const forceQ = forceWeb3 ? "&forceWeb3=1" : "";
  const headers = {
    "Content-Type": "application/json",
    ...asterWalletHeaders(walletAddress),
  };

  if (!forceWeb3) {
    const createKeyQuery = `walletAddress=${encodeURIComponent(walletAddress)}`;
    const checkRes = await fetch(`/api/aster/create-api-key?${createKeyQuery}`, {
      headers: asterWalletHeaders(walletAddress),
      cache: "no-store",
    });
    const check = (await checkRes.json()) as PreparePayload;
    if (checkRes.ok && check.alreadyExists && check.agentAddress) {
      return { agentAddress: check.agentAddress };
    }
  }

  const previousChain = ethereum.chainId;
  onStatus?.("Switching to BNB Chain for Astherus sign-in…");
  await ensureWalletOnBscChain(ethereum);

  const runOnce = async (): Promise<{ agentAddress: string }> => {
    onStatus?.("Preparing Astherus sign-in…");
    const prepareRes = await fetch("/api/aster/create-api-key", {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({ walletAddress, prepare: true, ...(forceWeb3 ? { forceWeb3: true } : {}) }),
    });
    const prepare = (await prepareRes.json()) as PreparePayload;

    if (!prepareRes.ok) {
      throw new Error(prepare.error || "Failed to get fresh nonce from Aster");
    }

    if (prepare.alreadyExists && prepare.agentAddress) {
      return { agentAddress: prepare.agentAddress };
    }

    const message = prepare.message;
    const nonce = prepare.nonce;
    if (!message || !nonce) {
      throw new Error(prepare.error || "Missing sign message from Aster");
    }

    onStatus?.("Sign in your wallet, then we submit immediately");
    const signature = await signAsterWeb3MessageWithWallet(message, walletAddress, ethereum, {
      alreadyOnBsc: true,
    });

    onStatus?.("Submitting to Aster…");
    const createRes = await fetch("/api/aster/create-api-key", {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        walletAddress,
        signature,
        nonce,
        message,
        ...(forceWeb3 ? { forceWeb3: true } : {}),
      }),
    });
    const created = (await createRes.json()) as CreatePayload;

    if (!createRes.ok || (!created.success && !created.alreadyExists)) {
      if (created.nonceExpired || createRes.status === 410) {
        throw new Error("NONCE_EXPIRED");
      }
      if (created.duplicateLabel || createRes.status === 409) {
        throw new Error("DUPLICATE_API_KEY_LABEL");
      }

      const err = created.error || "Failed to create Aster API key";
      if (/already|exist|duplicate/i.test(err)) {
        const addr = await fetchAsterAgentAddress(walletAddress);
        if (addr) return { agentAddress: addr };
      }
      if (/auth failed|signature/i.test(err)) {
        throw new Error(
          `${err} — Sign the Astherus message when your wallet prompts you, then try again right away.`,
        );
      }
      throw new Error(err);
    }

    if (!created.agentAddress) {
      throw new Error("Aster did not return an agent address");
    }

    return { agentAddress: created.agentAddress };
  };

  try {
    try {
      return await runOnce();
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message === "NONCE_EXPIRED" || e.message === "DUPLICATE_API_KEY_LABEL")
      ) {
        onStatus?.("Getting a fresh sign-in — approve once more in your wallet");
        try {
          return await runOnce();
        } catch (retryErr) {
          if (retryErr instanceof Error && retryErr.message === "NONCE_EXPIRED") {
            throw new Error(
              "Astherus sign-in expired. Confirm in your wallet right after each prompt, then tap Try Again.",
            );
          }
          if (retryErr instanceof Error && retryErr.message === "DUPLICATE_API_KEY_LABEL") {
            throw new Error(
              "Could not register a new API key on Aster. Wait a minute and try again, or contact support.",
            );
          }
          throw retryErr;
        }
      }
      throw e;
    }
  } finally {
    await restoreWalletChain(ethereum, previousChain);
  }
}

export async function ensureAsterApiWallet(
  walletAddress: string,
  ethereum: EthProvider,
  options?: { forceWeb3?: boolean; onStatus?: (msg: string) => void },
): Promise<{ agentAddress: string }> {
  return asterCreateApiKeyWorkflow(walletAddress, ethereum, options);
}

export const ensureAsterWeb3Account = ensureAsterApiWallet;

export async function pollAsterSetupStatusClient(
  walletAddress: string,
  attempts = 6,
  delayMs = 1500
): Promise<AsterSetupStatus | null> {
  let last: AsterSetupStatus | null = null;
  for (let i = 0; i < attempts; i++) {
    last = await fetchAsterSetupStatus(walletAddress);
    if (last?.ready) return last;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return last;
}
