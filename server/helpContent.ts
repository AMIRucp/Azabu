export interface HelpEntry {
  title: string;
  explanation: string;
  steps: string[];
  exampleChips: string[];
  relatedChips: string[];
}

export const HELP_CONTENT: Record<string, HelpEntry> = {
  general: {
    title: 'Getting Started with AFX',
    explanation: 'AFX is a real-time search engine for trading. Type commands in plain English to swap tokens, trade perpetuals, check prices, and more.',
    steps: [
      'Type a trade command like "swap 1 SOL for USDC" or "long 2 SOL at 10x"',
      'Review the confirmation card with rates, fees, and details',
      'Click Confirm to execute. Transactions settle on-chain in seconds.',
      'Check your portfolio anytime with "my holdings" or "my positions"',
    ],
    exampleChips: ['swap 1 SOL for USDC', 'long 1 SOL at 5x', 'my holdings', 'price of SOL'],
    relatedChips: ['how to swap', 'how to trade perps', 'how to set stop loss', 'what tokens can I trade?'],
  },
  swap: {
    title: 'How to Swap Tokens',
    explanation: 'Type what you want to swap in plain English. AFX finds the best route via Jupiter and shows you a confirmation card with the rate, price impact, and fees.',
    steps: [
      'Type your swap command. Example: "swap 1 SOL for USDC"',
      'Review the confirmation card -- check the rate, price impact, and route.',
      'Click Confirm to execute. The swap settles on Solana in 1-2 seconds.',
    ],
    exampleChips: ['swap 1 SOL for USDC', 'swap 100 USDC for JUP', 'swap 0.5 SOL for BONK'],
    relatedChips: ['what tokens can I swap?', 'how to set slippage', 'my holdings'],
  },
  perps: {
    title: 'How to Trade Perpetual Futures',
    explanation: 'Perpetual futures let you bet on price movement with leverage. Long = you profit when price goes up. Short = you profit when price goes down. Leverage amplifies both gains and losses.',
    steps: [
      'Type your trade. Example: "long 2 SOL at 10x" or "short 0.5 BTC at 5x"',
      'Review the confirmation card -- check entry price, liquidation price, position size, and collateral required.',
      'Click Confirm. Your position opens on Drift Protocol in 1-2 seconds.',
      'Manage your position: set stop loss, take profit, or close it. Type "my positions" anytime to check.',
    ],
    exampleChips: ['long 1 SOL at 5x', 'short 0.1 BTC at 3x', 'my positions'],
    relatedChips: ['what is liquidation?', 'how to set stop loss', 'set leverage', 'what is Drift?'],
  },
  positions: {
    title: 'Your Open Positions',
    explanation: 'Shows all your current perp positions with entry price, unrealized P&L, liquidation price, and current oracle price. Data is live from Drift Protocol.',
    steps: [
      'Type "my positions" or "show positions"',
      'Review the position card showing each market, size, entry, P&L, and liquidation price.',
    ],
    exampleChips: ['my positions', 'close SOL position', 'set stop loss on SOL at $130'],
    relatedChips: ['how to close a position', 'what is unrealized P&L', 'my holdings'],
  },
  sl_tp: {
    title: 'Setting Stop Loss and Take Profit',
    explanation: 'Stop loss automatically closes your position if the price moves against you past a threshold. Take profit locks in gains when price hits your target. Both are essential risk management tools.',
    steps: [
      'Open a position first (e.g. "long 2 SOL at 10x")',
      'Set stop loss: "set stop loss on SOL at $130"',
      'Set take profit: "set take profit on SOL at $160"',
      'Both execute automatically when the oracle price hits your target.',
    ],
    exampleChips: ['set sl on SOL at $130', 'set tp on SOL at $160', 'my orders'],
    relatedChips: ['how does liquidation work', 'cancel orders', 'my positions'],
  },
  send: {
    title: 'How to Send Tokens',
    explanation: 'Send SOL or any SPL token to another wallet address. Type the command in natural language -- AFX resolves the token and builds the transaction.',
    steps: [
      'Type your send command. Example: "send 2 SOL to 7xKp...3f2w"',
      'Review the confirmation card showing amount, token, destination address, and network fee.',
      'Click Confirm to send. The transfer settles on Solana in about 1 second.',
    ],
    exampleChips: ['send 1 SOL to ...', 'send 100 USDC to ...', 'my holdings'],
    relatedChips: ['what tokens can I send?', 'how to check my balance', 'my holdings'],
  },
  safety: {
    title: 'How to Check Token Safety',
    explanation: 'Before trading an unknown token, run a safety check. AFX analyzes the token contract for red flags: mint authority, freeze authority, top holder concentration, liquidity depth, and more.',
    steps: [
      'Type: "is BONK safe?" or "check WIF safety" or "rug check MYTOKEN"',
      'AFX returns a safety report with risk score, red flags, and a plain-English summary of what the data means.',
    ],
    exampleChips: ['is BONK safe?', 'check WIF', 'rug check POPCAT'],
    relatedChips: ['what is mint authority?', 'what is freeze authority?', 'swap tokens'],
  },
  launch: {
    title: 'How to Launch a Token on Pump.fun',
    explanation: 'Deploy a new token on Pump.fun bonding curve directly from chat. Name it, describe it, and launch. The token goes live on Solana instantly.',
    steps: [
      'Type: "launch a token called MOON with 1 billion supply"',
      'Review the launch card -- token name, symbol, supply, and Pump.fun bonding curve parameters.',
      'Click Confirm to deploy. Your token is live on Solana and tradeable on Pump.fun.',
    ],
    exampleChips: ['launch a token called MOON', 'launch DEGEN with 1B supply'],
    relatedChips: ['how does Pump.fun work?', 'what is a bonding curve?', 'check my token safety'],
  },
  lending: {
    title: 'How to Lend and Earn Yield',
    explanation: 'Earn yield by supplying assets to lending protocols. AFX supports Jupiter Lend for Solana assets and Aave V3 for EVM chains (Ethereum, Polygon, Arbitrum, Base).',
    steps: [
      'For Solana: Type "lend SOL" or "earn rates" to see Jupiter Lend rates',
      'For EVM: Type "lend on aave" or "lend ETH on aave" to see Aave V3 rates',
      'Navigate to the Earn tab and toggle between Jupiter Lend and Aave V3',
      'Click Supply/Earn to deposit. Your assets earn yield automatically.',
    ],
    exampleChips: ['lend SOL', 'earn rates', 'lend on aave'],
    relatedChips: ['what is APY?', 'my positions', 'how to withdraw'],
  },
  leverage: {
    title: 'Understanding Leverage',
    explanation: 'Leverage multiplies your position size relative to your collateral. 10x leverage means $100 collateral controls a $1,000 position. Higher leverage amplifies both profits and losses, and moves your liquidation price closer to your entry.',
    steps: [
      'Choose your leverage when opening a trade: "long 1 SOL at 10x"',
      'Or set default leverage: "set leverage to 5x"',
      'Higher leverage = higher risk. Start with 2-5x if you are new.',
      'Monitor liquidation price carefully -- if the market reaches it, your position is automatically closed.',
    ],
    exampleChips: ['long 1 SOL at 5x', 'set leverage to 10x', 'my positions'],
    relatedChips: ['what is liquidation?', 'how to set stop loss', 'how to trade perps'],
  },
  liquidation: {
    title: 'What is Liquidation?',
    explanation: 'Liquidation happens when your position losses eat through your collateral. The protocol automatically closes your position to prevent further losses. Higher leverage means your liquidation price is closer to your entry.',
    steps: [
      'Check your liquidation price in the position card or type "my positions"',
      'Set a stop loss ABOVE your liquidation price to exit before forced liquidation',
      'Use lower leverage (2-5x) to keep liquidation price far from current price',
      'Add more collateral if your position is at risk',
    ],
    exampleChips: ['my positions', 'set stop loss on SOL at $130', 'long 1 SOL at 3x'],
    relatedChips: ['how to set stop loss', 'what is leverage?', 'how to trade perps'],
  },
};

