import { Keypair } from '@solana/web3.js';
import axios from 'axios';
import FormData from 'form-data';
import { buildFeeTx, calcLaunchFeeSol, calcLaunchFeeLamports, FEES } from './fees';

const LETSBONK_API = 'https://api.letsbonk.fun/token';
const LETSBONK_IPFS = 'https://api.letsbonk.fun/ipfs';

export const BONK_LAUNCH_LIMITS = {
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
  BONK_FIRST_BUY_FEE: 0.025,
};

const BANNED_WORDS = ['scam', 'rugpull', 'ponzi'];

export interface BonkLaunchIntent {
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

export interface BonkValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  normalizedIntent?: BonkLaunchIntent;
  estimatedCostSol?: number;
}

export interface BonkLaunchResult {
  ok: boolean;
  transaction?: string;
  feeTransaction?: string;
  platformFeeSol?: number;
  feeLabel?: string;
  mintAddress?: string;
  mintKeypairSecret?: string;
  metadataUri?: string;
  bonkfunUrl?: string;
  error?: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function validateBonkLaunch(intent: BonkLaunchIntent): BonkValidationResult {
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

  if (name.length < BONK_LAUNCH_LIMITS.NAME_MIN || name.length > BONK_LAUNCH_LIMITS.NAME_MAX) {
    errors.push(`Token name must be ${BONK_LAUNCH_LIMITS.NAME_MIN}-${BONK_LAUNCH_LIMITS.NAME_MAX} characters (got ${name.length})`);
  }
  if (/[\x00-\x1F]/.test(name)) {
    errors.push('Token name contains invalid control characters');
  }

  if (symbol.length < BONK_LAUNCH_LIMITS.SYMBOL_MIN || symbol.length > BONK_LAUNCH_LIMITS.SYMBOL_MAX) {
    errors.push(`Symbol must be ${BONK_LAUNCH_LIMITS.SYMBOL_MIN}-${BONK_LAUNCH_LIMITS.SYMBOL_MAX} uppercase letters/digits (got ${symbol.length})`);
  }

  const description = (intent.description || `${name} token`).trim();
  if (description.length > BONK_LAUNCH_LIMITS.DESCRIPTION_MAX) {
    errors.push(`Description max ${BONK_LAUNCH_LIMITS.DESCRIPTION_MAX} chars (got ${description.length})`);
  }

  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lowerName.includes(word) || lowerSymbol.includes(word)) {
      errors.push(`Name/symbol contains banned word: "${word}"`);
    }
  }

  const initialBuySol = clamp(
    intent.initialBuySol ?? BONK_LAUNCH_LIMITS.INITIAL_BUY_DEFAULT,
    BONK_LAUNCH_LIMITS.INITIAL_BUY_MIN,
    BONK_LAUNCH_LIMITS.INITIAL_BUY_MAX
  );
  const slippagePercent = clamp(
    intent.slippagePercent ?? BONK_LAUNCH_LIMITS.SLIPPAGE_DEFAULT,
    BONK_LAUNCH_LIMITS.SLIPPAGE_MIN,
    BONK_LAUNCH_LIMITS.SLIPPAGE_MAX
  );
  const priorityFeeSol = clamp(
    intent.priorityFeeSol ?? BONK_LAUNCH_LIMITS.PRIORITY_FEE_DEFAULT,
    BONK_LAUNCH_LIMITS.PRIORITY_FEE_MIN,
    BONK_LAUNCH_LIMITS.PRIORITY_FEE_MAX
  );

  if (initialBuySol > 0 && initialBuySol < 0.01) {
    errors.push('If buying, minimum dev buy is 0.01 SOL');
  }

  if (initialBuySol !== (intent.initialBuySol ?? BONK_LAUNCH_LIMITS.INITIAL_BUY_DEFAULT)) {
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
  const networkFee = initialBuySol > 0 ? BONK_LAUNCH_LIMITS.BONK_FIRST_BUY_FEE : 0.000005;
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

export const validateBonkLaunchIntent = validateBonkLaunch;

async function uploadBonkMetadata(
  name: string,
  symbol: string,
  description: string,
  imageBuffer?: Buffer,
  imageName?: string,
  socials?: { twitter?: string; telegram?: string; website?: string }
): Promise<{ metadataUri: string }> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('symbol', symbol);
  formData.append('description', description);

  if (socials?.twitter) formData.append('twitter', socials.twitter);
  if (socials?.telegram) formData.append('telegram', socials.telegram);
  if (socials?.website) formData.append('website', socials.website);

  if (imageBuffer && imageName) {
    let contentType = 'image/png';
    const lowerName = imageName.toLowerCase();
    if (lowerName.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (lowerName.endsWith('.gif')) contentType = 'image/gif';
    else if (lowerName.endsWith('.webp')) contentType = 'image/webp';
    formData.append('file', imageBuffer, {
      filename: imageName,
      contentType,
    });
  }

  try {
    const response = await axios.post(LETSBONK_IPFS, formData, {
      headers: formData.getHeaders(),
      timeout: 15000,
    });

    if (response.data?.metadataUri) {
      return { metadataUri: response.data.metadataUri };
    }

    return { metadataUri: response.data?.uri || response.data?.url || '' };
  } catch (error: any) {
    console.error('Bonk IPFS upload error:', error?.response?.data || error.message);
    throw new Error('Failed to upload token metadata to Bonk.fun IPFS. Please try again.');
  }
}

export async function prepareBonkLaunchTransaction(
  intent: BonkLaunchIntent,
  imageBuffer?: Buffer,
  imageName?: string
): Promise<BonkLaunchResult> {
  const validation = validateBonkLaunch(intent);
  if (!validation.ok) {
    return { ok: false, error: validation.errors.join('. ') };
  }

  const normalized = validation.normalizedIntent!;

  try {
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey.toString();
    const mintKeypairSecret = JSON.stringify(Array.from(mintKeypair.secretKey));

    let metadataUri = '';
    try {
      const result = await uploadBonkMetadata(
        normalized.name,
        normalized.symbol,
        normalized.description,
        imageBuffer,
        imageName,
        { twitter: normalized.twitter, telegram: normalized.telegram, website: normalized.website }
      );
      metadataUri = result.metadataUri;
    } catch (uploadErr: any) {
      console.error('Bonk metadata upload failed:', uploadErr.message);
      return { ok: false, error: uploadErr.message };
    }

    const createPayload: any = {
      publicKey: normalized.creatorPublicKey,
      action: 'create',
      tokenMetadata: {
        name: normalized.name,
        symbol: normalized.symbol,
        uri: metadataUri,
      },
      mint: mintAddress,
      denominatedInSol: 'true',
      amount: normalized.initialBuySol || 0,
      slippage: normalized.slippagePercent || 10,
      priorityFee: normalized.priorityFeeSol || 0.0005,
      pool: 'bonk',
    };

    let transaction: string;
    try {
      const txResponse = await axios.post(LETSBONK_API, createPayload, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (txResponse.data?.transaction) {
        transaction = txResponse.data.transaction;
      } else if (typeof txResponse.data === 'string') {
        transaction = txResponse.data;
      } else {
        throw new Error('No transaction data returned from LetsBonk API');
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.response?.data?.message || apiErr?.response?.data?.error || apiErr.message;
      console.error('LetsBonk API error:', errMsg);
      return { ok: false, error: `LetsBonk API error: ${errMsg}` };
    }

    let feeTransaction: string | undefined;
    let platformFeeSol = 0;

    if ((normalized.initialBuySol || 0) > 0) {
      platformFeeSol = calcLaunchFeeSol(normalized.initialBuySol || 0);
      const feeLamports = calcLaunchFeeLamports(normalized.initialBuySol || 0);
      if (feeLamports > 0) {
        try {
          feeTransaction = await buildFeeTx(
            normalized.creatorPublicKey,
            feeLamports
          );
        } catch (feeErr: any) {
          console.error('Fee tx build error:', feeErr.message);
        }
      }
    }

    const bonkfunUrl = `https://letsbonk.fun/token/${mintAddress}`;

    return {
      ok: true,
      transaction,
      feeTransaction,
      platformFeeSol,
      feeLabel: FEES.FEE_LABEL,
      mintAddress,
      mintKeypairSecret,
      metadataUri,
      bonkfunUrl,
    };
  } catch (err: any) {
    console.error('Bonk launch preparation error:', err);
    return { ok: false, error: 'Failed to prepare Bonk.fun launch transaction. Please try again.' };
  }
}
