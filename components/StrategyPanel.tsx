
import React, { useState } from 'react';
import { ChannelProfile, NicheType, ContentTone, SupportedLanguage } from '../types';
import { useI18n } from '../services/i18n';

interface StrategyPanelProps {
  channels: ChannelProfile[];
  activeChannelId: string;
  currentLanguage: SupportedLanguage;
  onAddChannel: (c: Partial<ChannelProfile>) => void;
  onRemoveChannel: (id: string) => void;
  onSetActive: (id: string) => void;
  onUpdateStrategy: (channelId: string, updates: any) => void;
  onSetLanguage: (lang: SupportedLanguage) => void;
}

export const StrategyPanel: React.FC<StrategyPanelProps> = ({ 
  channels, activeChannelId, currentLanguage, 
  onAddChannel, onRemoveChannel, onSetActive, onUpdateStrategy, onSetLanguage 
}) => {
  const t = useI18n(currentLanguage);
  const [showAdd, setShowAdd] = useState(false);
  const [newBot, setNewBot] = useState({ name: '', telegramToken: '', channelId: '', niche: NicheType.DESIGN });
  const [newSlot, setNewSlot] = useState("12:00");

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-400/20 flex items-center justify-center border-2 border-blue-400/40 shadow-lg shadow-blue-500/20 animate-float">
              <svg className="w-7 h-7 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-3xl font-black gradient-text tracking-tight text-3d">{t.agents}</h2>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="w-14 h-14 bg-gradient-to-br from-[#8b6f47] via-[#d4a574] to-[#a6895f] hover:from-[#a6895f] hover:via-[#d4a574] hover:to-[#8b6f47] text-white rounded-2xl transition-all shadow-xl shadow-[#8b6f47]/40 ios-btn-active flex items-center justify-center micro-bounce relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg className="w-7 h-7 relative z-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {/* LANGUAGE SWITCHER - Enhanced */}
        <div className="glass-card-elevated flex p-2 rounded-[2rem] overflow-x-auto border border-white/20">
          {(['en', 'ru', 'uz', 'kg', 'tj'] as SupportedLanguage[]).map(lang => (
            <button
              key={lang}
              onClick={() => onSetLanguage(lang)}
              className={`px-6 py-3 rounded-xl text-[13px] font-black uppercase tracking-wide transition-all ios-btn-active flex-shrink-0 micro-bounce ${
                currentLanguage === lang 
                  ? 'bg-gradient-to-r from-[#8b6f47] via-[#d4a574] to-[#a6895f] text-white shadow-xl shadow-[#8b6f47]/40 scale-105 retro-glow' 
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="glass-card-elevated p-6 rounded-[2rem] space-y-4 animate-fade-in shadow-2xl">
           <h3 className="text-[12px] font-bold uppercase text-white/60 tracking-wider mb-2">{t.add_agent}</h3>
           <input 
             placeholder="Название агента" 
             className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] focus:border-orange-500/50 focus:bg-white/8 outline-none text-white font-medium transition-all placeholder:text-white/30" 
             value={newBot.name} 
             onChange={e => setNewBot({...newBot, name: e.target.value})} 
           />
           <input 
             placeholder="Telegram Bot Token" 
             className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] focus:border-orange-500/50 focus:bg-white/8 outline-none text-white font-medium transition-all placeholder:text-white/30" 
             value={newBot.telegramToken} 
             onChange={e => setNewBot({...newBot, telegramToken: e.target.value})} 
           />
           <input 
             placeholder="@channel_handle" 
             className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] focus:border-orange-500/50 focus:bg-white/8 outline-none text-white font-medium transition-all placeholder:text-white/30" 
             value={newBot.channelId} 
             onChange={e => setNewBot({...newBot, channelId: e.target.value})} 
           />
           <button 
             onClick={() => { onAddChannel(newBot); setShowAdd(false); setNewBot({ name: '', telegramToken: '', channelId: '', niche: NicheType.DESIGN }); }}
             className="w-full bg-gradient-to-r from-[#8b6f47] to-[#d4a574] hover:from-[#a6895f] hover:to-[#d4a574] text-white font-black py-4 rounded-[1.75rem] shadow-lg shadow-[#8b6f47]/30 uppercase text-[12px] tracking-wide ios-btn-active transition-all"
           >
             Создать агента
           </button>
        </div>
      )}

      <div className="space-y-4">
        {channels.map((channel, index) => (
          <div 
            key={channel.id}
            onClick={() => onSetActive(channel.id)}
            className={`glass-card-elevated p-7 rounded-[2.5rem] border-2 transition-all cursor-pointer group ios-btn-active animate-fade-in card-3d micro-bounce ${
              activeChannelId === channel.id 
                ? 'border-[#8b6f47]/60 shadow-2xl shadow-[#8b6f47]/30 scale-[1.02]' 
                : 'border-white/15 hover:border-white/25'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                     <div className={`w-2.5 h-2.5 rounded-full ${activeChannelId === channel.id ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' : 'bg-white/30'}`}></div>
                     <h4 className="font-black text-white text-lg truncate">{channel.name}</h4>
                  </div>
                  <p className="text-[11px] text-white/50 font-bold uppercase tracking-wide">{channel.niche} pipeline</p>
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); onRemoveChannel(channel.id); }} 
                 className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 flex items-center justify-center transition-all ios-btn-active flex-shrink-0 ml-3"
               >
                 <svg className="w-4 h-4 text-white/60 hover:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
            </div>
            
            {activeChannelId === channel.id && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-6 animate-fade-in">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase text-white/50 tracking-wide">{t.tone}</p>
                      <select 
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.25rem] p-3 text-[13px] font-medium outline-none text-white focus:border-orange-500/50 transition-all"
                        value={channel.strategy.tone}
                        onChange={(e) => onUpdateStrategy(channel.id, { tone: e.target.value })}
                      >
                         {Object.values(ContentTone).map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase text-white/50 tracking-wide">{t.daily_goal}</p>
                      <input 
                        type="number" min="1" max="50" 
                        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.25rem] p-3 text-[13px] font-medium outline-none text-white focus:border-orange-500/50 transition-all placeholder:text-white/30"
                        value={channel.strategy.dailyTarget}
                        onChange={(e) => onUpdateStrategy(channel.id, { dailyTarget: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                 </div>

                 {/* SCHEDULING SLOTS */}
                 <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-white/50 tracking-wide">{t.slots}</p>
                    <div className="flex flex-wrap gap-2">
                       {channel.strategy.scheduleSlots?.map((slot, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-[#8b6f47]/30 px-4 py-2.5 rounded-xl text-[12px] font-bold text-[#d4a574]">
                           {slot}
                           <button onClick={(e) => {
                             e.stopPropagation();
                             const slots = channel.strategy.scheduleSlots.filter((_, i) => i !== idx);
                             onUpdateStrategy(channel.id, { scheduleSlots: slots });
                           }} className="text-white/40 hover:text-rose-400 transition-colors ios-btn-active text-lg leading-none">×</button>
                         </div>
                       ))}
                       <div className="flex gap-2">
                          <input 
                            type="time" 
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5 text-[12px] outline-none text-white font-medium focus:border-orange-500/50 transition-all" 
                            value={newSlot} 
                            onChange={e => setNewSlot(e.target.value)} 
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStrategy(channel.id, { scheduleSlots: [...(channel.strategy.scheduleSlots || []), newSlot] });
                            }} 
                            className="bg-gradient-to-r from-[#8b6f47] to-[#d4a574] text-white px-5 py-2.5 rounded-xl text-lg font-bold shadow-lg shadow-[#8b6f47]/30 ios-btn-active"
                          >+</button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-white/50 tracking-wide">{t.target_regions}</p>
                    <div className="flex flex-wrap gap-2">
                       {['Russia', 'Uzbekistan', 'Global', 'Kyrgyzstan', 'Tajikistan'].map(r => (
                         <button 
                           key={r}
                           className={`text-[12px] px-4 py-2.5 rounded-xl border font-bold uppercase transition-all ios-btn-active ${
                             channel.strategy.regions.includes(r) 
                               ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] border-[#8b6f47]/50 text-white shadow-lg shadow-[#8b6f47]/30' 
                               : 'bg-white/5 backdrop-blur-xl border-white/10 text-white/50 hover:text-white/70'
                           }`}
                           onClick={() => {
                             const regions = channel.strategy.regions.includes(r) ? channel.strategy.regions.filter(x => x !== r) : [...channel.strategy.regions, r];
                             onUpdateStrategy(channel.id, { regions });
                           }}
                         >
                           {r}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
