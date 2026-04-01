import { getPerplexityClient } from './perplexityClient';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  text: string;
  citations: string[];
  model: string;
}

interface SearchSection {
  type: 'summary' | 'detail' | 'risk' | 'outlook';
  headline: string;
  body: string;
}

interface StructuredSearchResponse {
  sections: SearchSection[];
  sources: Array<{ name: string; domain: string }>;
  entities: string[];
  tradeRationale: string;
  questionType: string;
  followups: string[];
  citations: string[];
  model: string;
}

import { AFX_SEARCH_SYSTEM_PROMPT } from './afxPrompt';

const AFX_SYSTEM_PROMPT = AFX_SEARCH_SYSTEM_PROMPT;

const STRUCTURED_SEARCH_SYSTEM = AFX_SEARCH_SYSTEM_PROMPT;

const FINANCIAL_DOMAINS = [
  'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com',
  'ft.com', 'marketwatch.com', 'barrons.com', 'seekingalpha.com',
  'coindesk.com', 'theblock.co', 'decrypt.co',
];

const SEARCH_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    sections: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          type: { type: 'string' as const, enum: ['summary', 'detail', 'analysis', 'risk', 'outlook'] },
          headline: { type: 'string' as const },
          body: { type: 'string' as const },
        },
        required: ['type', 'headline', 'body'],
      },
    },
    sources: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          domain: { type: 'string' as const },
        },
        required: ['name', 'domain'],
      },
    },
    entities: {
      type: 'array' as const,
      items: { type: 'string' as const },
    },
    category: { type: 'string' as const, enum: ['politics', 'finance', 'crypto', 'sports', 'tech', 'culture', 'geopolitics', 'science', 'general'] },
    followups: {
      type: 'array' as const,
      items: { type: 'string' as const },
    },
  },
  required: ['sections', 'sources', 'entities', 'category', 'followups'],
};

async function collectStream(stream: AsyncIterable<any>): Promise<{ text: string; citations: string[]; model: string }> {
  let text = '';
  let citations: string[] = [];
  let model = 'sonar-pro';

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      text += delta.content;
    }
    if (chunk.citations && chunk.citations.length > 0) {
      citations = chunk.citations;
    }
    if (chunk.model) {
      model = chunk.model;
    }
  }

  return { text, citations, model };
}

export async function askPerplexity(
  userMessage: string,
  conversationHistory: PerplexityMessage[] = [],
  useProSearch = false,
): Promise<PerplexityResponse> {
  const client = getPerplexityClient();
  const model = 'sonar-pro';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: AFX_SYSTEM_PROMPT },
    ...conversationHistory.slice(-6),
    { role: 'user', content: userMessage },
  ];

  if (useProSearch) {
    const requestParams: any = {
      model,
      messages,
      max_tokens: 1200,
      temperature: 0.2,
      search_recency_filter: 'month',
      search_domain_filter: FINANCIAL_DOMAINS,
      stream: true,
      web_search_options: {
        search_type: 'auto',
      },
    };

    const stream = await client.chat.completions.create(requestParams);
    const result = await collectStream(stream as unknown as AsyncIterable<any>);

    if (!result.text) throw new Error('Empty Pro Search response');

    return {
      text: result.text,
      citations: result.citations,
      model: result.model,
    };
  }

  const requestParams: any = {
    model,
    messages,
    max_tokens: 1200,
    temperature: 0.2,
    search_recency_filter: 'month',
    search_domain_filter: FINANCIAL_DOMAINS,
  };

  const completion = await client.chat.completions.create(requestParams);

  const choice = (completion as any).choices?.[0];
  if (!choice) throw new Error('No response from Perplexity');

  return {
    text: choice.message.content,
    citations: (completion as any).citations ?? [],
    model: (completion as any).model ?? model,
  };
}

