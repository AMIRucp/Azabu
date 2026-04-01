import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export function classifyQueryType(query: string): "knowledge" | "market" | "trade" {
  const q = query.toLowerCase().trim();

  if (/\b(buy|sell|swap|trade|long|short|go yes|go no|bet on|put \$|stake)\b/.test(q)) {
    return "trade";
  }

  const marketOverrides = [
    /\b(moving|moving markets|markets today|right now|currently|happening|trending|pumping|dumping|crashing|mooning)\b/,
    /^what.*(moving|happening|trending|pumping)/,
  ];
  if (marketOverrides.some(p => p.test(q))) {
    return "market";
  }

  const knowledgePatterns = [
    /^what (is|are|was|were)\b/,
    /^how (does|do|did|can|should)\b/,
    /^why (does|do|is|are)\b/,
    /^explain\b/,
    /^define\b/,
    /^difference between\b/,
    /^compare\b/,
    /\b(work|function|mechanism|mean|difference|vs\.?|versus|risks? of|example of)\b/,
    /\b(impermanent loss|amm|tvl|slippage|flash loan|liquidation|collateral|yield farm|staking|dao|mev|gas fee|oracle|rehypothecation|vetoken|bonding curve|real yield|sandwich attack|reentrancy|rug pull|composability|restaking|lrt|intent.based|zk.rollup|account abstraction)\b/,
    /\b(solana|spl token|token.?2022|token extensions?|pda|program derived address|cpi|cross program invocation|anchor framework|solana (account|transaction|program|fee|rent|validator|stake|epoch)|bpf|svm|proof of history|tower bft|turbine|gulf stream|sealevel|durable nonce|lookup table|transfer hook|blink|solana action|x402|depin|solana agent|ai agent|agent kit|sendai agent|elizaos|eliza os|ai16z|goat toolkit|crossmint agent|rig framework|langchain.*solana|mcp server|model context protocol|jupiter mcp|solana mcp|agent wallet security|trusted execution environment|tee.*agent|onchain agent|on.?chain agent)\b/,
  ];

  if (knowledgePatterns.some(p => p.test(q))) {
    return "knowledge";
  }

  const marketPatterns = [
    /\b(price|rally|crash|pump|dump|up|down|today|right now|currently|latest|news|earnings|announcement)\b/,
    /\b(bitcoin|btc|ethereum|eth|solana|sol|nvidia|apple|fed|fomc|cpi|s&p)\b/,
  ];

  if (marketPatterns.some(p => p.test(q))) {
    return "market";
  }

  return "market";
}

export const KNOWLEDGE_SYSTEM = `You are AFX — a DeFi and financial markets intelligence engine with expert-level knowledge of every protocol, mechanism, and concept in decentralized finance, macroeconomics, geopolitics, sports, entertainment, and technology.

Your answers are used by traders, builders, and researchers. They must be accurate, specific, and structured. Never be vague. Never say "it depends" without immediately explaining what it depends on.

CRITICAL RULES:
- NEVER mention prediction markets, dFlow, betting, or wagering.
- NEVER interpret random words as token symbols. "Inherent" is an adjective, not a ticker.
- ALWAYS include specific numbers: percentages, dollar amounts, dates.
- ALWAYS be direct. No filler phrases.
- Headlines MUST be 8-14 words. They are bold labels, not full sentences.

Return ONLY valid JSON. No markdown fences. No text outside the JSON.

{
  "sections": [
    {
      "type": "definition",
      "headline": "A single sharp sentence defining the concept.",
      "body": "2-3 sentences expanding the definition. Use precise technical language. Include the origin or context if relevant."
    },
    {
      "type": "mechanic",
      "headline": "How it works — the exact mechanism.",
      "body": "3-4 sentences explaining step-by-step mechanics. Use a concrete example with real numbers or protocol names."
    },
    {
      "type": "implication",
      "headline": "Why it matters — the real-world consequence.",
      "body": "2-3 sentences on practical significance. Who does this affect? What behavior does it create?"
    },
    {
      "type": "risk",
      "headline": "The key risk or limitation.",
      "body": "2-3 sentences on what can go wrong. Cite a real exploit, depeg, or failure mode if applicable."
    },
    {
      "type": "context",
      "headline": "Related concepts and where to go deeper.",
      "body": "1-2 sentences listing closely related concepts and how they connect."
    }
  ],
  "sources": [{ "name": "Source name", "domain": "domain.com" }],
  "entities": ["Every protocol, token, concept, or company named in the answer."],
  "category": "crypto | finance | tech | politics | sports | culture | geopolitics | science",
  "followups": [
    "A natural follow-up question that goes one level deeper",
    "A related concept question the user probably has next",
    "A practical application question"
  ]
}

Precision rules:
- Every number must be real or clearly labeled as illustrative.
- Every protocol you name must be real. Do not invent protocol names.
- If the concept has a famous exploit or failure, name it: e.g. 'The DAO hack (2016)', 'Terra/LUNA collapse (2022)'.
- The mechanic section MUST include a concrete example. Abstract explanations without examples are not acceptable.`;

