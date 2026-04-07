import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface AdvancedChartProps {
  key?: string;
  symbol: string;
  timeframe: string;
  theme: 'dark' | 'light';
  exchange: 'BINANCE' | 'COINDCX';
}

export default function AdvancedChart({ symbol, timeframe, theme, exchange }: AdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tradingview_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.TradingView) {
        const formattedSymbol = symbol.includes(':') 
          ? symbol 
          : (exchange === 'COINDCX' ? 'COINDCX:' : 'BINANCE:') + symbol;

        new window.TradingView.widget({
          "autosize": true,
          "symbol": formattedSymbol,
          "interval": timeframe === '1m' ? '1' : timeframe === '5m' ? '5' : timeframe === '15m' ? '15' : '60',
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "toolbar_bg": theme === 'dark' ? "#09090b" : "#f8fafc",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": widgetId.current,
          "details": true,
          "hotlist": true,
          "calendar": true,
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "withdateranges": true,
          "drawings_access": {
            "type": 'black',
            "tools": [
              { "name": "Regression Trend" }
            ]
          },
          "enabled_features": [
            "study_templates",
            "use_localstorage_for_settings_events",
            "side_toolbar_in_fullscreen_mode",
            "header_saveload",
            "drawing_templates"
          ],
          "disabled_features": [
            "header_symbol_search",
            "header_compare"
          ],
          "studies": [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ]
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, timeframe, theme, exchange]);

  return (
    <div className="w-full h-full flex flex-col">
      <div id={widgetId.current} ref={containerRef} className="flex-1" />
    </div>
  );
}
