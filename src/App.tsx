import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Zap, Bell, Volume2, Clock, Trophy, 
  Sun, Moon, LayoutDashboard, Activity, 
  TrendingUp, TrendingDown, Menu, X, 
  Settings, ShieldCheck, Info, Globe, 
  Calculator, BookOpen, Target, Eye, 
  Wand2, Pencil, Trash2, CheckCircle, 
  AlertCircle, Search, Filter, RefreshCw,
  Plus, ChevronDown, BarChart3, MessageSquare,
  LineChart, MousePointer2, Save, FolderOpen,
  BellOff, ChevronRight, ExternalLink, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchKlines, analyzeMarket, fetchBinanceSymbols, fetchPrice } from './services/binance';
import { fetchCoinDCXSymbols, fetchCoinDCXKlines, fetchCoinDCXPrice } from './services/coindcx';
import { AnalysisResult, Timeframe, Alert, JournalEntry, Trade, PaperTradingState, ActivityLog, SymbolInfo, KlineData } from './types';
import { cn } from './lib/utils';
import Logo from './components/Logo';
import LogoShowcase from './components/LogoShowcase';
import AdvancedChart from './components/AdvancedChart';
import { getAdvancedMockAnalysis, getQuickAdvice } from './services/advanced-mock-ai';
import AIButton from './components/AIButton';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h'];

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scans, setScans] = useState<AnalysisResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [note, setNote] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Close sidebar by default on mobile
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const lastAlerts = useRef<Record<string, number>>({});
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'DETAILS' | 'SCREENER' | 'ALERTS' | 'JOURNAL' | 'ACTIVITY' | 'BRAND'>('ANALYSIS');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [allSymbols, setAllSymbols] = useState<SymbolInfo[]>([]);
  const [chartData, setChartData] = useState<KlineData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ramdhan_favorites');
    return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ramdhan_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const lastDataAt = useRef(Date.now());
  const [isDataStale, setIsDataStale] = useState(false);
  const [paperTrading, setPaperTrading] = useState<PaperTradingState>(() => {
    const saved = localStorage.getItem('ramdhan_paper_trading');
    return saved ? JSON.parse(saved) : { balance: 1000, trades: [] };
  });

  // AI Credits State
  const [aiCredit, setAiCredit] = useState(() => {
    const saved = localStorage.getItem('ramdhan_ai_credits');
    const lastDate = localStorage.getItem('ramdhan_credit_date');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
      localStorage.setItem('ramdhan_credit_date', today);
      localStorage.setItem('ramdhan_ai_credits', '1000');
      return 1000;
    }
    return saved ? parseInt(saved) : 1000;
  });

  const [isAILoading, setIsAILoading] = useState(false);
  const [manualAIResponse, setManualAIResponse] = useState<string | null>(null);

  const handleManualAI = async () => {
    if (aiCredit <= 0) {
      alert("⚠️ Aapke free credits khatam ho gaye! Kal naye 1000 credits milenge.");
      return;
    }
    
    if (!analysis) {
      alert("🔍 Pehle koi symbol select karo!");
      return;
    }
    
    setIsAILoading(true);
    setManualAIResponse(null);
    
    setTimeout(() => {
      const advice = getAdvancedMockAnalysis(selectedSymbol, analysis);
      setManualAIResponse(advice);
      const newCredit = aiCredit - 1;
      setAiCredit(newCredit);
      localStorage.setItem('ramdhan_ai_credits', newCredit.toString());
      
      if (newCredit <= 50) {
        alert(`⚠️ Sirf ${newCredit} free credits bache hain! Kal naye milenge.`);
      } else if (newCredit <= 100) {
        alert(`⚠️ ${newCredit} credits bache hain. Kal refresh ho jayenge.`);
      }
      
      setIsAILoading(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      localStorage.setItem('ramdhan_ai_credits', aiCredit.toString());
    };
  }, [aiCredit]);

  useEffect(() => {
    localStorage.setItem('ramdhan_paper_trading', JSON.stringify(paperTrading));
  }, [paperTrading]);

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ramdhan_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const loadSymbols = async () => {
      const [binance, coindcx] = await Promise.all([
        fetchBinanceSymbols(),
        fetchCoinDCXSymbols()
      ]);
      setAllSymbols([...binance, ...coindcx]);
    };
    loadSymbols();
  }, []);

  useEffect(() => {
    let interval: any;
    const updatePrice = async () => {
      if (!selectedSymbol || allSymbols.length === 0) return;
      const symbolInfo = allSymbols.find(s => s.symbol === selectedSymbol);
      if (!symbolInfo) return;
      if (symbolInfo.exchange === 'COINDCX') {
        const price = await fetchCoinDCXPrice(selectedSymbol);
        if (price > 0) setCurrentPrice(price);
      } else {
        const ticker = await fetchPrice(selectedSymbol);
        const price = parseFloat(ticker.price) || parseFloat(ticker.lastPrice) || 0;
        if (price > 0) setCurrentPrice(price);
      }
    };

    updatePrice();
    interval = setInterval(updatePrice, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, allSymbols]);

  const addActivityLog = useCallback((symbol: string, action: string, signal?: 'BUY' | 'SELL' | 'WAIT' | 'OVERBOUGHT' | 'OVERSOLD' | 'CAUTION' | 'STRONG_TREND') => {
    const log: ActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      symbol,
      action,
      signal,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 50));
  }, []);

  const [signalSensitivity, setSignalSensitivity] = useState(60);
  const [useHTFConfirmation, setUseHTFConfirmation] = useState(true);

  useEffect(() => {
    localStorage.setItem('ramdhan_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    if (selectedSymbol) {
      addActivityLog(selectedSymbol, `Viewed ${selectedSymbol}`);
    }
  }, [selectedSymbol, addActivityLog]);

  useEffect(() => {
    if (analysis) {
      addActivityLog(selectedSymbol, 'Signal Updated', analysis.zone);
    }
  }, [analysis?.zone, selectedSymbol, addActivityLog]);

  // Fetch analysis for all symbols
  const performFullScan = useCallback(async () => {
    if (allSymbols.length === 0) return;
    try {
      const symbolsToScan = Array.from(new Set([...favorites, selectedSymbol]));
      const scanResults = (await Promise.all(
        symbolsToScan.map(async (symbol) => {
          try {
            const symbolInfo = allSymbols.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            const klines = symbolInfo.exchange === 'COINDCX' 
              ? await fetchCoinDCXKlines(symbol, selectedTimeframe)
              : await fetchKlines(symbol, selectedTimeframe);
            
            if (!klines || klines.length === 0) return null;

            return await analyzeMarket(symbol, symbolInfo?.exchange || 'BINANCE', selectedTimeframe, klines, { 
              sensitivity: signalSensitivity, 
              useHTF: useHTFConfirmation 
            });
          } catch (err) {
            console.warn(`Analysis failed for ${symbol}:`, err);
            return null;
          }
        })
      )).filter((res): res is AnalysisResult => res !== null);
      setScans(scanResults);
      lastDataAt.current = Date.now();
      setIsDataStale(false);
      
      const currentAnalysis = scanResults.find(s => s.symbol === selectedSymbol);
      if (currentAnalysis) {
        setAnalysis(currentAnalysis);
        
        // Update chart data for selected symbol
        const symbolInfo = allSymbols.find(s => s.symbol === selectedSymbol);
        const klines = symbolInfo?.exchange === 'COINDCX' 
          ? await fetchCoinDCXKlines(selectedSymbol, selectedTimeframe)
          : await fetchKlines(selectedSymbol, selectedTimeframe);
        setChartData(klines);
        
        // Generate Alerts
        const newAlerts: Alert[] = [];
        const alertIdBase = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const TEN_MINUTES = 10 * 60 * 1000;

        const canTrigger = (key: string) => {
          const lastTime = lastAlerts.current[key] || 0;
          return (now - lastTime) > TEN_MINUTES;
        };

        const addAlert = (type: Alert['type'], message: string, key: string, reason: string, suggestedAction: string) => {
          if (canTrigger(key)) {
            newAlerts.push({
              id: `${alertIdBase}-${key}`,
              symbol: currentAnalysis.symbol,
              type,
              message,
              time: new Date().toLocaleTimeString(),
              reason,
              suggestedAction,
              candleTime: currentAnalysis.lastCandleTime
            });
            lastAlerts.current[key] = now;
          }
        };

        if (currentAnalysis.volumeSpike) {
          const direction = currentAnalysis.trend === 'BULLISH' ? 'Bullish accumulation' : 'Bearish distribution';
          addAlert('SMART_MONEY', `${currentAnalysis.symbol} High volume spike detected → Possible smart money ${currentAnalysis.trend === 'BULLISH' ? 'buying' : 'selling'}`, 'vol', `Significant volume increase with ${direction}.`, 'Follow the trend confirmed by the volume spike.');
        }

        if (currentAnalysis.bullishProb > 75) {
          addAlert('BREAKOUT', `${currentAnalysis.symbol} Bullish probability ${currentAnalysis.bullishProb}% → Upward move likely`, 'prob_bull', `High probability based on RSI, EMA, and Volume.`, 'Look for long entries.');
        } else if (currentAnalysis.bearishProb > 75) {
          addAlert('BREAKOUT', `${currentAnalysis.symbol} Bearish probability ${currentAnalysis.bearishProb}% → Downward move likely`, 'prob_bear', `High probability based on RSI, EMA, and Volume.`, 'Look for short entries.');
        }

        if (currentAnalysis.zone === 'STRONG_TREND') {
          addAlert('BREAKOUT', `${currentAnalysis.symbol} EMA 20 crossed EMA 50 + volume → ${currentAnalysis.trend} continuation`, 'trend', `High confidence trend identified.`, 'Trade in the direction of the trend.');
        }

        if (currentAnalysis.rsi > 80) {
          addAlert('RSI', `${currentAnalysis.symbol} RSI ${currentAnalysis.rsi.toFixed(1)} (Overbought) → Possible pullback soon`, 'rsi_high', `RSI value is ${currentAnalysis.rsi.toFixed(1)}, which is extremely high.`, 'Wait for a reversal or RSI to cool down before considering long entries.');
        } else if (currentAnalysis.rsi < 20) {
          addAlert('RSI', `${currentAnalysis.symbol} RSI ${currentAnalysis.rsi.toFixed(1)} (Oversold) → Bounce back possible`, 'rsi_low', `RSI value is ${currentAnalysis.rsi.toFixed(1)}, which is extremely low.`, 'Look for bullish divergence or reversal signs for a potential bounce.');
        }

        if (currentAnalysis.zone === 'CAUTION') {
          addAlert('RISK', `${currentAnalysis.symbol} Risk Alert: Market in Caution Zone`, 'risk', 'Indicators suggest potential exhaustion or high volatility.', 'Reduce position size or wait for clearer signals.');
        }
        
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        }
      } else if (scanResults.length > 0 && !allSymbols.find(s => s.symbol === selectedSymbol)) {
        // Fallback to the first valid scanned symbol if the selected one is invalid
        setSelectedSymbol(scanResults[0].symbol);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [selectedSymbol, selectedTimeframe, allSymbols, favorites, signalSensitivity, useHTFConfirmation]);

  // Initial fetch and candle-close detection
  useEffect(() => {
    performFullScan();
    
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      // Update stale status (stale if no data for 60 seconds)
      setIsDataStale(Date.now() - lastDataAt.current > 60000);

      if (!autoRefresh) {
        setCountdown(0);
        return;
      }

      let intervalSeconds = refreshInterval;
      const remaining = intervalSeconds - (now % intervalSeconds);
      setCountdown(remaining);

      // When interval completes
      if (remaining === intervalSeconds) {
        performFullScan();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTimeframe, performFullScan]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speak = () => {
    if (!analysis) return;
    const utterance = new SpeechSynthesisUtterance(analysis.explanation);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const addJournalEntry = () => {
    if (!note.trim()) return;
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      symbol: selectedSymbol,
      note: note.trim(),
      time: new Date().toLocaleString()
    };
    setJournal(prev => [entry, ...prev]);
    setNote('');
  };

  const handleTrade = (type: 'BUY' | 'SELL') => {
    if (!analysis) return;
    const trade: Trade = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      symbol: selectedSymbol,
      type,
      entryPrice: analysis.price,
      amount: 100,
      time: new Date().toLocaleString(),
      status: 'OPEN'
    };
    setPaperTrading(prev => ({
      ...prev,
      trades: [trade, ...prev.trades]
    }));
  };

  const closeTrade = (tradeId: string, exitPrice: number) => {
    setPaperTrading(prev => {
      const trades = prev.trades.map(t => {
        if (t.id === tradeId && t.status === 'OPEN') {
          const pnl = t.type === 'BUY' 
            ? (exitPrice - t.entryPrice) * (t.amount / t.entryPrice)
            : (t.entryPrice - exitPrice) * (t.amount / t.entryPrice);
          return { ...t, exitPrice, pnl, status: 'CLOSED' as const };
        }
        return t;
      });
      const closedTrade = trades.find(t => t.id === tradeId);
      const newBalance = prev.balance + (closedTrade?.pnl || 0);
      return { balance: newBalance, trades };
    });
  };

  const performance = useMemo(() => {
    const closedTrades = paperTrading.trades.filter(t => t.status === 'CLOSED');
    const totalTrades = closedTrades.length;
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    return { totalTrades, winRate, totalPnl };
  }, [paperTrading.trades]);

  const bestSetup = useMemo(() => {
    return [...scans].sort((a, b) => b.confidence - a.confidence)[0];
  }, [scans]);

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-emerald-500/30 transition-colors duration-300",
      theme === 'dark' ? "bg-black text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 border-b sticky top-0 z-50 px-4 flex items-center justify-between backdrop-blur-md",
        theme === 'dark' ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white/50"
      )}>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Logo />
        </div>

        {/* Price Ticker */}
        <div className="flex-1 flex justify-center px-2 sm:px-4 overflow-hidden">
          {currentPrice && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1 rounded-xl border transition-all",
                theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-tighter leading-none mb-0.5">{selectedSymbol}</span>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className={cn(
                    "text-xs sm:text-lg font-black tabular-nums tracking-tight",
                    theme === 'dark' ? "text-white" : "text-zinc-900"
                  )}>
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-md shrink-0",
                    (analysis?.change24h || 0) >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {(analysis?.change24h || 0) >= 0 ? <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    {Math.abs(analysis?.change24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* AI Button */}
          <AIButton 
            onPress={handleManualAI}
            isLoading={isAILoading}
            theme={theme}
            creditLeft={aiCredit}
          />

          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={cn(
              "md:hidden p-2 rounded-lg transition-all",
              theme === 'dark' ? "hover:bg-zinc-900 text-zinc-500" : "hover:bg-zinc-100 text-zinc-400"
            )}
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-4">
            {/* Symbol Selector */}
            <div className="relative group">
              <div className={cn(
                "flex items-center gap-2 border rounded-lg px-3 py-1.5 transition-all min-w-[140px]",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={cn(
                    "bg-transparent text-xs font-bold focus:outline-none w-full",
                    theme === 'dark' ? "text-white" : "text-zinc-900"
                  )}
                />
              </div>
              
              {searchQuery && (
                <div className={cn(
                  "absolute top-full left-0 mt-2 w-64 border rounded-xl shadow-2xl z-[60] overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar",
                  theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
                )}>
                    {allSymbols
                      .filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const aFav = favorites.includes(a.symbol);
                        const bFav = favorites.includes(b.symbol);
                        if (aFav && !bFav) return -1;
                        if (!aFav && bFav) return 1;
                        return 0;
                      })
                      .slice(0, 50)
                      .map(s => (
                        <div 
                          key={`${s.exchange}-${s.symbol}`}
                          className={cn(
                            "flex items-center justify-between p-3 hover:bg-zinc-900/50 cursor-pointer transition-all",
                            selectedSymbol === s.symbol && "bg-emerald-500/10"
                          )}
                        onClick={() => {
                          setSelectedSymbol(s.symbol);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{s.symbol}</span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">{s.exchange}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => 
                              prev.includes(s.symbol) 
                                ? prev.filter(f => f !== s.symbol)
                                : [...prev, s.symbol]
                            );
                          }}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            favorites.includes(s.symbol) ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
                          )}
                        >
                          <Trophy className={cn("w-3.5 h-3.5", favorites.includes(s.symbol) && "fill-current")} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className={cn(
              "flex items-center rounded-lg border p-0.5",
              theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
            )}>
              {TIMEFRAMES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTimeframe(t)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                    selectedTimeframe === t 
                      ? (theme === 'dark' ? "bg-zinc-800 text-white shadow-lg" : "bg-white text-zinc-900 shadow-sm") 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className={cn(
                "p-2 rounded-lg transition-all text-zinc-500 relative",
                theme === 'dark' ? "hover:bg-zinc-900" : "hover:bg-zinc-100"
              )}
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-zinc-950" />
              )}
            </button>

            <AnimatePresence>
              {isAlertsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Recent Alerts</span>
                      <button onClick={() => setAlerts([])} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest">Clear All</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {alerts.length === 0 ? (
                        <div className="p-8 text-center opacity-30">
                          <Bell className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No alerts</p>
                        </div>
                      ) : (
                        alerts.map(alert => (
                          <div key={alert.id} className="p-4 border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-all">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-1.5 rounded-lg shrink-0",
                                alert.type === 'VOLUME' ? "bg-rose-500/10 text-rose-500" : 
                                alert.type === 'BREAKOUT' ? "bg-emerald-500/10 text-emerald-500" :
                                "bg-amber-500/10 text-amber-500"
                              )}>
                                <AlertCircle className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-zinc-200 leading-tight mb-1">{alert.message}</p>
                                <span className="text-[9px] font-bold text-zinc-600 uppercase">{alert.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={cn(
              "p-2 rounded-lg transition-all text-zinc-500 relative",
              theme === 'dark' ? "hover:bg-zinc-900" : "hover:bg-zinc-100"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setIsSettingsOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute right-0 top-full mt-2 w-80 border rounded-2xl shadow-2xl z-[101] overflow-hidden",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
                  )}
                >
                  <div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-zinc-800" : "border-zinc-200")}>
                    <span className={cn("text-xs font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>System Settings</span>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-zinc-400"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="p-4 space-y-6">
                    {/* Theme Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Appearance</label>
                      <div className={cn("flex p-1 rounded-xl", theme === 'dark' ? "bg-zinc-900" : "bg-zinc-100")}>
                        <button 
                          onClick={() => setTheme('light')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                            theme === 'light' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
                          )}
                        >
                          <Sun className="w-3.5 h-3.5" /> Light
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                            theme === 'dark' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500"
                          )}
                        >
                          <Moon className="w-3.5 h-3.5" /> Dark
                        </button>
                      </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interface Mode</label>
                      <div className={cn("flex p-1 rounded-xl", theme === 'dark' ? "bg-zinc-900" : "bg-zinc-100")}>
                        <button 
                          onClick={() => setIsAdvanced(false)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                            !isAdvanced ? (theme === 'dark' ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm") : "text-zinc-500"
                          )}
                        >
                          Simple
                        </button>
                        <button 
                          onClick={() => setIsAdvanced(true)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                            isAdvanced ? (theme === 'dark' ? "bg-zinc-800 text-white" : "bg-white text-zinc-900 shadow-sm") : "text-zinc-500"
                          )}
                        >
                          Advanced
                        </button>
                      </div>
                    </div>

                    {/* Auto Refresh */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", theme === 'dark' ? "text-zinc-200" : "text-zinc-900")}>Auto Refresh</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Real-time updates</p>
                      </div>
                      <button 
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          autoRefresh ? "bg-emerald-500" : "bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          autoRefresh ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    {/* Signal Sensitivity */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className={cn("text-xs font-bold", theme === 'dark' ? "text-zinc-200" : "text-zinc-900")}>Signal Sensitivity</p>
                        <span className="text-[10px] font-black text-emerald-500">{signalSensitivity}%</span>
                      </div>
                      <input 
                        type="range"
                        min="50"
                        max="90"
                        step="5"
                        value={signalSensitivity}
                        onChange={(e) => setSignalSensitivity(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Lower = More signals, Higher = More accurate</p>
                    </div>

                    {/* HTF Confirmation Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", theme === 'dark' ? "text-zinc-200" : "text-zinc-900")}>HTF Confirmation</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Multi-timeframe analysis</p>
                      </div>
                      <button 
                        onClick={() => setUseHTFConfirmation(!useHTFConfirmation)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all",
                          useHTFConfirmation ? "bg-emerald-500" : "bg-zinc-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          useHTFConfirmation ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    {/* Data Management */}
                    <div className="pt-4 border-t border-zinc-800 space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data Management</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            if(confirm('Clear all activity logs?')) setActivityLogs([]);
                          }}
                          className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Clear Logs
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Clear all journal entries?')) setJournal([]);
                          }}
                          className="py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Clear Journal
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next Update In</span>
            <span className={cn(
              "text-xs font-black tabular-nums",
              autoRefresh ? "text-emerald-500" : "text-zinc-600"
            )}>
              {autoRefresh ? formatCountdown(countdown) : 'PAUSED'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-all text-zinc-500"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isSidebarOpen ? 'close' : 'open'}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "absolute top-16 left-0 right-0 p-4 border-b z-[60] md:hidden",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symbol..."
                  className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                    theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"
                  )}
                />
                {searchQuery && (
                  <div className={cn(
                    "absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto custom-scrollbar",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    {allSymbols
                      .filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 20)
                      .map(s => (
                        <div 
                          key={`${s.exchange}-${s.symbol}`}
                          className="p-4 border-b border-zinc-900/50 flex items-center justify-between"
                          onClick={() => {
                            setSelectedSymbol(s.symbol);
                            setSearchQuery('');
                            setIsMobileSearchOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{s.symbol}</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{s.exchange}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-zinc-700 -rotate-90" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Main Content Area */}
        <motion.div 
          layout
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Chart Section */}
          <div className="flex-1 min-h-0 relative">
            <AdvancedChart 
              key={`${selectedSymbol}-${selectedTimeframe}-${theme}`}
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
              theme={theme}
              exchange={allSymbols.find(s => s.symbol === selectedSymbol)?.exchange || 'BINANCE'}
            />
            
            {/* Mobile Controls Overlay */}
            <div className="md:hidden absolute top-4 left-4 flex flex-col gap-2 z-10">
              <div className="relative group">
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-[140px]">
                  <Search className="w-3 h-3 text-zinc-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent text-[10px] font-bold focus:outline-none w-full text-white"
                  />
                </div>
                
                {searchQuery && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[60] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                    {allSymbols
                      .filter(s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a, b) => {
                        const aFav = favorites.includes(a.symbol);
                        const bFav = favorites.includes(b.symbol);
                        if (aFav && !bFav) return -1;
                        if (!aFav && bFav) return 1;
                        return 0;
                      })
                      .slice(0, 50)
                      .map(s => (
                        <div 
                          key={`${s.exchange}-${s.symbol}`}
                          className={cn(
                            "flex items-center justify-between p-3 hover:bg-zinc-900/50 cursor-pointer transition-all",
                            selectedSymbol === s.symbol && "bg-emerald-500/10"
                          )}
                          onClick={() => {
                            setSelectedSymbol(s.symbol);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white">{s.symbol}</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase">{s.exchange}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites(prev => 
                                prev.includes(s.symbol) 
                                  ? prev.filter(f => f !== s.symbol)
                                  : [...prev, s.symbol]
                              );
                            }}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              favorites.includes(s.symbol) ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
                            )}
                          >
                            <Trophy className={cn("w-3.5 h-3.5", favorites.includes(s.symbol) && "fill-current")} />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex items-center bg-zinc-950/80 backdrop-blur-sm rounded-lg border border-zinc-800 p-0.5">
                {TIMEFRAMES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimeframe(t)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                      selectedTimeframe === t ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Signal Markers Overlay */}
            {analysis?.markers && analysis.markers.length > 0 && (
              <div className="absolute top-20 right-4 flex flex-col gap-2 z-10 pointer-events-none">
                {analysis.markers.map((marker, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border font-black text-[10px] uppercase tracking-widest flex items-center gap-2",
                      marker.type === 'BUY' || marker.type === 'BREAKOUT' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500" : "bg-rose-500/20 border-rose-500/40 text-rose-500"
                    )}
                  >
                    {marker.type === 'BUY' && <TrendingUp className="w-3 h-3" />}
                    {marker.type === 'SELL' && <TrendingDown className="w-3 h-3" />}
                    {marker.type} SIGNAL @ {marker.price.toFixed(2)}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Scanner Bar */}
          <div className={cn(
            "h-12 border-t flex items-center px-4 gap-6 overflow-x-auto custom-scrollbar",
            theme === 'dark' ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
          )}>
            <div className="flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Market Pulse</span>
            </div>
            <div className="flex items-center gap-4">
              {scans
                .sort((a, b) => {
                  const aFav = favorites.includes(a.symbol);
                  const bFav = favorites.includes(b.symbol);
                  if (aFav && !bFav) return -1;
                  if (!aFav && bFav) return 1;
                  return 0;
                })
                .map(s => (
                  <button 
                    key={`${s.exchange}-${s.symbol}`}
                    onClick={() => setSelectedSymbol(s.symbol)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0",
                      s.zone === 'BUY' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                      s.zone === 'DANGER' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                      (theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500")
                    )}
                  >
                    {favorites.includes(s.symbol) && <Trophy className="w-2.5 h-2.5 text-amber-500 fill-current" />}
                    <span className="text-[10px] font-black">{s.symbol}</span>
                    <span className="text-[10px] font-bold opacity-70">{s.confidence}%</span>
                  </button>
                ))}
            </div>
            {bestSetup && (
              <div className="ml-auto flex items-center gap-2 shrink-0 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                <Trophy className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Best Setup: {bestSetup.symbol} ({bestSetup.confidence}%)</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Mobile Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              
              <motion.aside 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={cn(
                  "absolute lg:relative right-0 top-0 bottom-0 w-full sm:w-[400px] lg:w-[400px] border-l flex flex-col overflow-hidden z-50",
                  theme === 'dark' ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
                )}
              >
                <div className={cn(
                "flex border-b overflow-x-auto custom-scrollbar hide-scrollbar",
                theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
              )}>
                {(['ANALYSIS', 'DETAILS', 'SCREENER', 'ALERTS', 'JOURNAL'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                      activeTab === tab ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "pb-20",
                      activeTab === 'ANALYSIS' ? "p-6 space-y-6" : ""
                    )}
                  >
                    {activeTab === 'ANALYSIS' && (
                      <div className="space-y-6">
                        {analysis ? (
                          <>
                            {/* AI Quick Advice */}
                            <div className={cn(
                              "p-4 rounded-xl border",
                              theme === 'dark' ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                  <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">AI Quick View</span>
                                </div>
                                <span className="text-[8px] text-zinc-500">{aiCredit} credits left</span>
                              </div>
                              <p className="text-xs font-medium leading-relaxed">
                                {analysis ? getQuickAdvice(selectedSymbol, analysis) : "Select a symbol to see AI analysis"}
                              </p>
                            </div>

                            {/* 1. Market Zone + Confidence */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={cn(
                                  "p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                                  analysis.zone === 'BUY' ? "bg-emerald-500/10 border-emerald-500/20" :
                                  analysis.zone === 'SELL' ? "bg-rose-500/10 border-rose-500/20" :
                                  analysis.zone === 'OVERBOUGHT' ? "bg-amber-500/10 border-amber-500/20" :
                                  analysis.zone === 'OVERSOLD' ? "bg-blue-500/10 border-blue-500/20" :
                                  analysis.zone === 'CAUTION' ? "bg-rose-500/10 border-rose-500/20" :
                                  analysis.zone === 'STRONG_TREND' ? "bg-emerald-500/10 border-emerald-500/20" :
                                  "bg-zinc-500/10 border-zinc-500/20"
                                )}>
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Market Zone</span>
                                  <span className={cn(
                                    "text-xl font-black uppercase tracking-tighter text-center",
                                    analysis.zone === 'BUY' || analysis.zone === 'STRONG_TREND' ? "text-emerald-500" :
                                    analysis.zone === 'SELL' || analysis.zone === 'OVERBOUGHT' || analysis.zone === 'CAUTION' ? "text-rose-500" :
                                    analysis.zone === 'OVERSOLD' ? "text-blue-500" :
                                    "text-amber-500"
                                  )}>{analysis.zone.replace('_', ' ')}</span>
                                </div>
                                <div className={cn(
                                  "p-5 rounded-2xl border flex flex-col items-center gap-2",
                                  theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                                )}>
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Confidence</span>
                                  <span className={cn("text-2xl font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{analysis.confidence}%</span>
                                </div>
                              </div>

                              {/* 2. Probability Bar */}
                              <div className="space-y-3 p-5 rounded-2xl border border-white/5 bg-white/5">
                                <div className="flex justify-between items-end">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Probability</span>
                                  <div className="flex gap-4">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Bullish {analysis.bullishProb}%</span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Bearish {analysis.bearishProb}%</span>
                                  </div>
                                </div>
                                <div className={cn(
                                  "h-2.5 rounded-full overflow-hidden flex relative shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                                  theme === 'dark' ? "bg-zinc-900" : "bg-zinc-200"
                                )}>
                                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 relative" style={{ width: `${analysis.bullishProb}%` }}>
                                    <div className="absolute inset-0 bg-emerald-400/20 blur-sm" />
                                  </div>
                                  <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000 relative" style={{ width: `${analysis.bearishProb}%` }}>
                                    <div className="absolute inset-0 bg-rose-400/20 blur-sm" />
                                  </div>
                                </div>
                              </div>

                              {/* 4. Guidance Section - Highlighted */}
                              <div className={cn(
                                "p-6 border rounded-[24px] space-y-4 shadow-xl transition-all hover:scale-[1.01]",
                                theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5" : "bg-emerald-50 border-emerald-200"
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Guidance Mode</h3>
                                  </div>
                                  <div className="px-2 py-0.5 bg-emerald-500/20 rounded-md text-[8px] font-black text-emerald-500 uppercase tracking-widest">AI Active</div>
                                </div>
                                <div className="space-y-4">
                                  <div className={cn(
                                    "p-3 rounded-xl border",
                                    theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                  )}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Kya ho raha hai</span>
                                    </div>
                                    <p className={cn("text-sm font-bold leading-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                                      {analysis.guidance.condition}
                                    </p>
                                  </div>

                                  <div className={cn(
                                    "p-3 rounded-xl border",
                                    theme === 'dark' ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                                  )}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Kya karna chahiye</span>
                                    </div>
                                    <p className={cn("text-sm font-bold leading-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                                      {analysis.guidance.action}
                                    </p>
                                  </div>

                                  <div className={cn(
                                    "p-3 rounded-xl border",
                                    theme === 'dark' ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200"
                                  )}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                                      <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Kya nahi karna</span>
                                    </div>
                                    <p className={cn("text-sm font-bold leading-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                                      {analysis.guidance.avoid}
                                    </p>
                                  </div>

                                  {analysis.possibleEntry && (
                                    <div className={cn(
                                      "p-3 rounded-xl border",
                                      theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                                    )}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Possible Entry</span>
                                      </div>
                                      <p className={cn("text-sm font-black", theme === 'dark' ? "text-amber-400" : "text-amber-600")}>
                                        {analysis.possibleEntry}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 5. Smart Explanation */}
                              <div className={cn(
                                "p-5 border rounded-2xl space-y-3",
                                theme === 'dark' ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                              )}>
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  <h3 className={cn("text-[9px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>Smart Explanation</h3>
                                </div>
                                <p className={cn("text-xs leading-relaxed font-medium", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>
                                  {analysis.explanation}
                                </p>
                              </div>

                              {/* 6. Confidence Breakdown */}
                              <div className="space-y-4">
                                <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Confidence Breakdown</h3>
                                <div className="grid grid-cols-3 gap-3">
                                  {[
                                    { label: 'RSI', value: analysis.rsiScore },
                                    { label: 'EMA', value: analysis.emaScore },
                                    { label: 'VOL', value: analysis.volumeScore }
                                  ].map((item, i) => (
                                    <div key={i} className={cn(
                                      "p-4 rounded-2xl border text-center flex flex-col justify-center gap-1",
                                      theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                                    )}>
                                      <span className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{item.value}</span>
                                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{item.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 7. Technical Pulse */}
                              <div className="space-y-4">
                                <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Technical Pulse</h3>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={cn(
                                    "p-4 rounded-2xl border flex justify-between items-center",
                                    theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                                  )}>
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Trend</span>
                                    <span className={cn(
                                      "text-[10px] font-black", 
                                      analysis.trend === 'BULLISH' ? "text-emerald-500" : 
                                      analysis.trend === 'BEARISH' ? "text-rose-500" : 
                                      "text-amber-500"
                                    )}>{analysis.trend}</span>
                                  </div>
                                  <div className={cn(
                                    "p-4 rounded-2xl border flex justify-between items-center",
                                    theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                                  )}>
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase">RSI (14)</span>
                                    <span className={cn("text-[10px] font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{analysis.rsi.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                            <Activity className="w-12 h-12 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Analyzing Market...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'DETAILS' && (
                      <div className="flex flex-col h-full">
                        {analysis ? (
                          <div className={cn(
                            "p-4 rounded-none border-y",
                            theme === 'dark' ? "bg-[#131722] border-[#2a2e39]" : "bg-white border-zinc-200"
                          )}>
                            {/* Header */}
                            <div className="mb-4">
                              <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-[#d1d4dc]" : "text-zinc-900")}>{analysis.symbol}</h2>
                              <div className="flex items-center gap-2 text-xs mt-1 text-[#787b86]">
                                <span>{analysis.symbol.replace('USDT', '')} / TetherUS</span>
                                <ExternalLink className="w-3 h-3" />
                                <span>•</span>
                                <span>BINANCE</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs mt-1 text-[#787b86]">
                                <span>Spot</span>
                                <span>•</span>
                                <span>Crypto</span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                              <div className="flex items-baseline gap-1">
                                <span className={cn(
                                  "text-4xl font-light",
                                  (analysis.change24h || 0) >= 0 ? "text-[#089981]" : "text-[#f23645]"
                                )}>
                                  {analysis.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm text-[#787b86]">USDT</span>
                              </div>
                              <div className={cn(
                                "flex items-center gap-2 text-sm mt-1",
                                (analysis.change24h || 0) >= 0 ? "text-[#089981]" : "text-[#f23645]"
                              )}>
                                <span>{(analysis.change24h || 0) >= 0 ? '+' : ''}{((analysis.change24h || 0) * analysis.price / 100).toFixed(2)}</span>
                                <span>{(analysis.change24h || 0) >= 0 ? '+' : ''}{analysis.change24h?.toFixed(2)}%</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#089981] mt-2">
                                <div className="w-2 h-2 rounded-full bg-[#089981]"></div>
                                <span>Market open</span>
                              </div>
                            </div>

                            {/* Bid/Ask Bars */}
                            <div className="space-y-1 mb-6">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#2962ff] bg-[#2962ff]/10 px-2 py-0.5 rounded font-mono">
                                  {(analysis.price * 0.9998).toFixed(2)} × {(Math.random() * 5).toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#f23645] bg-[#f23645]/10 px-2 py-0.5 rounded font-mono">
                                  {(analysis.price * 1.0002).toFixed(2)} × {(Math.random() * 5).toFixed(4)}
                                </span>
                              </div>
                            </div>

                            {/* Day's Range */}
                            <div className="space-y-2 mb-6">
                              <div className="flex justify-between text-xs text-[#d1d4dc]">
                                <span>{analysis.low24h?.toFixed(2)}</span>
                                <span className="text-[#787b86]">DAY'S RANGE</span>
                                <span>{analysis.high24h?.toFixed(2)}</span>
                              </div>
                              <div className="relative h-1.5 bg-[#2a2e39] rounded-full">
                                <div 
                                  className="absolute h-full bg-[#089981] rounded-full"
                                  style={{ 
                                    left: '0%', 
                                    width: '100%'
                                  }}
                                ></div>
                                <div 
                                  className="absolute top-2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#d1d4dc]"
                                  style={{ left: `${((analysis.price - (analysis.low24h || 0)) / ((analysis.high24h || 0) - (analysis.low24h || 0))) * 100}%`, transform: 'translateX(-50%)' }}
                                ></div>
                              </div>
                            </div>

                            {/* 52W Range (Mocked) */}
                            <div className="space-y-2 mb-6">
                              <div className="flex justify-between text-xs text-[#d1d4dc]">
                                <span>{(analysis.price * 0.6).toFixed(2)}</span>
                                <span className="text-[#787b86]">52WK RANGE</span>
                                <span>{(analysis.price * 1.4).toFixed(2)}</span>
                              </div>
                              <div className="relative h-1.5 bg-[#2a2e39] rounded-full">
                                <div className="absolute left-[20%] right-[10%] h-full bg-[#434651] rounded-full"></div>
                                <div 
                                  className="absolute top-2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#d1d4dc]"
                                  style={{ left: '60%', transform: 'translateX(-50%)' }}
                                ></div>
                              </div>
                            </div>

                            {/* Key Stats */}
                            <div className="space-y-3 mb-6">
                              <h3 className="text-sm text-[#d1d4dc]">Key stats</h3>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#787b86]">Volume</span>
                                <span className="text-[#d1d4dc]">{(analysis.volume24h || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#787b86]">Average Volume (30D)</span>
                                <span className="text-[#d1d4dc]">{((analysis.volume24h || 0) * 1.2).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            {/* Performance */}
                            <div className="space-y-3">
                              <h3 className="text-sm text-[#d1d4dc]">Performance</h3>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: '1W', val: 4.80 },
                                  { label: '1M', val: 1.56 },
                                  { label: '3M', val: -26.30 },
                                  { label: '6M', val: -42.99 },
                                  { label: 'YTD', val: -21.07 },
                                  { label: '1Y', val: -17.19 }
                                ].map((perf, i) => (
                                  <div key={i} className={cn(
                                    "p-2 rounded flex flex-col items-center justify-center gap-1",
                                    perf.val >= 0 ? "bg-[#089981]/10" : "bg-[#f23645]/10"
                                  )}>
                                    <span className={cn("text-xs font-medium", perf.val >= 0 ? "text-[#089981]" : "text-[#f23645]")}>
                                      {perf.val > 0 ? '+' : ''}{perf.val.toFixed(2)}%
                                    </span>
                                    <span className="text-[10px] text-[#787b86]">{perf.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                            <Activity className="w-12 h-12 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Analyzing Market...</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'SCREENER' && (
                      <div className={cn(
                        "flex flex-col border-t h-full",
                        theme === 'dark' ? "bg-[#131722] border-[#2a2e39]" : "bg-white border-zinc-200"
                      )}>
                        {/* Header */}
                        <div className="p-4 border-b border-[#2a2e39]">
                          <div className="flex items-center gap-2 text-sm text-[#d1d4dc]">
                            <span>US Exchanges, Volume Gainers</span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-[#787b86] border-b border-[#2a2e39]">
                          <span>Symb</span>
                          <span className="text-right">Last</span>
                          <span className="text-right">Chg%</span>
                          <span className="text-right">Vol</span>
                        </div>

                        {/* Table Rows */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {scans.map(s => (
                            <button
                              key={`${s.exchange}-${s.symbol}`}
                              onClick={() => setSelectedSymbol(s.symbol)}
                              className={cn(
                                "w-full grid grid-cols-4 gap-2 px-4 py-3 border-b border-[#2a2e39]/50 items-center transition-all",
                                selectedSymbol === s.symbol ? "bg-[#2a2e39]/50" : "hover:bg-[#2a2e39]/30"
                              )}
                            >
                              <div className="flex items-center gap-1.5 text-left">
                                <span className={cn("text-sm font-medium", theme === 'dark' ? "text-[#d1d4dc]" : "text-zinc-900")}>
                                  {s.symbol.replace('USDT', '')}
                                </span>
                                <span className="text-[8px] text-[#ff9800] border border-[#ff9800]/30 px-0.5 rounded">D</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#787b86]"></div>
                              </div>
                              <span className={cn("text-sm text-right", theme === 'dark' ? "text-[#d1d4dc]" : "text-zinc-900")}>
                                {s.price < 10 ? s.price.toFixed(4) : s.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className={cn(
                                "text-sm text-right",
                                (s.change24h || 0) >= 0 ? "text-[#089981]" : "text-[#f23645]"
                              )}>
                                {(s.change24h || 0) >= 0 ? '+' : ''}{s.change24h?.toFixed(2)}%
                              </span>
                              <span className="text-sm text-right text-[#787b86]">
                                {s.volume24h ? (s.volume24h > 1000000 ? (s.volume24h / 1000000).toFixed(2) + ' M' : (s.volume24h / 1000).toFixed(2) + ' K') : '-'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'ALERTS' && (
                      <div className="space-y-4">
                        {alerts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                            <BellOff className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No alerts triggered</p>
                          </div>
                        ) : (
                          alerts.map(alert => (
                            <motion.button
                              key={alert.id}
                              onClick={() => setSelectedAlert(alert)}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "w-full p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group",
                                alert.type === 'RSI' ? "bg-amber-500/10 border-amber-500/20" :
                                alert.type === 'SMART_MONEY' ? "bg-emerald-500/10 border-emerald-500/20" :
                                alert.type === 'BREAKOUT' ? "bg-blue-500/10 border-blue-500/20" :
                                "bg-rose-500/10 border-rose-500/20"
                              )}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                  alert.type === 'RSI' ? "bg-amber-500/20 text-amber-500" :
                                  alert.type === 'SMART_MONEY' ? "bg-emerald-500/20 text-emerald-500" :
                                  alert.type === 'BREAKOUT' ? "bg-blue-500/20 text-blue-500" :
                                  "bg-rose-500/20 text-rose-500"
                                )}>
                                  {alert.type.replace('_', ' ')} ALERT
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500">{alert.time}</span>
                              </div>
                              <p className={cn("text-sm font-bold leading-snug", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                                {alert.message}
                              </p>
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>View Details</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </motion.button>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'JOURNAL' && (
                      <div className="space-y-6">
                        {/* Performance Summary */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className={cn(
                            "p-3 rounded-xl border text-center",
                            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                          )}>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-1">Trades</span>
                            <span className={cn("text-xs font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{performance.totalTrades}</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-xl border text-center",
                            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                          )}>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-1">Win Rate</span>
                            <span className="text-xs font-black text-emerald-500">{performance.winRate.toFixed(0)}%</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-xl border text-center",
                            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                          )}>
                            <span className="text-[8px] text-zinc-500 font-bold uppercase block mb-1">Total P/L</span>
                            <span className={cn(
                              "text-xs font-black",
                              performance.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>₹{performance.totalPnl.toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Paper Trading Controls */}
                        <div className={cn(
                          "p-4 border rounded-2xl space-y-4",
                          theme === 'dark' ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                        )}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Paper Trading</span>
                            <span className="text-xs font-black text-emerald-500">Balance: ₹{paperTrading.balance.toFixed(0)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleTrade('BUY')}
                              className="py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                            >
                              Buy ₹100
                            </button>
                            <button 
                              onClick={() => handleTrade('SELL')}
                              className="py-2 bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all"
                            >
                              Sell ₹100
                            </button>
                          </div>
                        </div>

                        {/* Active Trades */}
                        {paperTrading.trades.some(t => t.status === 'OPEN') && (
                          <div className="space-y-3">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Trades</h3>
                            {paperTrading.trades.filter(t => t.status === 'OPEN').map(trade => (
                              <div key={trade.id} className={cn(
                                "p-4 rounded-xl border flex justify-between items-center",
                                theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"
                              )}>
                                <div>
                                  <span className={cn("text-[10px] font-black uppercase mr-2", trade.type === 'BUY' ? "text-emerald-500" : "text-rose-500")}>
                                    {trade.type}
                                  </span>
                                  <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-zinc-900")}>{trade.symbol} @ {trade.entryPrice.toFixed(2)}</span>
                                </div>
                                <button 
                                  onClick={() => analysis && closeTrade(trade.id, analysis.price)}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900"
                                  )}
                                >
                                  Close
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Trade Journal</h2>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <textarea 
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Add a trading note..."
                              className={cn(
                                "w-full h-24 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none",
                                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                              )}
                            />
                            <button 
                              onClick={addJournalEntry}
                              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                              Save Entry
                            </button>
                          </div>

                          <div className={cn(
                            "space-y-3 pt-4 border-t",
                            theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
                          )}>
                            {journal.map(entry => (
                              <div key={entry.id} className={cn(
                                "p-4 rounded-xl border space-y-2",
                                theme === 'dark' ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200"
                              )}>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{entry.symbol}</span>
                                  <span className="text-[9px] font-bold text-zinc-600 uppercase">{entry.time}</span>
                                </div>
                                <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>{entry.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ACTIVITY' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Today Activity</h2>
                          <button 
                            onClick={() => setActivityLogs([])}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest"
                          >
                            Clear Logs
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {activityLogs.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                              <Clock className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No activity yet</p>
                            </div>
                          ) : (
                            activityLogs.map(log => (
                              <div key={log.id} className={cn(
                                "p-4 rounded-xl border flex items-start gap-4 transition-all",
                                theme === 'dark' ? "bg-zinc-900/30 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                              )}>
                                <div className={cn(
                                  "p-2 rounded-lg shrink-0",
                                  log.signal === 'BUY' ? "bg-emerald-500/10 text-emerald-500" :
                                  log.signal === 'SELL' ? "bg-rose-500/10 text-rose-500" :
                                  "bg-zinc-500/10 text-zinc-500"
                                )}>
                                  {log.signal === 'BUY' ? <TrendingUp className="w-3.5 h-3.5" /> : 
                                   log.signal === 'SELL' ? <TrendingDown className="w-3.5 h-3.5" /> : 
                                   <Activity className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={cn("text-xs font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>{log.symbol}</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{log.time}</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                    {log.action} {log.signal && <span className={cn("ml-1", log.signal === 'BUY' ? "text-emerald-500" : "text-rose-500")}>→ {log.signal} SIGNAL</span>}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'BRAND' && (
                      <LogoShowcase theme={theme} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Info */}
              <div className={cn(
                "p-4 border-t",
                theme === 'dark' ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-zinc-50/50"
              )}>
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>RD Engine v3.0.0</span>
                  <span className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-500",
                        isDataStale ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      )} />
                      {!isDataStale && (
                        <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                      )}
                    </div>
                    <span className={isDataStale ? "text-rose-500" : "text-emerald-500"}>
                      {isDataStale ? "Disconnected" : "Live Data"}
                    </span>
                  </span>
                </div>
              </div>
            </motion.aside>
          </>
          )}
        </AnimatePresence>
      </main>

      {/* Alert Details Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAlert(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-lg rounded-[32px] border overflow-hidden shadow-2xl",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className={cn(
                "p-8 border-b flex justify-between items-center",
                theme === 'dark' ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-100 bg-zinc-50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    selectedAlert.type === 'RSI' ? "bg-amber-500/20 text-amber-500" :
                    selectedAlert.type === 'SMART_MONEY' ? "bg-emerald-500/20 text-emerald-500" :
                    selectedAlert.type === 'BREAKOUT' ? "bg-blue-500/20 text-blue-500" :
                    "bg-rose-500/20 text-rose-500"
                  )}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn("text-xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                      {selectedAlert.type.replace('_', ' ')} ALERT
                    </h2>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedAlert.symbol} • {selectedAlert.time}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-zinc-800 rounded-xl transition-all text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Message</h3>
                  <p className={cn("text-lg font-bold leading-tight", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                    {selectedAlert.message}
                  </p>
                </div>

                {selectedAlert.reason && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reason (Indicator)</h3>
                    <div className={cn(
                      "p-4 rounded-2xl border font-medium text-sm leading-relaxed",
                      theme === 'dark' ? "bg-zinc-900/50 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                    )}>
                      {selectedAlert.reason}
                    </div>
                  </div>
                )}

                {selectedAlert.suggestedAction && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Suggested Action</h3>
                    <div className={cn(
                      "p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 font-bold text-sm leading-relaxed text-emerald-500"
                    )}>
                      {selectedAlert.suggestedAction}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setSelectedSymbol(selectedAlert.symbol);
                    setSelectedAlert(null);
                  }}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Analyze {selectedAlert.symbol} Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual AI Response Modal */}
      <AnimatePresence>
        {manualAIResponse && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualAIResponse(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative max-w-md w-full max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className={cn(
                "sticky top-0 flex items-center justify-between p-4 border-b",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-black text-sm uppercase tracking-widest">AI Deep Analysis</h3>
                </div>
                <button 
                  onClick={() => setManualAIResponse(null)}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    theme === 'dark' ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {manualAIResponse}
                </div>
              </div>
              
              <div className={cn(
                "sticky bottom-0 p-3 border-t flex justify-between items-center text-[9px]",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-zinc-500" : "bg-white border-zinc-200 text-zinc-500"
              )}>
                <span>⚡ RamDhan AI v3.0</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Credits left: {aiCredit}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}