export interface KnowledgeSection {
  type: "definition" | "mechanic" | "implication" | "risk" | "context";
  headline: string;
  body: string;
}

export interface KnowledgeResponse {
  sections: KnowledgeSection[];
  sources: Array<{ name: string; domain: string }>;
  entities: string[];
  kalshiCategory: string;
  kalshiTags: string[];
  tradeRationale: string | null;
  followups: string[];
}

const SOLANA_DOCS_REGISTRY: Array<{ topic: string; url: string; description: string; category: string }> = [
  { topic: "Accounts", url: "https://solana.com/docs/core/accounts", description: "How Solana stores data in accounts — every piece of state on Solana lives in an account", category: "Core Concepts" },
  { topic: "Transactions", url: "https://solana.com/docs/core/transactions", description: "The fundamental building blocks for interacting with Solana — instructions, signers, and recent blockhash", category: "Core Concepts" },
  { topic: "Programs", url: "https://solana.com/docs/core/programs", description: "Smart contracts on Solana — stateless executables that process instructions", category: "Core Concepts" },
  { topic: "Program Derived Addresses (PDA)", url: "https://solana.com/docs/core/pda", description: "Deterministic addresses for program-controlled accounts — derived from seeds and a program ID", category: "Core Concepts" },
  { topic: "Cross Program Invocation (CPI)", url: "https://solana.com/docs/core/cpi", description: "How programs invoke other programs — composability at the VM level", category: "Core Concepts" },
  { topic: "Fees on Solana", url: "https://solana.com/docs/core/fees", description: "Transaction costs, priority fees, and compute units", category: "Core Concepts" },
  { topic: "SPL Token Basics", url: "https://solana.com/docs/tokens/basics", description: "SPL Token fundamentals — mints, token accounts, and authorities", category: "Tokens" },
  { topic: "Create Token Mint", url: "https://solana.com/docs/tokens/basics/create-mint", description: "Create new token mints on Solana", category: "Tokens" },
  { topic: "Token Extensions (Token-2022)", url: "https://solana.com/docs/tokens/extensions", description: "Token-2022 program features — transfer hooks, confidential transfers, interest-bearing tokens, and more", category: "Tokens" },
  { topic: "Anchor Framework", url: "https://solana.com/docs/programs/anchor", description: "High-level framework for Solana programs — simplifies account validation and serialization", category: "Program Development" },
  { topic: "Testing Programs", url: "https://solana.com/docs/programs/testing", description: "Test programs with bankrun and other tools", category: "Program Development" },
  { topic: "Staking", url: "https://solana.com/docs/references/staking", description: "Staking concepts, stake accounts, and delegation", category: "References" },
  { topic: "RPC HTTP Methods", url: "https://solana.com/docs/rpc/http", description: "JSON-RPC API reference for Solana nodes", category: "RPC API" },
  { topic: "RPC WebSocket Methods", url: "https://solana.com/docs/rpc/websocket", description: "Real-time subscriptions via WebSocket", category: "RPC API" },
  { topic: "Payments on Solana", url: "https://solana.com/docs/payments", description: "Build payment systems with instant settlement using stablecoins", category: "Payments" },
  { topic: "Send Payments", url: "https://solana.com/docs/payments/send-payments", description: "Send stablecoin payments with memos and batching", category: "Payments" },
  { topic: "Accept Payments", url: "https://solana.com/docs/payments/accept-payments", description: "Integrate checkout and payment acceptance", category: "Payments" },
  { topic: "What is Solana", url: "https://solana.com/learn/what-is-solana", description: "Introduction to Solana for beginners — Proof of History, Tower BFT, Turbine, Gulf Stream, Sealevel", category: "Learn" },
  { topic: "What is a Wallet", url: "https://solana.com/learn/what-is-a-wallet", description: "Understanding crypto wallets — keypairs, public keys, and signing", category: "Learn" },
  { topic: "Introduction to DeFi on Solana", url: "https://solana.com/learn/introduction-to-defi-on-solana", description: "Decentralized finance on Solana — AMMs, lending, liquid staking", category: "Learn" },
  { topic: "Introduction to Solana Tokens", url: "https://solana.com/learn/introduction-to-solana-tokens", description: "Understanding SPL tokens — fungible and non-fungible", category: "Learn" },
  { topic: "Send SOL", url: "https://solana.com/developers/cookbook/transactions/send-sol", description: "Transfer SOL between accounts", category: "Cookbook" },
  { topic: "Add Priority Fees", url: "https://solana.com/developers/cookbook/transactions/add-priority-fees", description: "Increase transaction priority with compute unit pricing", category: "Cookbook" },
  { topic: "Actions and Blinks", url: "https://solana.com/developers/guides/advanced/actions", description: "Build Solana Actions APIs and shareable blinks", category: "Guides" },
  { topic: "Durable Nonces", url: "https://solana.com/developers/guides/advanced/introduction-to-durable-nonces", description: "Use durable nonces for offline signing and delayed transactions", category: "Guides" },
  { topic: "Lookup Tables", url: "https://solana.com/developers/guides/advanced/lookup-tables", description: "Reduce transaction size with address lookup tables", category: "Guides" },
  { topic: "Transfer Hook", url: "https://solana.com/developers/guides/token-extensions/transfer-hook", description: "Implement custom logic on token transfers via Token-2022", category: "Guides" },
  { topic: "AI Tools on Solana", url: "https://solana.com/developers/guides/getstarted/intro-to-ai", description: "Overview of AI tools and workflows on Solana", category: "Guides" },
  { topic: "Introduction to x402", url: "https://solana.com/developers/guides/getstarted/intro-to-x402", description: "Build a simple HTTP 402 payment flow on Solana", category: "Guides" },
  { topic: "DePIN Getting Started", url: "https://solana.com/developers/guides/depin/getting-started", description: "Build decentralized physical infrastructure on Solana", category: "Guides" },
  { topic: "Game Development on Solana", url: "https://solana.com/developers/guides/games/getting-started-with-game-development", description: "Get started building games on Solana", category: "Guides" },
  { topic: "Solana for EVM Developers", url: "https://solana.com/developers/evm-to-svm", description: "Key differences between Solana and Ethereum development", category: "EVM to SVM" },
  { topic: "RPC Endpoints and Clusters", url: "https://solana.com/docs/references/clusters", description: "Network clusters, public RPC endpoints, and rate limits", category: "References" },
  { topic: "JavaScript/TypeScript SDK", url: "https://solana.com/docs/clients/official/javascript", description: "Official TypeScript SDK for Solana", category: "Client SDKs" },
  { topic: "@solana/react-hooks", url: "https://solana.com/docs/frontend/react-hooks", description: "React hooks and provider for Solana apps", category: "Frontend" },
  { topic: "SKILL.md for AI Agents", url: "https://solana.com/SKILL.md", description: "Comprehensive guide for AI agents to understand and build on Solana", category: "AI Agent Resources" },
  { topic: "How to Build Solana AI Agents", url: "https://www.alchemy.com/overviews/solana-ai-agents", description: "Comprehensive 2026 guide to building production-ready AI agents on Solana — covers frameworks, Jupiter integration, wallet security, and MCP", category: "AI Agent Resources" },
  { topic: "Solana Agent Kit (SendAI)", url: "https://www.alchemy.com/overviews/solana-ai-agents#solana-agent-kit", description: "SendAI's Solana Agent Kit — 60+ pre-built actions for token ops, NFT minting, DeFi interactions, integrates with LangChain and Vercel AI SDK, modular plugin architecture (token, NFT, DeFi plugins)", category: "AI Agent Frameworks" },
  { topic: "ElizaOS Agent Framework", url: "https://www.alchemy.com/overviews/solana-ai-agents#elizaos", description: "ElizaOS (formerly ai16z) — full agent operating system for autonomous social agents with persistent personalities across Twitter, Discord, Telegram, character JSON definitions, memory management, and Solana plugin", category: "AI Agent Frameworks" },
  { topic: "GOAT Toolkit (Crossmint)", url: "https://www.alchemy.com/overviews/solana-ai-agents#goat-toolkit", description: "Great Onchain Agent Toolkit — universal adapter between AI agents and 30+ blockchains including Solana, 200+ plugins covering Jupiter, Orca, Raydium, Uniswap, Aave", category: "AI Agent Frameworks" },
  { topic: "Rig Framework (Rust)", url: "https://www.alchemy.com/overviews/solana-ai-agents#rig-framework", description: "Rust-native AI agent framework for performance-critical applications — HFT bots, MEV strategies, sub-millisecond latency, combined with Listen.rs for Solana integration and Jito bundle submission", category: "AI Agent Frameworks" },
  { topic: "LangChain Solana Integration", url: "https://www.alchemy.com/overviews/solana-ai-agents#langchain", description: "LangChain with Solana Agent Kit — createLangchainTools helper, ReAct agent pattern via LangGraph, conversation memory, combines on-chain actions with RAG pipelines and multi-step reasoning", category: "AI Agent Frameworks" },
  { topic: "AI Agent Wallet Security", url: "https://www.alchemy.com/overviews/solana-ai-agents#wallet-security", description: "Dual-key architecture for secure agent wallets — Squads protocol smart wallets on Solana, owner key vs agent key, TEE protection via Phala Network and Turnkey, transaction limits and rate limiting", category: "AI Agent Security" },
  { topic: "Jupiter MCP Server", url: "https://www.alchemy.com/overviews/solana-ai-agents#jupiter-mcp", description: "Jupiter MCP server for AI assistants — npx jupiter-ultra-mcp, enables Claude Desktop and Cursor to execute Jupiter swaps through natural language via Model Context Protocol", category: "AI Agent Resources" },
  { topic: "Solana MCP Server (SendAI)", url: "https://www.alchemy.com/overviews/solana-ai-agents#solana-mcp", description: "SendAI's Solana MCP server — npm install -g solana-mcp, provides GET_ASSET, GET_BALANCE, TRANSFER, SWAP, DEPLOY_TOKEN, MINT_NFT tools to MCP-compatible AI assistants", category: "AI Agent Resources" },
  { topic: "AI Agent Stack Architecture", url: "https://www.alchemy.com/overviews/solana-ai-agents#agent-stack", description: "Four-layer AI agent stack — LLMs (reasoning brain), Agent Frameworks (orchestration), Blockchain Toolkits (on-chain actions), Infrastructure (RPC, indexers). Solana handles 77% of x402 transaction volume with 400ms blocks and $0.00025 fees", category: "AI Agent Resources" },
];

