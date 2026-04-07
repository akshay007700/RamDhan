import BrandLogo from './BrandLogo';

export default function Logo() {
  return (
    <div className="flex items-center gap-[10px] group cursor-pointer bg-white/5 backdrop-blur-md p-1.5 pr-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <BrandLogo size={36} showText={false} />
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-bold tracking-tight leading-none text-white">RamDhan</h1>
        <span className="text-[9px] font-medium text-[#9CA3AF] leading-none mt-1 uppercase tracking-wider">Smart Trading Assistant</span>
      </div>
    </div>
  );
}
