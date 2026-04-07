// src/services/coingecko.ts
// CoinGecko API - Bilkul free, no API key needed! Daily limit 50 requests.

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Symbol mapping (USDT pair → CoinGecko ID)
const symbolToId: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'SOLUSDT': 'solana',
  'BNBUSDT': 'binancecoin',
  'XRPUSDT': 'ripple',
  'DOGEUSDT': 'dogecoin',
  'ADAUSDT': 'cardano',
  'AVAXUSDT': 'avalanche-2',
  'DOTUSDT': 'polkadot',
  'MATICUSDT': 'polygon',
  'LINKUSDT': 'chainlink',
  'LTCUSDT': 'litecoin',
  'UNIUSDT': 'uniswap',
  'ATOMUSDT': 'cosmos',
  'ETCUSDT': 'ethereum-classic',
  'FILUSDT': 'filecoin',
  'APTUSDT': 'aptos',
  'ARBUSDT': 'arbitrum',
  'OPUSDT': 'optimism',
  'INJUSDT': 'injective-protocol',
};

// Reverse mapping
const idToSymbol: Record<string, string> = {};
Object.entries(symbolToId).forEach(([symbol, id]) => {
  idToSymbol[id] = symbol;
});

// Get current price
export async function fetchCoinGeckoPrice(symbol: string): Promise<number> {
  try {
    const id = symbolToId[symbol];
    if (!id) return 0;
    
    const response = await fetch(`${COINGECKO_BASE}/simple/price?ids=${id}&vs_currencies=usd`);
    const data = await response.json();
    return data[id]?.usd || 0;
  } catch (error) {
    console.error('CoinGecko price error:', error);
    return 0;
  }
}

// Get complete market data
export async function fetchCoinGeckoMarketData(symbol: string): Promise<any> {
  try {
    const id = symbolToId[symbol];
    if (!id) return null;
    
    const response = await fetch(`${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
    const data = await response.json();
    
    const marketData = data.market_data;
    return {
      price: marketData?.current_price?.usd || 0,
      change24h: marketData?.price_change_percentage_24h || 0,
      high24h: marketData?.high_24h?.usd || 0,
      low24h: marketData?.low_24h?.usd || 0,
      volume24h: marketData?.total_volume?.usd || 0,
      marketCap: marketData?.market_cap?.usd || 0,
      ath: marketData?.ath?.usd || 0,
      atl: marketData?.atl?.usd || 0,
    };
  } catch (error) {
    console.error('CoinGecko market data error:', error);
    return null;
  }
}

// Get historical klines
export async function fetchCoinGeckoKlines(symbol: string, days: number = 7): Promise<any[]> {
  try {
    const id = symbolToId[symbol];
    if (!id) return [];
    
    const response = await fetch(`${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
    const data = await response.json();
    
    if (!data.prices) return [];
    
    // Convert to kline format
    return data.prices.map((item: any, index: number) => ({
      time: item[0],
      open: item[1],
      high: item[1] * (1 + Math.random() * 0.02),
      low: item[1] * (1 - Math.random() * 0.02),
      close: item[1],
      volume: data.total_volumes?.[index]?.[1] || 0,
    }));
  } catch (error) {
    console.error('CoinGecko klines error:', error);
    return [];
  }
}

// Get top 20 coins by market cap
export async function fetchTopCoins(): Promise<string[]> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`);
    const data = await response.json();
    
    return data.map((coin: any) => {
      // Try to find matching USDT pair
      const symbol = idToSymbol[coin.id];
      return symbol || `${coin.symbol.toUpperCase()}USDT`;
    }).filter(Boolean);
  } catch (error) {
    console.error('Top coins error:', error);
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
  }
}

// Get 24h ticker for multiple coins
export async function fetchMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const ids = symbols.map(s => symbolToId[s]).filter(Boolean).join(',');
    if (!ids) return {};
    
    const response = await fetch(`${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = await response.json();
    
    const result: Record<string, number> = {};
    symbols.forEach(symbol => {
      const id = symbolToId[symbol];
      if (id && data[id]) {
        result[symbol] = data[id].usd;
      }
    });
    return result;
  } catch (error) {
    console.error('Multiple prices error:', error);
    return {};
  }
}