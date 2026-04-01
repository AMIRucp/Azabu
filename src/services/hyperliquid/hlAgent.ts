import { randomBytes } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const AGENT_FILE = join(DATA_DIR, 'hl-agents.json');

const agentStore = new Map<string, string>();

function loadFromDisk() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (existsSync(AGENT_FILE)) {
      const raw = readFileSync(AGENT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') agentStore.set(k, v);
      }
    }
  } catch {}
}

function saveToDisk() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const obj: Record<string, string> = {};
    agentStore.forEach((v, k) => { obj[k] = v; });
    writeFileSync(AGENT_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {}
}

loadFromDisk();

export function generateAgentWallet(): { address: string; privateKey: string } {
  const key = '0x' + randomBytes(32).toString('hex');
  const { privateKeyToAccount } = require('viem/accounts');
  const account = privateKeyToAccount(key as `0x${string}`);
  return { address: account.address, privateKey: key };
}

export function storeAgentKey(userAddress: string, agentPrivateKey: string) {
  agentStore.set(userAddress.toLowerCase(), agentPrivateKey);
  saveToDisk();
}

export function getAgentKey(userAddress: string): string | undefined {
  return agentStore.get(userAddress.toLowerCase());
}

export function hasAgent(userAddress: string): boolean {
  return agentStore.has(userAddress.toLowerCase());
}

export function getApproveAgentPayload(agentAddress: string, chainId: number = 1337) {
  return {
    domain: {
      name: 'HyperliquidSignTransaction',
      version: '1',
      chainId,
      verifyingContract: '0x0000000000000000000000000000000000000000' as const,
    },
    types: {
      'HyperliquidTransaction:ApproveAgent': [
        { name: 'hyperliquidChain', type: 'string' },
        { name: 'agentAddress', type: 'address' },
        { name: 'agentName', type: 'string' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    primaryType: 'HyperliquidTransaction:ApproveAgent' as const,
    message: {
      hyperliquidChain: 'Mainnet',
      agentAddress,
      agentName: 'AFX Trading Agent',
      nonce: Date.now(),
    },
  };
}
