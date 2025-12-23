
import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketingPost, SupportedLanguage } from '../types';
import { useI18n } from '../services/i18n';

interface DashboardProps {
  posts: MarketingPost[];
  activityLog: string[];
  isAutoMode: boolean;
  language: SupportedLanguage;
}

export const Dashboard: React.FC<DashboardProps> = ({ posts, activityLog, isAutoMode, language }) => {
  const t = useI18n(language);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const postedPosts = posts.filter(p => p.status === 'posted');
  
  const totalViews = postedPosts.reduce((acc, p) => acc + (p.performance?.views || 0), 0);
  const totalClicks = postedPosts.reduce((acc, p) => acc + (p.performance?.clicks || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";
  
  const chartData = postedPosts.length > 0 
    ? postedPosts.slice(0, 10).reverse().map(p => ({
        name: p.hook.slice(0, 5),
        ctr: p.performance?.ctr || 0
      }))
    : [{ name: 'A', ctr: 0 }, { name: 'B', ctr: 0 }];

  // Scrolltelling - Reveal on scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setRevealed((prev) => new Set([...prev, index]));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="p-6 space-y-6 pb-32">
      {/* AI EFFICIENCY - Hero Card with Aurora & 3D */}
      <div 
        ref={(el) => { sectionRefs.current[0] = el; }}
        className={`glass-card-elevated p-10 rounded-[3rem] relative overflow-hidden card-3d reveal-on-scroll ${
          revealed.has(0) ? 'revealed' : ''
        }`}
      >
        {/* Aurora Background Effects - 2025 Colors */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#8b6f47]/40 via-[#d4a574]/30 to-[#6f4e37]/20 rounded-full blur-3xl animate-aurora" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-gradient-to-br from-[#2d1b4e]/30 via-[#4a2c5a]/20 to-[#3d2b5e]/20 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#6f4e37]/20 to-[#8b6f47]/20 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-8 rounded-[2rem] bg-gradient-to-br from-[#8b6f47]/30 to-[#d4a574]/20 flex items-center justify-center border-2 border-[#8b6f47]/40 backdrop-blur-xl shadow-xl shadow-[#8b6f47]/30 animate-float">
             <svg className="w-12 h-12 text-[#d4a574] drop-shadow-[0_0_20px_rgba(139,111,71,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <p className="text-white/60 text-[12px] font-black uppercase tracking-[0.3em] mb-4 retro-glow">{t.overall_efficiency}</p>
          <div className="flex items-baseline gap-4">
            <h2 className="text-8xl font-black gradient-text tracking-tighter leading-none text-3d macro-text">{avgCtr}%</h2>
            <span className="text-[#d4a574] font-black text-xl uppercase tracking-wider retro-glow">CTR</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats - Enhanced */}
      <div className="bento-grid">
        <div 
          ref={(el) => { sectionRefs.current[1] = el; }}
          className={`bento-item glass-card p-7 rounded-[2.5rem] card-3d reveal-on-scroll ${
            revealed.has(1) ? 'revealed' : ''
          }`}
        >
           <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/40 to-cyan-400/30 mb-5 border-2 border-blue-400/40 shadow-lg shadow-blue-500/20 animate-float" style={{ animationDelay: '0.1s' }}>
              <svg className="w-7 h-7 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
           </div>
           <p className="text-white/60 text-[11px] font-black uppercase tracking-wider mb-3">{t.reach}</p>
           <h3 className="text-4xl font-black gradient-text tracking-tight text-3d">{(totalViews/1000).toFixed(1)}k</h3>
        </div>
        <div 
          ref={(el) => { sectionRefs.current[2] = el; }}
          className={`bento-item glass-card p-7 rounded-[2.5rem] card-3d reveal-on-scroll ${
            revealed.has(2) ? 'revealed' : ''
          }`}
        >
           <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/40 to-pink-400/30 mb-5 border-2 border-rose-400/40 shadow-lg shadow-rose-500/20 animate-float" style={{ animationDelay: '0.2s' }}>
              <svg className="w-7 h-7 text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
           </div>
           <p className="text-white/60 text-[11px] font-black uppercase tracking-wider mb-3">{t.engagement}</p>
           <h3 className="text-4xl font-black gradient-text tracking-tight text-3d">
             {postedPosts.reduce((acc, p) => acc + (p.performance?.reactions || 0), 0)}
           </h3>
        </div>
      </div>

      {/* TREND CHART - Enhanced with Aurora */}
      <div 
        ref={(el) => { sectionRefs.current[3] = el; }}
        className={`glass-card-elevated rounded-[2.5rem] p-8 card-3d reveal-on-scroll ${
          revealed.has(3) ? 'revealed' : ''
        }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-[#8b6f47] shadow-[0_0_20px_rgba(139,111,71,0.8)] animate-pulse" />
          <h3 className="text-[12px] font-black text-white/70 uppercase tracking-wider retro-glow">Performance Trend</h3>
        </div>
        <div className="w-full h-44 flex items-center justify-center relative" style={{ minHeight: '176px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b6f47]/10 to-[#d4a574]/5 rounded-2xl blur-xl" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorCtr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b6f47" stopOpacity={0.6}/>
                  <stop offset="50%" stopColor="#d4a574" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#2d1b4e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10,10,15,0.95)', 
                  border: '1px solid rgba(139,111,71,0.3)', 
                  borderRadius: '1.5rem', 
                  fontSize: '12px', 
                  backdropFilter: 'blur(40px)',
                  padding: '12px 16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                }}
                labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="ctr" 
                stroke="url(#colorCtr)" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorCtr)"
                dot={{ fill: '#8b6f47', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#d4a574', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACTIVITY LOG - Enhanced with Scrolltelling */}
      <div 
        ref={(el) => { sectionRefs.current[4] = el; }}
        className={`glass-card-elevated rounded-[2.5rem] p-8 card-3d reveal-on-scroll ${
          revealed.has(4) ? 'revealed' : ''
        }`}
      >
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse" />
              <h3 className="text-[12px] font-black text-white/70 uppercase tracking-wider retro-glow">{t.strategy_stream}</h3>
            </div>
         </div>
         <div className="space-y-4 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
            {activityLog.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-[13px] text-white/40 font-medium">{t.no_activity}</p>
              </div>
            )}
            {activityLog.map((log, i) => (
              <div 
                key={i} 
                className="flex gap-4 text-[13px] leading-relaxed group animate-fade-in-delayed glass-card p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all micro-bounce" 
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-[#d4a574]/70 font-mono text-[11px] font-bold flex-shrink-0 retro-glow">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <span className="text-white/80 group-hover:text-white transition-colors font-medium">{log}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
