import { motion } from 'motion/react';
import BrandLogo from './BrandLogo';
import { cn } from '../lib/utils';

export default function LogoShowcase({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const accentColor = "#00FF9C"; // Neon Green

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 min-h-[600px] rounded-3xl border shadow-2xl overflow-hidden relative",
      theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
    )}>
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "p-8 sm:p-12 rounded-[30px] sm:rounded-[40px] border shadow-[0_0_100px_rgba(0,255,156,0.1)] flex items-center justify-center aspect-square w-full max-w-[400px]",
            theme === 'dark' ? "bg-black border-white/10" : "bg-white border-white/10"
          )}
        >
          <BrandLogo size={300} showText={true} />
        </motion.div>
        
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className={cn(
            "p-4 rounded-2xl border text-center",
            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Primary Font</p>
            <p className={cn("font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>Inter Black</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl border text-center",
            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Accent Color</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00FF9C] shadow-[0_0_10px_rgba(0,255,156,0.5)]" />
              <p className={cn("font-mono text-xs", theme === 'dark' ? "text-white" : "text-zinc-900")}>#00FF9C</p>
            </div>
          </div>
          <div className={cn(
            "p-4 rounded-2xl border text-center",
            theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Style</p>
            <p className={cn("font-black", theme === 'dark' ? "text-white" : "text-zinc-900")}>Modern Fintech</p>
          </div>
        </div>
      </div>
    </div>
  );
}
