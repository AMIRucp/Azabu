import { Keypair } from '@solana/web3.js';
import axios from 'axios';
import FormData from 'form-data';
import { buildFeeTx, calcLaunchFeeSol, calcLaunchFeeLamports, FEES } from './fees';

const IPFS_ENDPOINT = 'https://pump.fun/api/ipfs';
const PUMPPORTAL_ENDPOINT = 'https://pumpportal.fun/api/trade-local';

export const LAUNCH_LIMITS = {
  NAME_MIN: 1,
  NAME_MAX: 30,
  SYMBOL_MIN: 1,
  SYMBOL_MAX: 10,
  DESCRIPTION_MAX: 280,
  INITIAL_BUY_MIN: 0,
  INITIAL_BUY_MAX: 5,
  INITIAL_BUY_DEFAULT: 0,
  SLIPPAGE_MIN: 1,
  SLIPPAGE_MAX: 20,
  SLIPPAGE_DEFAULT: 10,
  PRIORITY_FEE_MIN: 0.0001,
  PRIORITY_FEE_MAX: 0.05,
  PRIORITY_FEE_DEFAULT: 0.0005,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  CREATION_FEE_ESTIMATE: 0.02,
  PUMP_FUN_FIRST_BUY_FEE: 0.025,
};

const BANNED_WORDS = ['scam', 'rugpull', 'ponzi'];

export interface LaunchIntent {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialBuySol?: number;
  slippagePercent?: number;
  priorityFeeSol?: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  creatorPublicKey: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  normalizedIntent?: LaunchIntent;
  estimatedCostSol?: number;
}

export interface LaunchTransactionResult {
  ok: boolean;
  transaction?: string;
  feeTransaction?: string;
  platformFeeSol?: number;
  feeLabel?: string;
  mintAddress?: string;
  mintKeypairSecret?: string;
  metadataUri?: string;
  pumpfunUrl?: string;
  error?: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function validateAndNormalize(intent: LaunchIntent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!intent.name || typeof intent.name !== 'string') {
    errors.push('Token name is required');
  }
  if (!intent.symbol || typeof intent.symbol !== 'string') {
    errors.push('Token symbol is required');
  }
  if (!intent.creatorPublicKey) {
    errors.push('Creator wallet public key is required');
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  const name = intent.name.trim();
  let symbol = intent.symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (name.length < LAUNCH_LIMITS.NAME_MIN || name.length > LAUNCH_LIMITS.NAME_MAX) {
    errors.push(`Token name must be ${LAUNCH_LIMITS.NAME_MIN}-${LAUNCH_LIMITS.NAME_MAX} characters (got ${name.length})`);
  }
  if (/[\x00-\x1F]/.test(name)) {
    errors.push('Token name contains invalid control characters');
  }

  if (symbol.length < LAUNCH_LIMITS.SYMBOL_MIN || symbol.length > LAUNCH_LIMITS.SYMBOL_MAX) {
    errors.push(`Symbol must be ${LAUNCH_LIMITS.SYMBOL_MIN}-${LAUNCH_LIMITS.SYMBOL_MAX} uppercase letters/digits (got ${symbol.length})`);
  }

  const description = (intent.description || `${name} token`).trim();
  if (description.length > LAUNCH_LIMITS.DESCRIPTION_MAX) {
    errors.push(`Description max ${LAUNCH_LIMITS.DESCRIPTION_MAX} chars (got ${description.length})`);
  }

  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerName.includes(word) || lowerSymbol.includes(word)) {
      errors.push(`Name/symbol contains banned word: "${word}"`);
    }
  }

  const initialBuySol = clamp(
    intent.initialBuySol ?? LAUNCH_LIMITS.INITIAL_BUY_DEFAULT,
    LAUNCH_LIMITS.INITIAL_BUY_MIN,
    LAUNCH_LIMITS.INITIAL_BUY_MAX
  );
  const slippagePercent = clamp(
    intent.slippagePercent ?? LAUNCH_LIMITS.SLIPPAGE_DEFAULT,
    LAUNCH_LIMITS.SLIPPAGE_MIN,
    LAUNCH_LIMITS.SLIPPAGE_MAX
  );
  const priorityFeeSol = clamp(
    intent.priorityFeeSol ?? LAUNCH_LIMITS.PRIORITY_FEE_DEFAULT,
    LAUNCH_LIMITS.PRIORITY_FEE_MIN,
    LAUNCH_LIMITS.PRIORITY_FEE_MAX
  );

  if (initialBuySol > 0 && initialBuySol < 0.01) {
    errors.push('If buying, minimum dev buy is 0.01 SOL');
  }

  if (initialBuySol !== (intent.initialBuySol ?? LAUNCH_LIMITS.INITIAL_BUY_DEFAULT)) {
    warnings.push(`Dev buy clamped to ${initialBuySol} SOL (was ${intent.initialBuySol})`);
  }
  if (initialBuySol > 2) {
    warnings.push(`Dev buy of ${initialBuySol} SOL is significant. Funds are at risk.`);
  }

  const urlFields = ['twitter', 'telegram', 'website', 'imageUrl'] as const;
  for (const field of urlFields) {
    const val = intent[field];
    if (val && typeof val === 'string' && val.length > 0) {
      if (!val.startsWith('https://') && !val.startsWith('http://')) {
        errors.push(`${field} must be a valid URL starting with https://`);
      }
      if (val.length > 200) {
        errors.push(`${field} URL too long (max 200 chars)`);
      }
    }
  }

  const afxFee = calcLaunchFeeSol(initialBuySol);
  const networkFee = initialBuySol > 0 ? LAUNCH_LIMITS.PUMP_FUN_FIRST_BUY_FEE : 0.000005;
  const estimatedCostSol = initialBuySol + priorityFeeSol + networkFee + afxFee;

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  return {
    ok: true,
    errors: [],
    warnings,
    normalizedIntent: {
      ...intent,
      name,
      symbol,
      description,
      initialBuySol,
      slippagePercent,
      priorityFeeSol,
    },
    estimatedCostSol,
  };
}

