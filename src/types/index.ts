export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h';

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisResult {
  symbol: string;
  exchange: 'BINANCE' | 'COINDCX';
  timeframe: Timeframe;
  price: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketStatus?: string;
  zone: 'BUY' | 'SELL' | 'WAIT' | 'OVERBOUGHT' | 'OVERSOLD' | 'CAUTION' | 'STRONG_TREND';
  confidence: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  explanation: string;
  guidance: {
    condition: string;
    action: string;
    avoid: string;
  };
  possibleEntry?: string;
  rsi: number;
  rsi50: number;
  ema20: number;
  ema50: number;
  volumeSpike: boolean;
  bullishProb: number;
  bearishProb: number;
  rsiScore: number;
  emaScore: number;
  volumeScore: number;
  lastCandleTime: number;
  markers: SignalMarker[];
  htfTrend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  htfConfirmation?: boolean;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  pnl?: number;
  time: string;
  status: 'OPEN' | 'CLOSED';
}

export interface PaperTradingState {
  balance: number;
  trades: Trade[];
}

export interface SignalMarker {
  type: 'BUY' | 'SELL' | 'BREAKOUT' | 'BREAKDOWN';
  price: number;
  time: number;
}

export interface Alert {
  id: string;
  message: string;
  time: string;
  type: 'RSI' | 'SMART_MONEY' | 'BREAKOUT' | 'RISK';
  reason?: string;
  suggestedAction?: string;
  candleTime?: number;
  symbol: string;
}

export interface JournalEntry {
  id: string;
  symbol: string;
  note: string;
  time: string;
}

export interface ActivityLog {
  id: string;
  symbol: string;
  action: string;
  signal?: 'BUY' | 'SELL' | 'WAIT' | 'OVERBOUGHT' | 'OVERSOLD' | 'CAUTION' | 'STRONG_TREND';
  time: string;
  timestamp: number;
}

export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: 'BINANCE' | 'COINDCX';
}