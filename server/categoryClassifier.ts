interface CategoryDef {
  primary: string[];
  secondary: string[];
  kalshiCategory: string;
  seriesTickers: string[];
  tags: string[];
}

const CATEGORY_SIGNALS: Record<string, CategoryDef> = {
  Politics: {
    primary: [
      "election", "senate", "congress", "president", "democrat", "republican",
      "midterm", "ballot", "vote", "legislation", "supreme court", "white house",
      "filibuster", "impeach", "cabinet", "governor", "mayor", "primary",
      "polling", "approval rating", "executive order",
    ],
    secondary: [
      "trump", "biden", "harris", "pelosi", "schumer", "mcconnell",
      "nato", "ukraine", "iran", "tariff", "sanctions", "diplomacy",
      "geopolitical", "war", "treaty", "foreign policy", "state department",
      "doge", "department of government efficiency",
    ],
    kalshiCategory: "Politics",
    seriesTickers: ["KXPRESUSA", "KXSENATE", "KXHOUSE", "KXGOV", "KXINTL"],
    tags: ["US Politics", "Elections", "Congress", "Foreign Policy", "Law"],
  },

  Economics: {
    primary: [
      "federal reserve", "fed", "interest rate", "rate cut", "rate hike",
      "inflation", "cpi", "pce", "gdp", "unemployment", "jobs report",
      "recession", "treasury", "yield curve", "fomc", "jerome powell",
      "nonfarm payroll", "consumer price", "producer price",
    ],
    secondary: [
      "economy", "economic", "fiscal", "monetary policy", "deficit", "debt",
      "stimulus", "quantitative easing", "qe", "taper", "basis points",
      "labor market", "wage growth", "housing market", "mortgage rate",
      "trade deficit", "current account", "imf", "world bank",
    ],
    kalshiCategory: "Economics",
    seriesTickers: ["KXFED", "KXCPI", "KXGDP", "KXUNEMPLOY", "KXHOUSING"],
    tags: ["Federal Reserve", "Inflation", "GDP", "Jobs", "Recession"],
  },

  Crypto: {
    primary: [
      "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "crypto",
      "cryptocurrency", "defi", "nft", "token", "blockchain", "web3",
      "halving", "altcoin", "stablecoin", "usdc", "usdt", "wallet",
      "on-chain", "memecoin", "pump.fun", "coinbase", "binance",
    ],
    secondary: [
      "digital asset", "satoshi", "lightning network", "layer 2", "l2",
      "dencun", "pectra", "eip", "sec crypto", "gensler", "spot etf",
      "blackrock bitcoin", "microstrategy", "saylor", "mining", "hashrate",
      "exchange", "dex", "amm", "liquidity pool", "yield farming",
    ],
    kalshiCategory: "Crypto",
    seriesTickers: ["KXBTC", "KXETH", "KXSOL", "KXCRYPTO"],
    tags: ["Bitcoin", "Ethereum", "Solana", "DeFi", "Crypto Regulation"],
  },

  Entertainment: {
    primary: [
      "oscar", "academy award", "grammy", "emmy", "golden globe", "bafta",
      "box office", "rotten tomatoes", "film", "movie", "album", "streaming",
      "netflix", "disney", "marvel", "mcu", "chart",
      "concert", "tour", "celebrity", "award show",
    ],
    secondary: [
      "hollywood", "director", "actor", "actress", "best picture",
      "billboard", "spotify", "apple music", "prime video", "hbo",
      "hulu", "paramount", "universal", "warner", "a24",
      "taylor swift", "beyonce", "drake", "kendrick", "bad bunny",
      "avengers", "star wars", "batman", "spider-man", "sequel",
      "blockbuster", "opening weekend", "domestic gross",
    ],
    kalshiCategory: "Entertainment",
    seriesTickers: ["KXOSCARS", "KXGRAMMYS", "KXBOXOFFICE", "KXFILM"],
    tags: ["Oscars", "Grammys", "Box Office", "Streaming", "Music", "Film"],
  },

  Sports: {
    primary: [
      "nfl", "nba", "mlb", "nhl", "mls", "ufc", "championship", "super bowl",
      "playoffs", "world series", "stanley cup", "finals", "draft",
      "trade deadline", "free agency", "mvp", "coach", "roster",
      "score", "game", "match", "tournament", "league",
    ],
    secondary: [
      "quarterback", "pitcher", "forward", "goalkeeper", "fighter",
      "patrick mahomes", "lebron", "shohei ohtani", "lionel messi",
      "transfer", "injury report", "suspension", "contract extension",
      "fifa world cup", "olympics", "formula 1", "f1", "tennis",
      "wimbledon", "us open", "masters", "pga", "tiger woods",
    ],
    kalshiCategory: "Sports",
    seriesTickers: ["KXNFL", "KXNBA", "KXMLB", "KXNHL", "KXSOCCER", "KXUFC"],
    tags: ["NFL", "NBA", "MLB", "NHL", "Soccer", "UFC", "Olympics"],
  },

  Technology: {
    primary: [
      "openai", "anthropic", "nvidia", "apple", "microsoft",
      "meta", "amazon", "spacex", "tesla", "ai model", "gpt", "claude",
      "gemini", "llm", "ipo", "semiconductor", "chip", "data center",
      "product launch", "earnings", "quarterly results",
      "tech stocks", "tech companies", "tech sector", "big tech",
    ],
    secondary: [
      "artificial intelligence", "machine learning", "neural network",
      "jensen huang", "sam altman", "elon musk", "mark zuckerberg",
      "sundar pichai", "satya nadella", "tim cook", "andy jassy",
      "blackwell", "h100", "tpu", "cuda", "robotics", "autonomous",
      "self-driving", "fsd", "starship", "starlink", "x.ai",
      "grok", "sora", "dall-e", "midjourney", "stable diffusion",
      "amd", "broadcom", "qualcomm", "intel", "micron", "arm",
      "palantir", "snowflake", "crowdstrike", "salesforce", "oracle",
      "solid buy", "best stocks",
    ],
    kalshiCategory: "Technology",
    seriesTickers: ["KXAI", "KXTECH", "KXSPACEX", "KXIPTECH"],
    tags: ["AI", "Big Tech", "Semiconductors", "Space", "IPO"],
  },

  Finance: {
    primary: [
      "s&p 500", "nasdaq", "dow jones", "vix", "stock market", "earnings",
      "merger", "acquisition", "m&a", "short squeeze", "hedge fund",
      "options", "futures", "commodity", "gold", "oil", "silver",
      "bond yield", "10-year", "2-year", "credit rating", "moody",
    ],
    secondary: [
      "wall street", "bull market", "bear market", "correction", "rally",
      "volatility", "portfolio", "dividend", "buyback", "share price",
      "market cap", "pe ratio", "eps", "revenue", "profit",
      "jpmorgan", "goldman sachs", "blackrock", "citadel", "softbank",
      "warren buffett", "berkshire", "cathie wood", "ark invest",
    ],
    kalshiCategory: "Economics",
    seriesTickers: ["KXSP500", "KXNASDAQ", "KXGOLD", "KXOIL"],
    tags: ["Stock Market", "S&P 500", "Gold", "Oil", "IPO", "Earnings"],
  },

  Science: {
    primary: [
      "climate change", "global warming", "carbon", "emissions", "nasa",
      "space", "asteroid", "comet", "hurricane", "earthquake", "wildfire",
      "pandemic", "virus", "vaccine", "fda", "drug approval", "clinical trial",
    ],
    secondary: [
      "epa", "paris agreement", "net zero", "renewable energy", "solar",
      "wind power", "electric grid", "heat wave", "flood", "drought",
      "el nino", "la nina", "noaa", "ipcc", "un climate",
      "cancer", "alzheimer", "obesity drug", "wegovy", "ozempic",
    ],
    kalshiCategory: "Science",
    seriesTickers: ["KXCLIMATE", "KXSCIENCE", "KXHEALTH"],
    tags: ["Climate", "Science", "Health", "Space", "Environment"],
  },
};

