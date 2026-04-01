const GAMMA = 'https://gamma-api.dflow.com';

export interface CorrelatedMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string[];
  yesPrice: number;
  noPrice: number;
  volume: number;
  volume24hr: number;
  liquidity: number;
  image: string | null;
  endDate: string | null;
  active: boolean;
  enableOrderBook: boolean;
  score: number;
  marketUrl: string;
  category?: string;
}

export const PREDICTION_CATEGORIES: Record<string, { tagId: number | null; label: string }> = {
  trending:    { tagId: null,    label: 'Trending' },
  politics:    { tagId: 2,       label: 'Politics' },
  finance:     { tagId: 120,     label: 'Finance' },
  crypto:      { tagId: 21,      label: 'Crypto' },
  sports:      { tagId: 100639,  label: 'Sports' },
  tech:        { tagId: 1401,    label: 'Tech' },
  culture:     { tagId: 596,     label: 'Culture' },
  geopolitics: { tagId: 100265,  label: 'Geopolitics' },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sports: [
    'nba','nfl','mlb','nhl','soccer','football','basketball',
    'baseball','hockey','ufc','mma','boxing','tennis','golf',
    'f1','formula','olympics','world cup','super bowl',
    'playoff','championship','finals','match','game','score',
    'player','team','coach','draft','trade','injury',
    'lakers','celtics','chiefs','eagles','yankees','dodgers',
    'warriors','49ers','cowboys','steelers','patriots',
    'premier league','champions league','la liga','serie a',
    'ncaa','march madness','world series','stanley cup',
  ],
  politics: [
    'election','president','congress','senate','vote',
    'republican','democrat','gop','trump','biden','harris',
    'governor','mayor','poll','approval','impeach','cabinet',
    'supreme court','legislation','bill','law','regulation',
    'primary','midterm','swing state','electoral',
    'parliament','prime minister','eu','nato','un',
  ],
  crypto: [
    'bitcoin','btc','ethereum','eth','solana','sol','crypto',
    'defi','nft','token','blockchain','web3','mining',
    'halving','airdrop','staking','yield','dex','cex',
    'binance','coinbase','sec','etf','spot etf',
  ],
  finance: [
    'fed','interest rate','inflation','cpi','gdp','recession',
    'stock','market','s&p','nasdaq','dow','earnings',
    'ipo','tariff','trade war','bond','yield curve',
    'unemployment','jobs report','fomc','rate cut','rate hike',
    'oil','gold','commodity','treasury',
  ],
  tech: [
    'ai','artificial intelligence','openai','chatgpt','gpt',
    'google','apple','microsoft','meta','nvidia','tesla',
    'startup','ipo','antitrust','chip','semiconductor',
    'robot','autonomous','quantum','spacex','launch',
    'iphone','android','tiktok','social media',
  ],
  culture: [
    'oscar','grammy','emmy','tony','golden globe','award',
    'movie','film','box office','rotten tomatoes','netflix',
    'album','song','concert','tour','artist','celebrity',
    'tv show','series','streaming','disney','marvel',
    'reality tv','bachelor','viral','tiktok','youtube',
    'taylor swift','beyonce','drake','kanye',
  ],
  geopolitics: [
    'war','conflict','invasion','sanctions','ceasefire',
    'peace','treaty','military','nuclear','missile',
    'china','russia','ukraine','taiwan','iran','north korea',
    'middle east','gaza','israel','nato',
  ],
};

export function classifyCategory(query: string): string {
  const q = query.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = 0;
    for (const kw of keywords) {
      if (q.includes(kw)) scores[cat] += kw.length;
    }
  }

  let best = 'trending';
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }

  return bestScore > 3 ? best : 'trending';
}

function safeParse(val: any, fallback: any[] = []): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return fallback;
  try { return JSON.parse(val); }
  catch { return fallback; }
}

function parseMarketToCorrelated(m: any, score: number = 0): CorrelatedMarket {
  const outcomes = safeParse(m.outcomes);
  const prices = safeParse(m.outcomePrices);

  return {
    id: m.id,
    question: m.question || '',
    slug: m.slug || '',
    outcomes,
    yesPrice: parseFloat(prices[0] || '0.5'),
    noPrice: parseFloat(prices[1] || '0.5'),
    volume: parseFloat(m.volume || '0'),
    volume24hr: parseFloat(m.volume24hr || '0'),
    liquidity: parseFloat(m.liquidity || '0'),
    image: m.image || null,
    endDate: m.endDate || null,
    active: !!m.active,
    enableOrderBook: !!m.enableOrderBook,
    score,
    marketUrl: `https://dflow.com/event/${m.slug || ''}`,
  };
}

async function trackA_directSearch(query: string): Promise<CorrelatedMarket[]> {
  const words = query.split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 6);
  const searchQuery = words.join(' ');
  if (!searchQuery) return [];

  const params = new URLSearchParams({
    _q: searchQuery,
    closed: 'false',
    active: 'true',
    limit: '10',
  });

  try {
    const res = await fetch(`${GAMMA}/markets?${params}`);
    if (!res.ok) return [];
    const markets = await res.json();
    return markets
      .filter((m: any) => m.enableOrderBook)
      .map((m: any) => parseMarketToCorrelated(m));
  } catch {
    return [];
  }
}

async function trackB_categoryBrowse(query: string): Promise<CorrelatedMarket[]> {
  const category = classifyCategory(query);
  const tagId = PREDICTION_CATEGORIES[category]?.tagId;

  const params = new URLSearchParams({
    closed: 'false',
    order: 'volume24hr',
    ascending: 'false',
    limit: '10',
  });

  if (tagId !== null) {
    params.set('tag_id', String(tagId));
    params.set('related_tags', 'true');
  }

  try {
    const res = await fetch(`${GAMMA}/events?${params}`);
    if (!res.ok) return [];
    const events = await res.json();

    const markets: CorrelatedMarket[] = [];
    for (const event of events) {
      if (!event.markets) continue;
      for (const m of event.markets) {
        if (m.active && !m.closed && m.enableOrderBook) {
          markets.push(parseMarketToCorrelated(m));
        }
      }
    }
    return markets;
  } catch {
    return [];
  }
}

function mergeAndRank(trackA: CorrelatedMarket[], trackB: CorrelatedMarket[], query: string): CorrelatedMarket[] {
  const seen = new Map<string, CorrelatedMarket & { searchBonus: number }>();

  for (const m of trackA) {
    seen.set(m.id, { ...m, searchBonus: 2.0 });
  }

  for (const m of trackB) {
    if (!seen.has(m.id)) {
      seen.set(m.id, { ...m, searchBonus: 1.0 });
    }
  }

  const scored = Array.from(seen.values()).map(m => {
    const volScore = Math.log10(Math.max(m.volume24hr || 1, 1)) / 7;

    const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const qMatch = qWords.filter(w =>
      m.question.toLowerCase().includes(w)
    ).length / Math.max(qWords.length, 1);

    m.score = (volScore * 0.3) + (qMatch * 0.5) + (m.searchBonus * 0.2);
    return m;
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ searchBonus, ...market }) => market);
}

export async function correlateMarkets(query: string): Promise<CorrelatedMarket[]> {
  const category = classifyCategory(query);
  const categoryLabel = PREDICTION_CATEGORIES[category]?.label || 'Trending';

  const [directMarkets, categoryMarkets] = await Promise.all([
    trackA_directSearch(query),
    trackB_categoryBrowse(query),
  ]);

  const ranked = mergeAndRank(directMarkets, categoryMarkets, query);
  return ranked.map(m => ({ ...m, category: m.category || categoryLabel }));
}
