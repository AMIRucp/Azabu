import axios from 'axios';

const CMC_BASE = process.env.COINMARKETCAP_BASE_URL || 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.COINMARKETCAP_API_KEY;

const headers = {
  'X-CMC_PRO_API_KEY': API_KEY,
  'Accept': 'application/json',
};

export async function getTokenPrice(symbol: string) {
  try {
    const response = await axios.get(`${CMC_BASE}/v1/cryptocurrency/quotes/latest`, {
      headers,
      params: { symbol: symbol.toUpperCase() },
      timeout: 8000,
    });
    return response.data.data[symbol.toUpperCase()].quote.USD.price;
  } catch (error) {
    console.error('Error fetching price from CMC:', error);
    return null;
  }
}