const TOPIC_TRIGGERS: Record<string, string[]> = {
  swap: ['swap', 'trade tokens', 'exchange tokens', 'swap help', 'how to swap', 'how to trade tokens'],
  perps: ['perps', 'perpetual', 'leverage trading', 'how to long', 'how to short', 'trade perps', 'leveraged trading', 'what are perps'],
  positions: ['my positions', 'check positions', 'show positions', 'current positions', 'check my trades'],
  sl_tp: ['stop loss', 'take profit', 'sl tp', 'protect my position', 'how to set stop loss', 'set sl', 'set tp'],
  send: ['send tokens', 'transfer tokens', 'send to wallet', 'how to send'],
  safety: ['token safe', 'check token', 'rug check', 'safety check', 'is safe'],
  launch: ['launch token', 'create token', 'launch on pump', 'make a coin', 'deploy token'],
  lending: ['lend', 'earn yield', 'supply assets', 'lending help', 'how to lend', 'aave help', 'jupiter lend'],
  leverage: ['what is leverage', 'explain leverage', 'leverage help', 'how does leverage work'],
  liquidation: ['what is liquidation', 'liquidation help', 'how does liquidation work', 'what happens when liquidated'],
};

export function matchHelpTopic(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [topic, triggers] of Object.entries(TOPIC_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lower.includes(trigger)) return topic;
    }
  }
  return null;
}

export function getHelpContent(topic: string): HelpEntry | null {
  return HELP_CONTENT[topic] || null;
}

export function getGeneralHelp(): HelpEntry {
  return HELP_CONTENT.general;
}