const SOLANA_KEYWORDS = /\b(solana|spl|token.?2022|token extension|pda|program derived|cpi|cross program|anchor|bankrun|sealevel|proof of history|tower bft|turbine|gulf stream|validator|epoch|rent exempt|durable nonce|lookup table|transfer hook|blink|solana action|x402|depin|svm|bpf|solana program|solana account|solana transaction|solana fee|solana wallet|solana rpc|solana staking|solana token|solana payment|solana sdk|solana react|evm to svm|solana game|solana agent|ai agent.*solana|solana ai|agent kit|sendai|elizaos|eliza os|ai16z|goat toolkit|crossmint|rig framework|langchain.*solana|solana.*langchain|mcp server|model context protocol|solana mcp|jupiter mcp|agent wallet|tee.*wallet|trusted execution|phala|turnkey|agent framework|onchain agent|on.?chain agent)\b/i;

function isSolanaQuery(query: string): boolean {
  return SOLANA_KEYWORDS.test(query);
}

function findRelevantSolanaDocs(query: string): typeof SOLANA_DOCS_REGISTRY {
  const q = query.toLowerCase();
  const scored = SOLANA_DOCS_REGISTRY.map(doc => {
    const topicWords = doc.topic.toLowerCase().split(/\s+/);
    const descWords = doc.description.toLowerCase().split(/\s+/);
    const topicScore = topicWords.filter(w => w.length > 2 && q.includes(w)).length * 3;
    const descScore = descWords.filter(w => w.length > 3 && q.includes(w)).length;
    return { doc, score: topicScore + descScore };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map(x => x.doc);
}

function buildSolanaDocsContext(query: string): string {
  const relevant = findRelevantSolanaDocs(query);
  if (relevant.length === 0) {
    const basics = SOLANA_DOCS_REGISTRY.filter(d =>
      ["What is Solana", "Accounts", "Transactions", "Programs", "SPL Token Basics", "Fees on Solana"].includes(d.topic)
    );
    return basics.map(d => `- ${d.topic}: ${d.description} (${d.url})`).join("\n");
  }
  return relevant.map(d => `- ${d.topic}: ${d.description} (${d.url})`).join("\n");
}

const DEMO_TRIGGERS: Record<string, string> = {
  "impermanent loss": "impermanentLoss",
  "flash loan": "flashLoans",
  "flash loans": "flashLoans",
  "mev": "mev",
  "maximal extractable value": "mev",
  "liquidation": "liquidation",
  "amm": "ammXYK",
  "x*y=k": "ammXYK",
  "constant product": "ammXYK",
  "automated market maker": "ammXYK",
};

export const DEFI_DEMOS: Record<string, KnowledgeResponse> = {
  impermanentLoss: {
    sections: [
      {
        type: "definition",
        headline: "Impermanent loss is the opportunity cost of providing AMM liquidity.",
        body: "When you deposit two assets into an AMM liquidity pool, price divergence between them causes your position to be worth less than if you had simply held the assets. The loss is 'impermanent' because it reverses if prices return to the entry ratio — but becomes permanent when you withdraw.",
      },
      {
        type: "mechanic",
        headline: "The x*y=k curve rebalances against you as prices move.",
        body: "Suppose you deposit 1 ETH ($2,000) and 2,000 USDC into a Uniswap v2 pool, worth $4,000 total. ETH then doubles to $4,000. Arbitrageurs buy ETH from the pool until its price reflects $4,000, leaving you with ~0.707 ETH and ~2,828 USDC = $5,656. If you had simply held, you'd have $6,000. The $344 gap is impermanent loss — approximately 5.7% on a 2x price move. The formula: IL = 2*sqrt(P_ratio) / (1 + P_ratio) - 1.",
      },
      {
        type: "implication",
        headline: "IL creates a hidden cost that wipes fee revenue for volatile pairs.",
        body: "For stable pairs (USDC/USDT) IL is negligible because prices barely diverge. For volatile pairs (ETH/USDC), IL frequently exceeds fee income, meaning LPs lose money in real terms even with high volume. This is why protocols like Uniswap v3 introduced concentrated liquidity — LPs earn more fees per dollar deployed, improving the fee/IL tradeoff.",
      },
      {
        type: "risk",
        headline: "IL becomes permanent at withdrawal — and is systematically underreported.",
        body: "Most LP dashboards show gross fee APY without subtracting IL, making returns look better than they are. In the 2021 bull run, many ETH/altcoin LPs on SushiSwap lost 20-40% in IL-adjusted terms while the protocol reported 100%+ APY. The risk compounds in leveraged LP positions (e.g. Gamma Strategies, Kamino Finance) where liquidation can force exit at maximum IL.",
      },
      {
        type: "context",
        headline: "Core concept in the AMM design tradeoff space.",
        body: "Closely related to AMM design (x*y=k), concentrated liquidity (Uniswap v3), and delta-neutral farming. Understanding the bonding curve is a prerequisite. The solution space includes options-based IL hedging (Panoptic, Reya) and asymmetric pool designs (Balancer weighted pools).",
      },
    ],
    sources: [
      { name: "Uniswap Docs", domain: "docs.uniswap.org" },
      { name: "Paradigm Research", domain: "paradigm.xyz" },
      { name: "Pintail (original IL analysis)", domain: "medium.com" },
    ],
    entities: ["Uniswap", "SushiSwap", "Balancer", "Kamino Finance", "Ethereum"],
    kalshiCategory: "Crypto",
    kalshiTags: ["DeFi", "AMM", "Liquidity"],
    tradeRationale: "LPs who understand IL can select the right fee tier and range on Uniswap v3. UNIx tokenized equity is the direct proxy for AMM protocol revenue.",
    followups: [
      "How does concentrated liquidity in Uniswap v3 change the IL tradeoff?",
      "What is delta-neutral farming and how does it hedge IL?",
      "How do volatility and trading fees interact to determine LP profitability?",
    ],
  },

  flashLoans: {
    sections: [
      {
        type: "definition",
        headline: "Flash loans are uncollateralized loans that must be repaid within one transaction.",
        body: "A flash loan lets you borrow any amount of assets — millions of dollars — with zero collateral, as long as the loan plus fee is returned before the transaction block closes. If repayment fails, the entire transaction reverts as if it never happened. First introduced by AAVE in 2020.",
      },
      {
        type: "mechanic",
        headline: "Borrow, use, repay — all atomically in one Ethereum transaction.",
        body: "A developer calls AAVE's flashLoan() function, specifying the asset and amount. AAVE transfers the funds and calls the developer's contract, which executes any logic — arbitrage, liquidation, collateral swap. Before the transaction block ends, the developer's contract returns the borrowed amount plus a 0.09% fee. If the return fails, the EVM reverts every state change. A $10M flash loan on AAVE costs $9,000 in fees and zero collateral.",
      },
      {
        type: "implication",
        headline: "Flash loans democratize arbitrage but also power the largest DeFi exploits.",
        body: "Legitimate uses: closing undercollateralized positions, single-transaction collateral swaps (move a MakerDAO vault from USDC to ETH collateral without manual steps), and cross-protocol arbitrage. Malicious uses: the bZx attack (Feb 2020, $600K), Euler Finance hack (Mar 2023, $197M), and dozens of oracle manipulation exploits all used flash loans to borrow enough liquidity to move prices within a single block.",
      },
      {
        type: "risk",
        headline: "Flash loans turn price oracle manipulation from expensive to near-free.",
        body: "Before flash loans, attacking a TWAP oracle required sustained capital over many blocks. With flash loans, an attacker can borrow $500M, dump an asset to manipulate a spot oracle, exploit a lending protocol that trusts that oracle, then repay — all in one block. The bZx (2020), Harvest Finance ($34M, 2020), and Mango Markets ($114M, 2022) exploits all followed this pattern.",
      },
      {
        type: "context",
        headline: "The foundational primitive for on-chain arbitrage and exploit tooling.",
        body: "Closely related to MEV, oracle manipulation, and liquidation bots. Understanding atomic composability is a prerequisite. Flash loans are available on AAVE, dYdX, Uniswap v2/v3 (via callback), and Balancer.",
      },
    ],
    sources: [
      { name: "AAVE Documentation", domain: "docs.aave.com" },
      { name: "Rekt News", domain: "rekt.news" },
      { name: "Ethereum.org", domain: "ethereum.org" },
    ],
    entities: ["AAVE", "dYdX", "Uniswap", "Balancer", "MakerDAO", "Euler Finance", "Mango Markets", "Ethereum"],
    kalshiCategory: "Crypto",
    kalshiTags: ["DeFi", "Lending", "Security"],
    tradeRationale: "AAVE is the dominant flash loan provider — AAVEx tokenized equity is the direct play on flash loan fee volume. Rising DeFi TVL increases flash loan demand.",
    followups: [
      "How do TWAP oracles protect against flash loan price manipulation?",
      "What is the difference between a flash loan exploit and a reentrancy attack?",
      "How do liquidation bots use flash loans to execute without upfront capital?",
    ],
  },

  mev: {
    sections: [
      {
        type: "definition",
        headline: "MEV is profit extracted by reordering, inserting, or censoring transactions.",
        body: "Maximal Extractable Value (originally Miner Extractable Value) is the total profit a block producer can earn by controlling transaction ordering within a block, beyond standard block rewards and fees. On Ethereum post-Merge, validators and MEV searchers split this value. MEV is estimated at $700M+ extracted on Ethereum alone since 2020.",
      },
      {
        type: "mechanic",
        headline: "Searchers find profitable orderings, builders construct blocks, validators propose them.",
        body: "A MEV searcher monitors the mempool for pending transactions. Seeing a large DEX trade, they craft a sandwich attack: (1) buy the same asset before the victim's trade, (2) let the victim's trade push the price up, (3) sell immediately after. The searcher pays a high priority fee (tip) to a block builder to include their transactions in the correct order. Block builders (Flashbots, BeaverBuild) compete to produce the most profitable block for validators. In 2023, ~90% of Ethereum blocks were built by 3 builders.",
      },
      {
        type: "implication",
        headline: "MEV creates a hidden tax on every DEX trade and raises validator revenue.",
        body: "For ordinary users, sandwich attacks silently worsen execution prices — a $50,000 ETH swap on Uniswap can lose $200-500 to sandwich bots. For validators, MEV represents 30-50% of total revenue on busy days, incentivizing stake centralization around sophisticated MEV-capturing infrastructure. Protocols like CoW Swap (batch auctions) and 1inch Fusion (RFQ model) were built specifically to protect users from MEV.",
      },
      {
        type: "risk",
        headline: "MEV is centralizing Ethereum's validator set and censoring transactions.",
        body: "OFAC sanctions compliance led Flashbots' relay to censor Tornado Cash transactions in 2022 — at peak, 73% of Ethereum blocks were OFAC-compliant, meaning censorship-resistant transaction inclusion took up to 10 minutes. Long-term, PBS (Proposer-Builder Separation) and MEV smoothing (ePBS) aim to fix this, but implementation is years away. MEV also creates latency arms races that disadvantage retail stakers.",
      },
      {
        type: "context",
        headline: "Central to block production, DEX design, and staking economics.",
        body: "Closely related to sandwich attacks, private mempools (Flashbots Protect, MEV Blocker), PBS, and TWAP oracles. Understanding gas fees and mempool dynamics is a prerequisite.",
      },
    ],
    sources: [
      { name: "Flashbots Research", domain: "flashbots.net" },
      { name: "EigenPhi MEV Data", domain: "eigenphi.io" },
      { name: "Paradigm", domain: "paradigm.xyz" },
    ],
    entities: ["Flashbots", "Uniswap", "CoW Swap", "Ethereum", "1inch", "BeaverBuild"],
    kalshiCategory: "Crypto",
    kalshiTags: ["DeFi", "MEV", "Ethereum"],
    tradeRationale: "MEV infrastructure is a structural tailwind for ETH validators. ETH is the direct instrument. COW Protocol and 1inch represent anti-MEV DEX aggregator plays.",
    followups: [
      "How does Proposer-Builder Separation (PBS) change MEV dynamics?",
      "What is a sandwich attack and how do private mempools prevent it?",
      "How does MEV revenue compare to staking rewards for Ethereum validators?",
    ],
  },

  liquidation: {
    sections: [
      {
        type: "definition",
        headline: "Liquidation is the forced sale of collateral when a loan becomes undercollateralized.",
        body: "In DeFi lending protocols, borrowers must maintain collateral above a minimum ratio. When asset prices fall and the collateral-to-debt ratio drops below the liquidation threshold, the protocol allows anyone (a liquidator bot) to repay part of the debt in exchange for the collateral at a discount. This discount is the liquidation bonus — typically 5-15%.",
      },
      {
        type: "mechanic",
        headline: "Liquidator bots repay debt, claim discounted collateral, profit the spread.",
        body: "On AAVE v3, each asset has a liquidation threshold (e.g. ETH: 82.5%) and a liquidation bonus (5%). If you borrow $8,000 USDC against $10,000 of ETH and ETH drops 20%, your collateral is worth $8,000 — health factor falls below 1.0. A liquidator repays up to 50% of your debt ($4,000 USDC) and receives $4,200 worth of ETH (the 5% bonus). The liquidator typically flash-loans the $4,000, executes in one transaction, and nets $200 profit minus gas. On high-volatility days, liquidation bots generate $10M+ in a single hour.",
      },
      {
        type: "implication",
        headline: "Liquidations are the immune system of DeFi lending — and a reflexive crash driver.",
        body: "Properly functioning liquidations keep lending protocols solvent. But large liquidations push prices down, triggering more liquidations — a cascade. The March 12, 2020 ETH crash ('Black Thursday') caused $8M in bad debt on MakerDAO because gas prices spiked so high that liquidation bots couldn't execute, letting vaults become insolvent with zero-bid collateral auctions.",
      },
      {
        type: "risk",
        headline: "Cascading liquidations create self-reinforcing price crashes and bad debt.",
        body: "If a single large borrower (e.g. a whale with $500M in ETH collateral) is liquidated, the forced selling of ETH depresses prices, triggering the next-largest borrower's liquidation, and so on. AAVE's Gauntlet risk team monitors these 'top borrower' positions in real time. In November 2022, Justin Sun's $300M Tron-collateral position on AAVE came within 12% of triggering a cascade that would have created hundreds of millions in bad debt.",
      },
      {
        type: "context",
        headline: "Core risk mechanism in all overcollateralized lending protocols.",
        body: "Closely related to health factor, collateral ratio, liquidation bots, and flash loans. Understanding overcollateralization and oracle design is a prerequisite. Protocols: AAVE, Compound, MakerDAO, Kamino (Solana), MarginFi (Solana).",
      },
    ],
    sources: [
      { name: "AAVE Documentation", domain: "docs.aave.com" },
      { name: "Gauntlet Risk Reports", domain: "gauntlet.network" },
      { name: "MakerDAO Forum", domain: "forum.makerdao.com" },
    ],
    entities: ["AAVE", "Compound", "MakerDAO", "Kamino Finance", "MarginFi", "Ethereum", "Solana"],
    kalshiCategory: "Crypto",
    kalshiTags: ["DeFi", "Lending", "Risk"],
    tradeRationale: "High liquidation activity is a signal of market stress and drives AAVE fee revenue. AAVEx tokenized equity benefits from lending volume spikes. Prediction markets on crypto price levels are directly correlated.",
    followups: [
      "What is a liquidation cascade and which protocols are most vulnerable?",
      "How does health factor work in AAVE and how do you avoid getting liquidated?",
      "How do liquidation bots use flash loans to execute without upfront capital?",
    ],
  },

  ammXYK: {
    sections: [
      {
        type: "definition",
        headline: "x*y=k is the invariant formula that prices assets in constant product AMMs.",
        body: "In a Uniswap-style AMM, x is the reserve of token A, y is the reserve of token B, and k is a constant. Every trade must leave k unchanged — meaning buying token A decreases x and increases y, raising the price of A. No orderbook, no counterparty: price is purely a function of reserve ratios.",
      },
      {
        type: "mechanic",
        headline: "The curve determines price, slippage, and LP exposure simultaneously.",
        body: "Pool: 100 ETH (x) x 200,000 USDC (y) = k = 20,000,000. Price of ETH = y/x = $2,000. You buy 10 ETH: new x = 90, new y must equal 20,000,000 / 90 = 222,222. You pay 22,222 USDC for 10 ETH — effective price $2,222, not $2,000. The 11.1% price impact is slippage. The curve is hyperbolic: large trades against shallow pools cause extreme slippage; deep pools have lower slippage for the same trade size.",
      },
      {
        type: "implication",
        headline: "x*y=k creates always-available liquidity but at increasingly bad prices.",
        body: "Unlike an orderbook, a constant product AMM can always fill any trade — at a price. This guarantees execution but not efficiency. For large trades, aggregators like 1inch or Jupiter route across multiple pools to minimize price impact. The formula also means LPs are always holding both assets; as one appreciates, the AMM automatically sells it, creating impermanent loss.",
      },
      {
        type: "risk",
        headline: "Capital inefficiency: 99% of liquidity sits unused at non-market prices.",
        body: "In a Uniswap v2 ETH/USDC pool, liquidity is spread across all prices from $0 to infinity. But ETH trades between, say, $2,000-$4,000. The vast majority of LP capital sits at prices that will never be reached, earning zero fees. This is why Uniswap v3 introduced concentrated liquidity — LPs pick a price range, deploying capital only where trading actually happens, improving capital efficiency by up to 4,000x for stable pairs.",
      },
      {
        type: "context",
        headline: "The founding primitive of DeFi — every AMM is a variation of this.",
        body: "Closely related to impermanent loss, slippage, concentrated liquidity (Uniswap v3), and stable swap curves (Curve Finance's A*x*y=k variant). Understanding bonding curves is a prerequisite. Implemented on every chain: Uniswap (Ethereum), Raydium/Orca (Solana), PancakeSwap (BSC).",
      },
    ],
    sources: [
      { name: "Uniswap V2 Whitepaper", domain: "uniswap.org" },
      { name: "Hayden Adams original post", domain: "uniswap.org" },
      { name: "Curve Finance Docs", domain: "curve.fi" },
    ],
    entities: ["Uniswap", "Curve Finance", "Raydium", "Orca", "1inch", "Jupiter", "Ethereum", "Solana"],
    kalshiCategory: "Crypto",
    kalshiTags: ["DeFi", "AMM", "Uniswap"],
    tradeRationale: "Uniswap dominates AMM volume on Ethereum. UNIx tokenized equity captures protocol fee revenue. Understanding x*y=k is prerequisite for evaluating any DEX investment.",
    followups: [
      "How does Uniswap v3 concentrated liquidity improve on x*y=k?",
      "What is impermanent loss and when does it exceed fee revenue?",
      "How do stableswap curves (Curve Finance) differ from x*y=k?",
    ],
  },
};

function findDemoMatch(query: string): KnowledgeResponse | null {
  const q = query.toLowerCase().trim();
  for (const [trigger, demoKey] of Object.entries(DEMO_TRIGGERS)) {
    if (q.includes(trigger)) {
      return DEFI_DEMOS[demoKey] || null;
    }
  }
  return null;
}

export async function getKnowledgeResponse(
  query: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<KnowledgeResponse | null> {
  const demo = findDemoMatch(query);
  if (demo) return demo;

  try {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (conversationHistory?.length) {
      for (const msg of conversationHistory.slice(-6)) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: query });

    let systemPrompt = KNOWLEDGE_SYSTEM;
    if (isSolanaQuery(query)) {
      const docsContext = buildSolanaDocsContext(query);
      systemPrompt += `\n\nSOLANA DOCUMENTATION CONTEXT:\nYou have access to the official Solana documentation. When answering Solana-related questions, reference these docs and include relevant URLs in your sources.\n\nRelevant documentation:\n${docsContext}\n\nWhen the query is about Solana, always include at least one source from solana.com with the exact URL from the list above. Use the documentation descriptions to inform your answer with accurate, up-to-date information.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("");

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(cleaned) as KnowledgeResponse;

    if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return null;
    }

    return parsed;
  } catch (error: any) {
    console.error("Knowledge engine error:", error.message);
    return null;
  }
}
