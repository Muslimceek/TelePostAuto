
import React from 'react';

interface MobileHeaderProps {
  title: string;
  currentBrain?: string;
  isAutoMode?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, currentBrain, isAutoMode }) => {
  return (
    <div className="sticky top-0 z-[100] bg-black/60 backdrop-blur-[60px] border-b border-white/15 px-6 py-6 pt-[calc(1.5rem+env(safe-area-inset-top))] safe-top">
      <div className="flex items-center justify-between">
        {/* Left Section - Enhanced */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-[1.75rem] bg-gradient-to-br from-[#8b6f47] via-[#d4a574] to-[#a6895f] flex items-center justify-center shadow-xl shadow-[#8b6f47]/40 flex-shrink-0 relative animate-float card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b6f47]/50 to-[#d4a574]/50 rounded-[1.75rem] blur-xl opacity-50" />
            <svg className="w-8 h-8 text-black relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white leading-none truncate gradient-text text-3d">{title}</h1>
            {currentBrain && (
              <p className="text-[12px] font-black text-white/60 mt-1.5 truncate flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isAutoMode ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' : 'bg-white/40'}`} />
                <span className="retro-glow">{currentBrain}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Enhanced Status Badge */}
        <div className={`flex items-center gap-3 glass-card-elevated px-5 py-3 rounded-[1.5rem] border flex-shrink-0 micro-bounce ${
          isAutoMode ? 'border-emerald-400/40 shadow-lg shadow-emerald-400/20' : 'border-white/20'
        }`}>
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${isAutoMode ? 'bg-emerald-400' : 'bg-white/50'} shadow-xl ${isAutoMode ? 'shadow-emerald-400/60' : ''}`} />
            {isAutoMode && (
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
            )}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-wider ${
            isAutoMode ? 'text-emerald-400 retro-glow' : 'text-white/70'
          }`}>
            {isAutoMode ? 'Active' : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
};