export interface Classification {
  primary: string | null;
  secondary: string | null;
  allCategories: string[];
  kalshiCategory: string | null;
  seriesTickers: string[];
  tags: string[];
  confidence: number;
}

export function classifyArticle(rawQuery: string, claudeEntities: string[] = []): Classification {
  const allText = [
    rawQuery.toLowerCase(),
    ...claudeEntities.map(e => e.toLowerCase()),
  ].join(" ");

  const scores: Record<string, number> = {};

  for (const [catName, catDef] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;

    for (const kw of catDef.primary) {
      if (allText.includes(kw.toLowerCase())) {
        score += 3;
      }
    }

    for (const kw of catDef.secondary) {
      if (allText.includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    if (score > 0) {
      scores[catName] = score;
    }
  }

  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  if (ranked.length === 0) {
    return {
      primary: null,
      secondary: null,
      allCategories: [],
      kalshiCategory: null,
      seriesTickers: [],
      tags: [],
      confidence: 0,
    };
  }

  const [primaryName, primaryScore] = ranked[0];
  const [secondaryName] = ranked[1] || [];
  const primaryDef = CATEGORY_SIGNALS[primaryName];
  const secondaryDef = secondaryName ? CATEGORY_SIGNALS[secondaryName] : null;

  const maxPossible = primaryDef.primary.length * 3 + primaryDef.secondary.length;
  const confidence = Math.min(1, primaryScore / Math.max(maxPossible * 0.15, 1));

  return {
    primary: primaryName,
    secondary: secondaryName || null,
    allCategories: ranked.map(([name]) => name),
    kalshiCategory: primaryDef.kalshiCategory,
    seriesTickers: primaryDef.seriesTickers,
    tags: [
      ...primaryDef.tags,
      ...(secondaryDef?.tags || []),
    ].slice(0, 6),
    confidence: parseFloat(confidence.toFixed(2)),
  };
}

