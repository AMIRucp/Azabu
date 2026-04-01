export interface StoryClassification {
  type: string;
  direction: string;
}

export function isDeepResearchQuery(query: string): boolean {
  const q = query.toLowerCase();
  const story = classifyStory(q);

  const deepKeywords = [
    "deep dive","analysis","breakdown","compare","implications",
    "what happens if","impact on","risk assess","explain in detail",
    "background on","how does","why did","what caused",
  ];

  return deepKeywords.some(kw => q.includes(kw));
}

export function classifyStory(query: string): StoryClassification {
  const q = query.toLowerCase();

  if (/(bitcoin|btc|halving|satoshi|lightning|bitcoin etf|btc price|\bbtc\b)/.test(q))
    return { type: "crypto.bitcoin", direction: "up" };
  if (/(ethereum|eth|\beth\b|vitalik|defi|smart contract|layer 2|staking|base chain)/.test(q))
    return { type: "crypto.ethereum", direction: "up" };
  if (/(solana|\bsol\b|solana nft|solana defi|phantom wallet)/.test(q))
    return { type: "crypto.solana", direction: "up" };
  if (/(crypto|web3|nft|blockchain|altcoin|token|dex|memecoin|pump\.fun|meme coin|shib|doge|pepe|bonk|wif|jup|jupiter|raydium|orca)/.test(q))
    return { type: "crypto.broad", direction: "up" };

  if (/(gold|xau|paxg|xaut|precious metal|spot gold)/.test(q))
    return { type: "rwa.gold", direction: "up" };
  if (/(real estate|property|reit|tokenized real estate|housing)/.test(q))
    return { type: "rwa.real_estate", direction: "up" };
  if (/(oil|crude|energy|carbon|commodity|silver|copper)/.test(q))
    return { type: "rwa.commodities", direction: "up" };
  if (/(treasury|t-bill|bond|tbill|ousg|usdy|yield|rwa|tokenized)/.test(q))
    return { type: "rwa.treasury", direction: "up" };

  if (/(oscar|academy award|grammy|emmy|golden globe|award show|award season)/.test(q))
    return { type: "entertainment.awards", direction: "up" };
  if (/(box office|movie|film|marvel|disney|sequel|blockbuster|opening weekend|streaming|netflix|hbo|ticket sales)/.test(q))
    return { type: "entertainment.film", direction: "up" };
  if (/(celebrity|taylor swift|beyonce|drake|kanye|rihanna|kardashian|pop star|musician|rapper|album|tour|concert)/.test(q))
    return { type: "entertainment.celebrity", direction: "up" };
  if (/(esports|gaming|twitch|streamer|tournament|game release|video game)/.test(q))
    return { type: "entertainment.gaming", direction: "up" };
  if (/(entertainment|music|tv show|television|reality tv|viral|trending)/.test(q))
    return { type: "entertainment.general", direction: "up" };

  if (/(nfl|super bowl|football|touchdown|quarterback|nfl draft|nfl playoffs)/.test(q))
    return { type: "sports.nfl", direction: "up" };
  if (/(nba|basketball|lakers|celtics|lebron|curry|nba playoffs|nba finals|draft pick)/.test(q))
    return { type: "sports.nba", direction: "up" };
  if (/(world cup|soccer|premier league|champions league|la liga|mls|fifa|penalty|euro 20)/.test(q))
    return { type: "sports.soccer", direction: "up" };
  if (/(ufc|mma|boxing|fight|knockout|ppv|conor|jon jones|tyson)/.test(q))
    return { type: "sports.combat", direction: "up" };
  if (/(mlb|baseball|world series|home run|pitcher|dodgers|yankees)/.test(q))
    return { type: "sports.mlb", direction: "up" };
  if (/(golf|pga|masters|tiger woods|rory|liv golf)/.test(q))
    return { type: "sports.golf", direction: "up" };
  if (/(f1|formula 1|formula one|grand prix|verstappen|hamilton|ferrari|red bull racing)/.test(q))
    return { type: "sports.f1", direction: "up" };
  if (/(nhl|hockey|stanley cup|puck)/.test(q))
    return { type: "sports.nhl", direction: "up" };
  if (/(sport|athlete|team|player|coach|season|championship|playoff|tournament|betting|odds|spread)/.test(q))
    return { type: "sports.general", direction: "up" };

  if (/(president|white house|biden|trump|kamala|harris|oval office|executive order|administration)/.test(q))
    return { type: "politics.us_president", direction: "up" };
  if (/(election|vote|ballot|senate|congress|house rep|midterm|primary|polling|swing state|electoral)/.test(q))
    return { type: "politics.election", direction: "up" };
  if (/(supreme court|scotus|justice|ruling|decision|constitutional|roe|amendment)/.test(q))
    return { type: "politics.scotus", direction: "up" };
  if (/(war|ukraine|russia|israel|gaza|iran|nato|military|sanctions|geopolit|foreign policy|china|taiwan)/.test(q))
    return { type: "politics.geopolitical", direction: "up" };
  if (/(tariff|trade war|policy|regulation|government|congress|bill|law|legislation)/.test(q))
    return { type: "politics.policy", direction: "up" };
  if (/(politics|politician|party|democrat|republican|liberal|conservative|vote|poll)/.test(q))
    return { type: "politics.general", direction: "up" };

  if (/(earnings|quarterly|revenue|profit|eps|guidance|fiscal|annual report)/.test(q))
    return { type: "business.earnings", direction: "up" };
  if (/(nvidia|nvda|apple|aapl|msft|microsoft|google|alphabet|amazon|amzn|meta|tsla|tesla)/.test(q))
    return { type: "business.company", direction: "up" };
  if (/(fed |federal reserve|interest rate|rate cut|rate hike|fomc|powell|monetary policy|basis points)/.test(q))
    return { type: "business.macro", direction: "up" };
  if (/(inflation|cpi|ppi|gdp|unemployment|jobs report|nonfarm|payroll|consumer price)/.test(q))
    return { type: "business.indicators", direction: "up" };
  if (/(ipo|initial public offering|spac|listing|going public)/.test(q))
    return { type: "business.ipo", direction: "up" };
  if (/(company|corporate|ceo|acquisition|merger|layoff|restructur|market cap|valuation)/.test(q))
    return { type: "business.general", direction: "up" };

  return { type: "general", direction: "up" };
}

export function buildContextInjection(story: StoryClassification): string {
  const vertical = story.type.split(".")[0];

  if (vertical === "crypto") return "";

  return `
STORY CLASSIFICATION (pre-computed)
Story type:  ${story.type}
Vertical:    ${vertical.toUpperCase()}

SCOPE: Crypto, RWA, Entertainment, Sports, Politics, Business.
Match every entity and tradeRationale to the pre-classified vertical above.
`;
}
