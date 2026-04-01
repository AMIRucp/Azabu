import Perplexity from '@perplexity-ai/perplexity_ai';

let _client: Perplexity | null = null;

export function getPerplexityClient(): Perplexity {
  if (!_client) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');
    _client = new Perplexity({
      apiKey,
      timeout: 30000,
    });
  }
  return _client;
}
