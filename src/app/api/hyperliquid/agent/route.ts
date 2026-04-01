import { NextRequest, NextResponse } from 'next/server';
import {
  generateAgentWallet,
  storeAgentKey,
  hasAgent,
  getApproveAgentPayload,
} from '@/services/hyperliquid/hlAgent';
import { applyReferralCode } from '@/services/hyperliquid/hlTrading';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userAddress } = body;

    if (action === 'check') {
      return NextResponse.json({ hasAgent: hasAgent(userAddress) });
    }

    if (action === 'generate') {
      const agent = generateAgentWallet();
      const payload = getApproveAgentPayload(agent.address);
      return NextResponse.json({
        agentAddress: agent.address,
        agentPrivateKey: agent.privateKey,
        eip712Payload: payload,
      });
    }

    if (action === 'confirm') {
      const { agentPrivateKey } = body;
      if (!agentPrivateKey || !userAddress) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      storeAgentKey(userAddress, agentPrivateKey);
      // Fire-and-forget referral code registration (non-blocking, non-fatal)
      applyReferralCode(agentPrivateKey as `0x${string}`).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('[HL Agent]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
