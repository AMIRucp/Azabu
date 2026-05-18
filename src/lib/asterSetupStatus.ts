import { ethers } from "ethers";
import { getAsterBuilderAddress } from "@/config/asterFapi";
import { asterFapiV3UserSignedGet } from "@/lib/asterFapiV3UserSignedGet";
import { deriveAgentSignerForUser } from "@/lib/asterUserAgentSigner";

export type AsterSetupStatus = {
  user: string;
  
  derivedAgentAddress: string;
  builderAddress: string;
  
  hasAsterAccount: boolean;
  
  needsWeb3Registration: boolean;
  
  hasApiWallet: boolean;
  
  needsCreateApiWallet: boolean;
  agentApproved: boolean;
  builderApproved: boolean;
  ready: boolean;
  error?: string;
};

function coerceList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.list)) return o.list;
    if (Array.isArray(o.agents)) return o.agents;
    if (Array.isArray(o.builders)) return o.builders;
  }
  return [];
}

function listIncludesAddress(data: unknown, fieldNames: string[], target: string): boolean {
  const want = target.toLowerCase();
  for (const row of coerceList(data)) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    for (const field of fieldNames) {
      const v = r[field];
      if (typeof v === "string" && v.toLowerCase() === want) return true;
    }
  }
  return false;
}

export function isNoAsterUserError(message: string): boolean {
  return /no aster user found/i.test(message);
}

export function isAsterAccountMissingError(message: string): boolean {
  return (
    isNoAsterUserError(message) ||
    /account does not exist|open a futures account|please open a futures/i.test(message)
  );
}

export function isAsterAgentAuthError(message: string): boolean {
  if (isAsterAccountMissingError(message)) return false;
  return /not approved|expired|unauthorized|permission denied|invalid.*signer/i.test(message);
}

export async function getAsterSetupStatus(userWallet: string): Promise<AsterSetupStatus> {
  let user: string;
  try {
    user = ethers.getAddress(userWallet.trim());
  } catch {
    return {
      user: "",
      derivedAgentAddress: "",
      builderAddress: "",
      hasAsterAccount: false,
      needsWeb3Registration: true,
      hasApiWallet: false,
      needsCreateApiWallet: true,
      agentApproved: false,
      builderApproved: false,
      ready: false,
      error: "Invalid userAddress",
    };
  }

  const builderAddress = getAsterBuilderAddress();
  const signerResolved = deriveAgentSignerForUser(user);
  if (!signerResolved) {
    return {
      user,
      derivedAgentAddress: "",
      builderAddress,
      hasAsterAccount: true,
      needsWeb3Registration: false,
      hasApiWallet: false,
      needsCreateApiWallet: true,
      agentApproved: false,
      builderApproved: false,
      ready: false,
      error:
        "Aster signer not configured. Set ASTER_SIGNER_PRIVATE_KEY or ASTER_API_PRIVATE_KEY on the server.",
    };
  }

  const derivedAgentAddress = signerResolved.address;
  const signer = { address: signerResolved.address, privateKey: signerResolved.privateKey };

  const balance = await asterFapiV3UserSignedGet("balance", user, signer);
  const balanceErr = balance.ok ? "" : balance.error;

  if (!balance.ok && isAsterAccountMissingError(balanceErr)) {
    return {
      user,
      derivedAgentAddress,
      builderAddress,
      hasAsterAccount: false,
      needsWeb3Registration: true,
      hasApiWallet: false,
      needsCreateApiWallet: true,
      agentApproved: false,
      builderApproved: false,
      ready: false,
    };
  }

  let hasAsterAccount = balance.ok;
  let needsCreateApiWallet = false;

  if (!balance.ok) {
    const agents = await asterFapiV3UserSignedGet("agent", user, signer);
    if (agents.ok) {
      hasAsterAccount = true;
    } else if (isAsterAccountMissingError(balanceErr) || isAsterAccountMissingError(agents.error || "")) {
      hasAsterAccount = false;
      needsCreateApiWallet = true;
    } else {
      hasAsterAccount = false;
      needsCreateApiWallet = true;
    }
    if (
      hasAsterAccount &&
      /api.?key|api key|sign into astherus|broker-create|create_api_key|login required/i.test(
        balanceErr,
      )
    ) {
      needsCreateApiWallet = true;
    }
  }

  const hasApiWallet = hasAsterAccount;

  let agentApproved = balance.ok;
  if (!agentApproved) {
    const agents = await asterFapiV3UserSignedGet("agent", user, signer);
    if (agents.ok) {
      agentApproved = listIncludesAddress(agents.data, ["agentAddress", "agent_address"], derivedAgentAddress);
    }
  }

  let builderApproved = false;
  if (agentApproved || balance.ok) {
    const builders = await asterFapiV3UserSignedGet("builder", user, signer);
    if (builders.ok) {
      builderApproved = listIncludesAddress(
        builders.data,
        ["builderAddress", "builder"],
        builderAddress
      );
    }
  }

  const ready = balance.ok || (agentApproved && builderApproved);

  return {
    user,
    derivedAgentAddress,
    builderAddress,
    hasAsterAccount,
    needsWeb3Registration: !hasAsterAccount,
    hasApiWallet,
    needsCreateApiWallet,
    agentApproved,
    builderApproved,
    ready,
    error: ready ? undefined : balance.error,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function pollAsterSetupStatus(
  userWallet: string,
  options?: { attempts?: number; delayMs?: number }
): Promise<AsterSetupStatus> {
  const attempts = options?.attempts ?? 6;
  const delayMs = options?.delayMs ?? 1500;
  let last = await getAsterSetupStatus(userWallet);
  if (last.ready) return last;
  for (let i = 1; i < attempts; i++) {
    await sleep(delayMs);
    last = await getAsterSetupStatus(userWallet);
    if (last.ready) return last;
  }
  return last;
}
