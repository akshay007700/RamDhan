import { KlineData, AnalysisResult, Timeframe } from '../types';

const BASE_URL = '/api/binance';

export async function fetchBinanceSymbols() {
  try {
    const response = await fetch(`${BASE_URL}/exchangeInfo`);
    const data = await response.json();
    return data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s: any) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
        exchange: 'BINANCE'
      }));
  } catch (error) {
    console.error('Error fetching Binance symbols:', error);
    return [];
  }
}

export async function fetchPrice(symbol: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/ticker?symbol=${symbol}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching price:', error);
    return { price: 0 };
  }
}

export async function fetchKlines(symbol: string, interval: Timeframe, limit: number = 100): Promise<KlineData[]> {
  try {
    const response = await fetch(`${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.msg !== 'Invalid symbol.') {
        console.error(`Binance API error for ${symbol}:`, errorData.msg || response.statusText);
      }
      return [];
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error(`Unexpected Binance response for ${symbol}:`, data);
      return [];
    }

    return data
      .filter((d: any) => Array.isArray(d) && d.length >= 6)
      .map((d: any) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}

export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  let ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + (ema[i - 1] || 0) * (1 - k));
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  if (data.length <= period) return new Array(data.length).fill(50);
  let gains = [];
  let losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  let rsi = new Array(period).fill(50);
  
  for (let i = period; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

export async function analyzeMarket(
  symbol: string, 
  exchange: 'BINANCE' | 'COINDCX',
  timeframe: Timeframe, 
  klines: KlineData[],
  options: { sensitivity?: number, useHTF?: boolean } = {}
): Promise<AnalysisResult> {
  if (!klines || klines.length < 50) {
    throw new Error(`Insufficient data for ${symbol}: expected at least 50 candles, got ${klines?.length || 0}`);
  }
  const { sensitivity = 60, useHTF = true } = options;
  const closes = klines.map(k => k.close);
  const volumes = klines.map(k => k.volume);
  const highs = klines.map(k => k.high);
  const lows = klines.map(k => k.low);
  
  // Fetch 24h stats
  let change24h = 0;
  let high24h = highs[highs.length - 1];
  let low24h = lows[lows.length - 1];
  let volume24h = volumes[volumes.length - 1];
  let marketStatus = 'OPEN';

  if (exchange === 'BINANCE') {
    try {
      const ticker = await fetchPrice(symbol);
      change24h = parseFloat(ticker.priceChangePercent) || 0;
      high24h = parseFloat(ticker.highPrice) || highs[highs.length - 1];
      low24h = parseFloat(ticker.lowPrice) || lows[lows.length - 1];
      volume24h = parseFloat(ticker.volume) || volumes[volumes.length - 1];
    } catch (err) {
      console.warn(`Failed to fetch 24h stats for ${symbol}`);
    }
  }

  const rsi14Values = calculateRSI(closes, 14);
  const rsi50Values = calculateRSI(closes, 50);
  const ema20Values = calculateEMA(closes, 20);
  const ema50Values = calculateEMA(closes, 50);
  
  const lastRsi14 = rsi14Values[rsi14Values.length - 1];
  const lastRsi50 = rsi50Values[rsi50Values.length - 1];
  const lastEma20 = ema20Values[ema20Values.length - 1];
  const lastEma50 = ema50Values[ema50Values.length - 1];
  const lastPrice = closes[closes.length - 1];
  const prevPrice = closes[closes.length - 2];
  
  // HTF Analysis
  const htfMap: Record<string, Timeframe> = {
    '1m': '5m',
    '5m': '15m',
    '15m': '1h',
    '1h': '4h'
  };
  
  let htfTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | undefined;
  let htfConfirmation = false;
  
  if (useHTF) {
    const htfInterval = htfMap[timeframe];
    if (htfInterval) {
      const htfKlines = await fetchKlines(symbol, htfInterval, 50);
      if (htfKlines.length > 0) {
        const htfCloses = htfKlines.map(k => k.close);
        const htfEma50 = calculateEMA(htfCloses, 50).pop() || 0;
        const htfEma20 = calculateEMA(htfCloses, 20).pop() || 0;
        const htfLastPrice = htfCloses[htfCloses.length - 1];
        
        if (htfLastPrice > htfEma50 && htfEma20 > htfEma50) htfTrend = 'BULLISH';
        else if (htfLastPrice < htfEma50 && htfEma20 < htfEma50) htfTrend = 'BEARISH';
        else htfTrend = 'SIDEWAYS';
      }
    }
  }

  // Volume Spike Detection
  const avgVolume = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const lastVolume = volumes[volumes.length - 1];
  const volumeSpike = lastVolume > avgVolume * 2;
  
  // Trend Detection
  let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
  if (lastPrice > lastEma50 && lastEma20 > lastEma50) trend = 'BULLISH';
  else if (lastPrice < lastEma50 && lastEma20 < lastEma50) trend = 'BEARISH';
  
  if (useHTF && htfTrend === trend) htfConfirmation = true;

  // Scores (0-100)
  let rsiScore = 50;
  if (lastRsi14 > 60) rsiScore = 80;
  else if (lastRsi14 < 40) rsiScore = 20;
  else rsiScore = 50;

  let emaScore = 50;
  if (lastPrice > lastEma20 && lastEma20 > lastEma50) emaScore = 90;
  else if (lastPrice < lastEma20 && lastEma20 < lastEma50) emaScore = 10;
  
  let volumeScore = volumeSpike ? 90 : 40;

  // Probability Calculation
  let bullishProb = 50;
  if (trend === 'BULLISH') bullishProb += 10;
  if (useHTF && htfTrend === 'BULLISH') bullishProb += 10;
  if (lastRsi14 > 50) bullishProb += 5;
  if (lastEma20 > lastEma50) bullishProb += 5;
  if (volumeSpike && lastPrice > prevPrice) bullishProb += 10;
  
  let bearishProb = 100 - bullishProb;
  
  // Confidence
  let confidence = Math.abs(bullishProb - 50) * 2;
  
  // Zone Logic
  let zone: 'BUY' | 'SELL' | 'WAIT' | 'OVERBOUGHT' | 'OVERSOLD' | 'CAUTION' | 'STRONG_TREND' = 'WAIT';
  
  if (lastRsi14 > 80) zone = 'OVERBOUGHT';
  else if (lastRsi14 < 20) zone = 'OVERSOLD';
  else if (lastRsi14 > 70 || lastRsi14 < 30) zone = 'CAUTION';
  else if (confidence > 85) zone = 'STRONG_TREND';
  else if (bullishProb > sensitivity) zone = 'BUY';
  else if (bearishProb > sensitivity) zone = 'SELL';

  // Smart Money Detection
  const bodySize = Math.abs(lastPrice - klines[klines.length - 1].open);
  const candleSize = highs[highs.length - 1] - lows[lows.length - 1];
  const isStrongCandle = bodySize > candleSize * 0.7;
  const smartMoneyAlert = volumeSpike && isStrongCandle;

  // Explanation & Guidance
  let explanation = `EMA 20 (${lastEma20.toFixed(0)}) EMA 50 (${lastEma50.toFixed(0)}) ke ${lastEma20 > lastEma50 ? 'upar' : 'neeche'} hai → ${lastEma20 > lastEma50 ? 'bullish' : 'bearish'} trend. RSI ${lastRsi14.toFixed(1)} hai → ${lastRsi14 > 70 ? 'overbought' : lastRsi14 < 30 ? 'oversold' : 'neutral'} zone. Volume ${volumeSpike ? 'strong' : 'normal'} hai → ${volumeSpike ? 'continuation possible' : 'no spike'}.`;

  let guidance = {
    condition: "",
    action: "",
    avoid: ""
  };
  let possibleEntry = "";

  if (zone === 'BUY') {
    guidance = {
      condition: `Market mein strong buying pressure hai aur trend bullish hai.`,
      action: `Long position ke liye setups dekhein.`,
      avoid: `Resistance ke paas buy na karein (FOMO avoid karein).`
    };
    possibleEntry = `Pullback near EMA 20 (${lastEma20.toFixed(0)})`;
  } else if (zone === 'SELL') {
    guidance = {
      condition: `Selling pressure badh raha hai aur trend bearish hai.`,
      action: `Short entry ya resistance rejection dekhein.`,
      avoid: `Support ke paas sell na karein.`
    };
    possibleEntry = `Rejection near EMA 50 (${lastEma50.toFixed(0)})`;
  } else if (zone === 'OVERBOUGHT') {
    guidance = {
      condition: `RSI extreme levels par hai, market overextended hai.`,
      action: `Reversal ya correction ka wait karein.`,
      avoid: `Yaha fresh buy entries bilkul na lein.`
    };
    possibleEntry = "Wait for RSI to cool down below 70";
  } else if (zone === 'OVERSOLD') {
    guidance = {
      condition: `Market oversold hai, bounce back ki umeed hai.`,
      action: `Bullish divergence ya reversal candle dekhein.`,
      avoid: `Panic mein yaha sell na karein.`
    };
    possibleEntry = "Wait for bullish engulfing at support";
  } else if (zone === 'CAUTION') {
    guidance = {
      condition: `RSI levels warning de rahe hain, momentum slow ho sakta hai.`,
      action: `Tight stop loss use karein ya partial profit book karein.`,
      avoid: `Bina confirmation ke badi position na banayein.`
    };
    possibleEntry = "Next candle confirmation required";
  } else if (zone === 'STRONG_TREND') {
    guidance = {
      condition: `Market mein bahut strong momentum hai.`,
      action: `Trend ke saath chalein (Trend is your friend).`,
      avoid: `Trend ke against trade (counter-trend) na karein.`
    };
    possibleEntry = "Breakout of recent high/low";
  } else {
    guidance = {
      condition: `Market sideways move kar raha hai, clear direction nahi hai.`,
      action: `Range breakout ya breakdown ka wait karein.`,
      avoid: `Range ke beech mein overtrade na karein.`
    };
    possibleEntry = "Wait for clear trend direction";
  }

  // Markers
  const markers: any[] = [];
  if (smartMoneyAlert) {
    markers.push({
      type: lastPrice > prevPrice ? 'BUY' : 'SELL',
      price: lastPrice,
      time: klines[klines.length - 1].time
    });
  }

  return {
    symbol,
    exchange,
    timeframe,
    price: lastPrice,
    change24h,
    high24h,
    low24h,
    volume24h,
    marketStatus,
    zone,
    confidence: Math.round(confidence),
    trend,
    explanation,
    guidance,
    possibleEntry,
    rsi: lastRsi14,
    rsi50: lastRsi50,
    ema20: lastEma20,
    ema50: lastEma50,
    volumeSpike,
    bullishProb: Math.round(bullishProb),
    bearishProb: Math.round(bearishProb),
    rsiScore: Math.round(rsiScore),
    emaScore: Math.round(emaScore),
    volumeScore: Math.round(volumeScore),
    lastCandleTime: klines[klines.length - 1].time,
    markers,
    htfTrend,
    htfConfirmation
  };
}
