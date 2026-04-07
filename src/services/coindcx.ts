import { KlineData, Timeframe } from '../types';

export async function fetchCoinDCXSymbols() {
  try {
    const response = await fetch('/api/coindcx/symbols');
    const data = await response.json();
    return data.map((d: any) => ({
      symbol: d.symbol,
      baseAsset: d.base_currency_short_name,
      quoteAsset: d.target_currency_short_name,
      exchange: 'COINDCX'
    }));
  } catch (error) {
    console.error('Error fetching CoinDCX symbols:', error);
    return [];
  }
}

export async function fetchCoinDCXPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch('/api/coindcx/ticker');
    const data = await response.json();
    const ticker = data.find((t: any) => t.market === symbol);
    return ticker ? parseFloat(ticker.last_price) : 0;
  } catch (error) {
    console.error('Error fetching CoinDCX price:', error);
    return 0;
  }
}

export async function fetchCoinDCXKlines(symbol: string, interval: Timeframe, limit: number = 100): Promise<KlineData[]> {
  try {
    // CoinDCX interval mapping
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h'
    };
    
    const response = await fetch(`/api/coindcx/klines?pair=${symbol}&interval=${intervalMap[interval] || '15m'}&limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`CoinDCX API error for ${symbol}:`, errorData.message || response.statusText);
      return [];
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error(`Unexpected CoinDCX response for ${symbol}:`, data);
      return [];
    }

    // CoinDCX returns candles in descending order (newest first)
    return data
      .filter((d: any) => d && typeof d === 'object' && 'open' in d)
      .map((d: any) => ({
        time: d.time,
        open: parseFloat(d.open),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
        close: parseFloat(d.close),
        volume: parseFloat(d.volume),
      })).reverse();
  } catch (error) {
    console.error(`Error fetching CoinDCX klines for ${symbol}:`, error);
    return [];
  }
}
