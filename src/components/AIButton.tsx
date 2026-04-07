// src/components/AIButton.tsx
import { useState, useEffect } from 'react';
import { Sparkles, Zap, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AIButtonProps {
  onPress: () => void;
  isLoading: boolean;
  theme: 'dark' | 'light';
  creditLeft: number;
}

export default function AIButton({ onPress, isLoading, theme, creditLeft }: AIButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const creditWarning = creditLeft < 100;
  const creditCritical = creditLeft < 50;
  
  return (
    <div className="relative">
      <div className="flex items-center gap-0">
        {/* Main Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onPress}
          disabled={isLoading || creditLeft <= 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-l-xl font-bold text-xs uppercase tracking-widest transition-all",
            "border shadow-lg",
            theme === 'dark' 
              ? "bg-gradient-to-r from-purple-600 to-emerald-600 border-purple-500/30 text-white" 
              : "bg-gradient-to-r from-purple-500 to-emerald-500 border-white/30 text-white",
            (isLoading || creditLeft <= 0) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </motion.button>
        
        {/* Dropdown Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "px-2 py-2 rounded-r-xl border-l-0 transition-all",
            theme === 'dark' 
              ? "bg-gradient-to-r from-purple-600 to-emerald-600 border-purple-500/30 text-white" 
              : "bg-gradient-to-r from-purple-500 to-emerald-500 border-white/30 text-white"
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Credit Badge */}
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black flex items-center gap-1 cursor-pointer",
          creditCritical ? "bg-rose-500 text-white animate-pulse" :
          creditWarning ? "bg-amber-500 text-black" : 
          "bg-emerald-500 text-black"
        )}
      >
        {creditCritical ? <AlertTriangle className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
        {creditLeft}
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-[9px] font-bold whitespace-nowrap z-50",
              theme === 'dark' ? "bg-zinc-800 text-white" : "bg-zinc-200 text-black"
            )}
          >
            {creditLeft <= 0 
              ? "❌ Credits khatam! Kal milenge (1000/day)"
              : creditCritical 
              ? `⚠️ Sirf ${creditLeft} credits bache! Bachake use karo`
              : `✅ ${creditLeft} free credits bache hain`}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden",
                theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
              )}
            >
              <div className={cn(
                "p-3 border-b",
                theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
              )}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Free Credits</p>
                <p className={cn(
                  "text-lg font-black",
                  creditCritical ? "text-rose-500" : creditWarning ? "text-amber-500" : "text-emerald-500"
                )}>{creditLeft} / 1000</p>
                <p className="text-[8px] text-zinc-500 mt-1">Daily reset at 12:00 AM IST</p>
              </div>
              
              <div className="p-3 space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Info</p>
                <p className="text-[10px] leading-relaxed">
                  • Har AI analysis mein <strong>1 credit</strong> use hota hai<br/>
                  • Rozana <strong>1000 free credits</strong> milte hain<br/>
                  • Credits midnight pe refresh hote hain<br/>
                  • AI se smarter trading decisions lo!
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  onPress();
                }}
                disabled={creditLeft <= 0}
                className={cn(
                  "w-full p-3 text-center text-[10px] font-bold uppercase tracking-widest border-t transition-all",
                  theme === 'dark' 
                    ? "border-zinc-800 hover:bg-zinc-900 text-emerald-500" 
                    : "border-zinc-200 hover:bg-zinc-50 text-emerald-600",
                  creditLeft <= 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                {creditLeft <= 0 ? "No Credits Left" : "Use 1 Credit →"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}