async function uploadToIPFS(params: {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  imageBuffer?: Buffer;
  imageName?: string;
  imageUrl?: string;
}): Promise<string> {
  const form = new FormData();

  form.append('name', params.name);
  form.append('symbol', params.symbol);
  form.append('description', params.description);
  form.append('showName', 'true');

  if (params.twitter) form.append('twitter', params.twitter);
  if (params.telegram) form.append('telegram', params.telegram);
  if (params.website) form.append('website', params.website);

  let imageBuffer = params.imageBuffer;
  let imageName = params.imageName || 'token-logo.png';

  if (!imageBuffer && params.imageUrl) {
    try {
      const imgRes = await axios.get(params.imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      imageBuffer = Buffer.from(imgRes.data);
    } catch (e) {
      console.warn('Failed to download image from URL, generating placeholder');
    }
  }

  if (!imageBuffer) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="64" fill="#1A1A1A"/>
      <text x="256" y="280" font-family="Arial,sans-serif" font-size="${params.symbol.length > 4 ? 80 : 120}" font-weight="bold" fill="#F5F2EB" text-anchor="middle" dominant-baseline="middle">${params.symbol}</text>
    </svg>`;
    imageBuffer = Buffer.from(svg);
    imageName = 'token-logo.svg';
  }

  const contentType = imageName.endsWith('.svg') ? 'image/svg+xml' :
    imageName.endsWith('.jpg') || imageName.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';

  form.append('file', imageBuffer, {
    filename: imageName,
    contentType,
  });

  const response = await axios.post(IPFS_ENDPOINT, form, {
    headers: form.getHeaders(),
    timeout: 30000,
  });

  if (!response.data || !response.data.metadataUri) {
    throw new Error('IPFS upload failed: no metadataUri returned');
  }

  return response.data.metadataUri;
}

async function buildCreateTransaction(params: {
  creatorPublicKey: string;
  mintPublicKey: string;
  tokenMetadata: { name: string; symbol: string; uri: string };
  devBuySol: number;
  slippage: number;
  priorityFee: number;
}): Promise<{ transactionBytes: Uint8Array }> {
  const response = await axios.post(
    PUMPPORTAL_ENDPOINT,
    {
      publicKey: params.creatorPublicKey,
      action: 'create',
      tokenMetadata: {
        name: params.tokenMetadata.name,
        symbol: params.tokenMetadata.symbol,
        uri: params.tokenMetadata.uri,
      },
      mint: params.mintPublicKey,
      denominatedInSol: 'true',
      amount: params.devBuySol,
      slippage: params.slippage,
      priorityFee: params.priorityFee,
      pool: 'pump',
    },
    {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  const bytes = new Uint8Array(response.data);
  if (bytes.length < 100) {
    const errorText = new TextDecoder().decode(bytes);
    throw new Error(`PumpPortal error: ${errorText}`);
  }

  return { transactionBytes: bytes };
}

export async function prepareLaunchTransaction(
  intent: LaunchIntent,
  imageBuffer?: Buffer,
  imageName?: string,
): Promise<LaunchTransactionResult> {
  const validation = validateAndNormalize(intent);
  if (!validation.ok || !validation.normalizedIntent) {
    return {
      ok: false,
      error: `Validation failed: ${validation.errors.join(', ')}`,
    };
  }

  const normalized = validation.normalizedIntent;

  try {
    const metadataUri = await uploadToIPFS({
      name: normalized.name,
      symbol: normalized.symbol,
      description: normalized.description,
      twitter: normalized.twitter,
      telegram: normalized.telegram,
      website: normalized.website,
      imageBuffer,
      imageName,
      imageUrl: normalized.imageUrl,
    });

    const mintKeypair = Keypair.generate();

    const { transactionBytes } = await buildCreateTransaction({
      creatorPublicKey: normalized.creatorPublicKey,
      mintPublicKey: mintKeypair.publicKey.toBase58(),
      tokenMetadata: {
        name: normalized.name,
        symbol: normalized.symbol,
        uri: metadataUri,
      },
      devBuySol: normalized.initialBuySol || 0,
      slippage: normalized.slippagePercent || 10,
      priorityFee: normalized.priorityFeeSol || 0.0005,
    });

    const mintAddress = mintKeypair.publicKey.toBase58();
    const initialBuySol = normalized.initialBuySol || 0;
    const platformFeeSol = calcLaunchFeeSol(initialBuySol);

    let feeTransaction: string | undefined;
    if (platformFeeSol > 0) {
      const feeLamports = calcLaunchFeeLamports(initialBuySol);
      feeTransaction = await buildFeeTx(normalized.creatorPublicKey, feeLamports);
    }

    return {
      ok: true,
      transaction: Buffer.from(transactionBytes).toString('base64'),
      feeTransaction,
      platformFeeSol,
      feeLabel: FEES.FEE_LABEL,
      mintAddress,
      mintKeypairSecret: Buffer.from(mintKeypair.secretKey).toString('base64'),
      metadataUri,
      pumpfunUrl: `https://pump.fun/coin/${mintAddress}`,
    };
  } catch (error: any) {
    console.error('Launch preparation failed:', error.message);

    let userMessage = error.message || 'Token launch preparation failed';
    if (error.message?.includes('IPFS')) {
      userMessage = "Couldn't upload token image. Try a smaller file or try again.";
    } else if (error.message?.includes('PumpPortal')) {
      userMessage = "Couldn't build the launch transaction. Try again in a moment.";
    } else if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
      userMessage = 'Network error. Check your connection and try again.';
    }

    return {
      ok: false,
      error: userMessage,
    };
  }
}

export function validateLaunchIntent(intent: LaunchIntent): ValidationResult {
  return validateAndNormalize(intent);
}