export async function searchWithStructuredOutput(
  userMessage: string,
  conversationHistory: PerplexityMessage[] = [],
  _useProSearch = false,
): Promise<StructuredSearchResponse> {
  const client = getPerplexityClient();
  const model = 'sonar-pro';

  const searchPrompt = userMessage;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: STRUCTURED_SEARCH_SYSTEM },
    ...conversationHistory.slice(-6),
    { role: 'user', content: searchPrompt },
  ];

  const requestParams: any = {
    model,
    messages,
    max_tokens: 1800,
    temperature: 0.2,
    search_recency_filter: 'month',
    search_domain_filter: FINANCIAL_DOMAINS,
    response_format: {
      type: 'json_schema',
      json_schema: {
        schema: SEARCH_JSON_SCHEMA,
      },
    },
  };

  const completion = await client.chat.completions.create(requestParams);

  const choice = (completion as any).choices?.[0];
  if (!choice) throw new Error('No response from Perplexity structured search');

  const rawText = choice.message.content;
  const citations = (completion as any).citations ?? [];
  const modelUsed = (completion as any).model ?? model;

  try {
    const parsed = JSON.parse(rawText);
    const categoryToQuestionType: Record<string, string> = {
      politics: 'politics', finance: 'business', crypto: 'crypto',
      sports: 'sports', tech: 'business', culture: 'entertainment',
      geopolitics: 'politics', science: 'general',
    };
    return {
      sections: parsed.sections || [],
      sources: parsed.sources || [],
      entities: parsed.entities || [],
      tradeRationale: '',
      questionType: parsed.questionType || categoryToQuestionType[parsed.category] || parsed.category || 'general',
      followups: parsed.followups || [],
      citations,
      model: modelUsed,
    };
  } catch {
    return {
      sections: [{ type: 'summary', headline: 'Search Result', body: rawText }],
      sources: [],
      entities: [],
      tradeRationale: '',
      questionType: 'general',
      followups: [],
      citations,
      model: modelUsed,
    };
  }
}

const DEEP_RESEARCH_SYSTEM = `You are AFX — a deep research engine with expert-level knowledge across macroeconomics, financial markets, cryptocurrency, DeFi, geopolitics, politics, sports analytics, entertainment, technology, and climate science.

You answer with the precision of a Goldman Sachs analyst, the breadth of an Economist journalist, the sports knowledge of a FiveThirtyEight statistician, and the DeFi depth of a Paradigm researcher.

DEEP RESEARCH MODE: Produce a THOROUGH, DATA-RICH prose answer. 4-6 paragraphs. Dense with data. No filler sentences.
- Pull real numbers: actual prices, dates, statistics, scores, vote counts, box office figures.
- For crypto: on-chain data, TVL, volume, token metrics, protocol mechanics.
- For sports: stats, records, odds, standings, injury reports.
- For entertainment: box office, ratings, streaming numbers, awards results.
- For politics: poll numbers, vote margins, policy specifics, regulatory details.
- For business: earnings figures, revenue, guidance, macro indicators, Fed decisions, GDP/CPI data.
- NEVER give a generic overview. Give the specific analytical answer the question demands.
- Write in prose. Be specific. Cite your sources inline.
- Do not give financial advice or recommendations. Surface data and context only.
- NEVER mention prediction markets, dFlow, betting, or wagering.`;

export async function deepResearch(
  userMessage: string,
  contextInjection: string = '',
): Promise<{ text: string; citations: string[] }> {
  const client = getPerplexityClient();

  const enrichedQuery = contextInjection
    ? `${contextInjection}\n\nUSER QUERY: ${userMessage}`
    : userMessage;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: DEEP_RESEARCH_SYSTEM },
    { role: 'user', content: enrichedQuery },
  ];

  const requestParams: any = {
    model: 'sonar-pro',
    messages,
    max_tokens: 2000,
    temperature: 0.2,
    search_recency_filter: 'month',
    search_domain_filter: FINANCIAL_DOMAINS,
    stream: true,
    web_search_options: {
      search_type: 'auto',
    },
  };

  const stream = await client.chat.completions.create(requestParams);
  const result = await collectStream(stream as unknown as AsyncIterable<any>);

  if (!result.text) throw new Error('Empty deep research response');

  return {
    text: result.text,
    citations: result.citations,
  };
}

export async function getMarketBrief(marketTitle: string): Promise<string | null> {
  try {
    const client = getPerplexityClient();

    const completion = await client.chat.completions.create({
      model: 'sonar',
      max_tokens: 120,
      temperature: 0.1,
      search_recency_filter: 'week',
      messages: [
        { role: 'system', content: 'Give a 2-sentence factual brief to help a trader decide. Be neutral, cite one data point. No emojis.' },
        { role: 'user', content: `Prediction market: "${marketTitle}". What is the latest relevant news?` },
      ],
    } as any);

    return (completion as any).choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
