import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function BrandLogo({ size = 200, showText = true, className }: { size?: number, showText?: boolean, className?: string }) {
  const glowColor = "#00FF9C"; // Neon Green

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 w-full", className)}>
      <div 
        className="relative flex items-center justify-center w-full aspect-square"
        style={{ maxWidth: size }}
      >
        {/* Background Glow - Subtle */}
        <div 
          className="absolute inset-0 rounded-full opacity-10 blur-2xl"
          style={{ backgroundColor: glowColor }}
        />
        
        {/* Logo Container */}
        <div 
          className="relative w-full h-full bg-zinc-950 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,255,156,0.1)]"
        >
          <svg 
            viewBox="0 0 100 100" 
            className="w-[65%] h-[65%] drop-shadow-[0_0_8px_rgba(0,255,156,0.5)]"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Monogram R */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              d="M20 80V20H45C55 20 60 28 60 38C60 48 55 56 45 56H20 M45 56L60 80"
              stroke={glowColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Monogram D */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
              d="M70 20V80H80C90 80 95 70 95 50C95 30 90 20 80 20H70Z"
              stroke={glowColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Upward Arrow (Growth Symbol) - Integrated */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
              d="M10 90L40 60L60 75L90 35"
              stroke={glowColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            <motion.path
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 2 }}
              d="M80 35H90V45"
              stroke={glowColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="text-center">
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-4xl font-black tracking-tighter text-white"
          >
            RamDhan
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs font-bold text-zinc-400 uppercase tracking-[0.4em] mt-3"
          >
            Smart Trading Assistant
          </motion.p>
        </div>
      )}
    </div>
  );
}
