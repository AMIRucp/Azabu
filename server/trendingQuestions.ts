import { getPerplexityClient } from './perplexityClient';

export interface TrendingQuestion {
  question: string;
  tickers: string[];
  category: 'crypto' | 'rwa' | 'entertainment' | 'sports' | 'politics' | 'business';
}

let cache: { questions: TrendingQuestion[]; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

const NEWS_DOMAINS = [
  'reuters.com', 'bloomberg.com', 'cnbc.com',
  'coindesk.com', 'theblock.co', 'decrypt.co',
  'espn.com', 'theathletic.com', 'variety.com',
  'politico.com', 'apnews.com',
];

const FALLBACK_QUESTIONS: TrendingQuestion[] = [
  { question: "Is Bitcoin breaking out or about to correct?", tickers: ['BTC', 'SOL', 'ETH'], category: 'crypto' },
  { question: "Which Solana memecoins are trending right now?", tickers: ['WIF', 'BONK', 'JUP'], category: 'crypto' },
  { question: "Is gold hitting new highs on inflation fears?", tickers: ['GOLD', 'PAXG', 'SOL'], category: 'rwa' },
  { question: "Who is favored to win the NBA championship?", tickers: ['BTC', 'SOL', 'ETH'], category: 'sports' },
  { question: "What are the latest odds on the next US election?", tickers: ['BTC', 'SOL', 'USDC'], category: 'politics' },
  { question: "Which streaming platform is winning the content war?", tickers: ['SOL', 'BTC', 'ETH'], category: 'entertainment' },
  { question: "What did the Fed signal at its latest meeting?", tickers: ['SOL', 'BTC', 'USDC'], category: 'business' },
];

const VALID_CATEGORIES = ['crypto', 'rwa', 'entertainment', 'sports', 'politics', 'business'] as const;

export async function getTrendingQuestions(): Promise<{ questions: TrendingQuestion[]; isStale: boolean }> {
  if (cache && Date.now() - cache.ts < TTL) {
    return { questions: cache.questions, isStale: false };
  }

  try {
    const client = getPerplexityClient();
    const completion = await client.chat.completions.create({
      model: 'sonar',
      max_tokens: 1200,
      temperature: 0.3,
      search_recency_filter: 'day',
      search_domain_filter: NEWS_DOMAINS,
      messages: [
        {
          role: 'system',
          content: `You generate trending questions for a search engine covering 6 verticals: Crypto, RWA (real-world assets like gold/commodities), Entertainment, Sports, Politics, and Business. Return ONLY a raw JSON array, no markdown, no code fences.
Each item: { "question": string, "tickers": string[], "category": string }
question: A natural question someone would ask right now based on today's news. Under 15 words. No emojis.
tickers: Exactly 3 relevant crypto token symbols (BTC, ETH, SOL, WIF, BONK, JUP, PAXG, etc). Always use crypto tokens, not stock tickers.
category: One of "crypto", "rwa", "entertainment", "sports", "politics", "business".
Return exactly 7 questions: at least 2 crypto, and at least 1 each from 3 other verticals.
Focus on what is ACTUALLY in the news TODAY. Make questions specific to current events.`,
        },
        {
          role: 'user',
          content: 'What are the 7 most interesting stories across crypto, entertainment, sports, politics, business, and commodities/RWA right now? Generate a question for each with 3 relevant crypto tokens.',
        },
      ],
    } as any);

    const raw = (completion as any).choices?.[0]?.message?.content ?? '[]';
    const clean = raw.replace(/^```json\n?|\n?```$/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Empty response');
    }

    const questions: TrendingQuestion[] = parsed
      .filter((q: any) => q.question && Array.isArray(q.tickers) && q.tickers.length > 0)
      .slice(0, 7)
      .map((q: any) => ({
        question: String(q.question).replace(/["""]/g, '').trim(),
        tickers: q.tickers.slice(0, 3).map((t: any) => String(t).toUpperCase().trim()),
        category: VALID_CATEGORIES.includes(q.category) ? q.category : 'crypto',
      }));

    if (questions.length < 4) {
      throw new Error('Too few valid questions');
    }

    cache = { questions, ts: Date.now() };
    console.log(`Trending questions refreshed: ${questions.length} questions`);
    return { questions, isStale: false };
  } catch (err: any) {
    console.error('Trending questions fetch error:', err.message);
    if (cache) return { questions: cache.questions, isStale: true };
    return { questions: FALLBACK_QUESTIONS, isStale: true };
  }
}
