
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MobileHeader } from './components/MobileHeader.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ContentPlanner } from './components/ContentPlanner.tsx';
import { StrategyPanel } from './components/StrategyPanel.tsx';
import { Onboarding } from './components/Onboarding.tsx';
import { MarketingPost, MarketingStrategy, ChannelProfile, NicheType, SupportedLanguage } from './types.ts';
import { INITIAL_STRATEGY, TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID } from './constants.tsx';
import { GeminiMarketingService } from './services/geminiService.ts';
import { TelegramBotService } from './services/telegramService.ts';
import { useI18n } from './services/i18n.ts';

// Custom Cursor Component (Desktop only)
const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if device has mouse (desktop)
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    setIsDesktop(hasMouse);

    if (!hasMouse) return; // Don't show cursor on touch devices

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current && dotRef.current) {
        cursorRef.current.style.left = `${e.clientX - 10}px`;
        cursorRef.current.style.top = `${e.clientY - 10}px`;
        dotRef.current.style.left = `${e.clientX - 2}px`;
        dotRef.current.style.top = `${e.clientY - 2}px`;
      }
    };

    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'scale(1.5)';
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.transform = 'scale(1)';
    };

    window.addEventListener('mousemove', moveCursor);
    const interactiveElements = document.querySelectorAll('button, a, input, select');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
};

const STORAGE_KEY = 'aether_os18_v1';
const ONBOARDING_KEY = 'muslim_poster_onboarding_completed';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'strategy'>('dashboard');
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
     const saved = localStorage.getItem(STORAGE_KEY);
     return saved ? JSON.parse(saved).language : 'ru';
  });
  
  const [channels, setChannels] = useState<ChannelProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).channels : [
      {
        id: 'primary',
        name: 'Aether Core One',
        telegramToken: TELEGRAM_BOT_TOKEN,
        channelId: ADMIN_CHAT_ID,
        niche: NicheType.NEWS,
        isActive: true,
        strategy: INITIAL_STRATEGY
      }
    ];
  });
  
  const [posts, setPosts] = useState<MarketingPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).posts : [];
  });

  const [isAutoMode, setIsAutoMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).isAutoMode : false;
  });

  const [activeChannelId, setActiveChannelId] = useState('primary');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [currentBrain, setCurrentBrain] = useState('Standby');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    return completed !== 'true';
  });

  const gemini = useRef(new GeminiMarketingService());
  const schedulerRef = useRef<number | null>(null);
  const t = useI18n(language);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      channels,
      posts,
      isAutoMode,
      language
    }));
  }, [channels, posts, isAutoMode, language]);

  const addLog = (msg: string) => {
    setActivityLog(prev => [`${msg}`, ...prev].slice(0, 50));
  };

  const getBrainLabel = (modelName: string) => {
    // Проверяем провайдера
    if (modelName.toLowerCase().includes('gemini')) {
      if (modelName.includes('pro')) return 'Gemini Prime Core';
      if (modelName.includes('lite')) return 'Gemini Eco Synapse';
      if (modelName.includes('flash')) return 'Gemini Neural Matrix';
      return 'Gemini Active Neural';
    }
    if (modelName.toLowerCase().includes('deepseek')) return 'DeepSeek Neural';
    if (modelName.toLowerCase().includes('gpt') || modelName.toLowerCase().includes('openai')) return 'OpenAI Core';
    if (modelName.toLowerCase().includes('groq') || modelName.toLowerCase().includes('llama')) return 'Groq Neural';
    
    // Старые проверки для обратной совместимости
    if (modelName.includes('pro')) return 'Prime Core';
    if (modelName.includes('lite')) return 'Eco Synapse';
    if (modelName.includes('flash')) return 'Neural Matrix';
    return modelName || 'Active Neural';
  };

  const handleGeneratePost = useCallback(async (count = 1, isAuto = false) => {
    if (!activeChannel) return;
    if (!isAuto) setIsLoading(true);
    
    try {
      setLoadingStage(t.brain_status + ': Grounding...');
      addLog(`[System] Initializing Neural Routing...`);
      
      const analysis = await gemini.current.analyzeMarketAndChannel(
        activeChannel.niche, 
        activeChannel.strategy.regions, 
        activeChannel.channelId
      );
      
      const brainName = getBrainLabel(analysis.model);
      setCurrentBrain(brainName);
      const providerInfo = analysis.model.includes('Gemini') ? 'Gemini' : 
                           analysis.model.includes('DeepSeek') ? 'DeepSeek' :
                           analysis.model.includes('gpt') || analysis.model.includes('OpenAI') ? 'OpenAI' :
                           analysis.model.includes('Groq') || analysis.model.includes('llama') ? 'Groq' : analysis.model;
      addLog(`[AI] Routed to ${brainName} (${providerInfo}). Market analysis complete.`);
      
      for (let i = 0; i < count; i++) {
        setLoadingStage(`${t.generate}: ${i + 1}/${count}`);
        
        const newPost = await gemini.current.generateHighCtrPost(
          activeChannel.niche, 
          activeChannel.strategy, 
          analysis.text
        );
        newPost.channelId = activeChannel.id;

        try {
          const imageGenerator = gemini.current.getCurrentImageGenerator();
          addLog(`[Visual] Rendering with ${imageGenerator} for segment ${i + 1}...`);
          newPost.imageUrl = await gemini.current.generateImage(newPost.imagePrompt, activeChannel.niche);
          addLog(`[Visual] ✓ Image generated successfully with ${imageGenerator}`);
        } catch (e: any) {
          addLog(`[Visual] ⚠ Image generation failed: ${e.message}. Using text-only deployment.`);
        }

        setPosts(prev => [newPost, ...prev]);
        addLog(`[Genesis] Post generated: "${newPost.hook.slice(0, 30)}..."`);
        
        if (isAuto) {
           await handlePostToTelegram(newPost);
        }

        if (i < count - 1) await new Promise(r => setTimeout(r, 1500));
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || 'Unknown failure';
      addLog(`SYSTEM ALERT: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  }, [activeChannel, language, t]);

  const handlePostToTelegram = async (post: MarketingPost) => {
    const channel = channels.find(c => c.id === post.channelId);
    if (!channel) return;

    addLog(`[Deploy] Transmitting to Telegram Node...`);
    const telegram = new TelegramBotService({ telegramToken: channel.telegramToken, adminId: channel.channelId });
    
    const result = await telegram.postToChannel(post);
    if (result.success) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'posted' } : p));
      addLog(`[Deploy] SUCCESS: Data packet received by channel.`);
    } else {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'failed' } : p));
      addLog(`[Deploy] FAILURE: ${result.error}`);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    addLog(`[System] Post deleted: ${postId.slice(0, 8)}...`);
  };

  const handleEditPost = (post: MarketingPost) => {
    // For now, just log. Can be extended with edit modal
    addLog(`[System] Edit post: ${post.hook.slice(0, 30)}...`);
    // TODO: Implement edit modal
  };

  const handleDuplicatePost = (post: MarketingPost) => {
    const newPost: MarketingPost = {
      ...post,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'draft',
      scheduledFor: undefined,
      performance: undefined
    };
    setPosts(prev => [newPost, ...prev]);
    addLog(`[System] Post duplicated: ${post.hook.slice(0, 30)}...`);
  };

  useEffect(() => {
    if (isAutoMode) {
      const checkSchedule = () => {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        channels.forEach(chan => {
          if (chan.isActive && chan.strategy.scheduleSlots?.includes(currentTime)) {
             addLog(`[Scheduler] Match found for ${currentTime}. Triggering autopilot.`);
             handleGeneratePost(1, true);
          }
        });
      };
      schedulerRef.current = window.setInterval(checkSchedule, 60000);
    } else if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
    }
    return () => { if (schedulerRef.current) clearInterval(schedulerRef.current); };
  }, [isAutoMode, handleGeneratePost, channels]);

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} language={language} />;
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-[#0a0a0f] flex flex-col relative selection:bg-[#8b6f47]/50 overflow-hidden particle-bg retro-scan-lines">
      <CustomCursor />
      <MobileHeader title="Muslim Poster" currentBrain={currentBrain} isAutoMode={isAutoMode} />

      {isLoading && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-[80px] flex flex-col items-center justify-center p-12 text-center animate-fade-in retro-scan">
           <div className="relative w-40 h-40 mb-12 animate-float">
              {/* Aurora Glow Effect - Mocha Mousse */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#8b6f47] via-[#d4a574] to-[#6f4e37] rounded-full blur-3xl opacity-40 animate-aurora" />
              
              {/* Outer Ring */}
              <div className="absolute inset-0 border-[8px] border-[#8b6f47]/30 rounded-full" />
              
              {/* Spinning Ring */}
              <div className="absolute inset-0 border-[8px] border-transparent border-t-[#8b6f47] border-r-[#d4a574] rounded-full animate-spin shadow-[0_0_60px_rgba(139,111,71,0.6)]" style={{ animationDuration: '1.5s' }} />
              
              {/* Inner Glow */}
              <div className="absolute inset-8 bg-gradient-to-br from-[#8b6f47]/50 to-[#d4a574]/50 rounded-full animate-pulse blur-2xl" />
              
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-[#d4a574] animate-pulse drop-shadow-[0_0_20px_rgba(139,111,71,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
           </div>
           <h2 className="text-5xl font-black gradient-text mb-6 tracking-tight text-3d macro-text">{loadingStage}</h2>
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#8b6f47] animate-pulse shadow-[0_0_10px_rgba(139,111,71,0.8)]" />
             <p className="text-[#d4a574] text-[13px] uppercase font-bold tracking-[0.4em] retro-glow">Neural Synchronization</p>
             <div className="w-2 h-2 rounded-full bg-[#d4a574] animate-pulse shadow-[0_0_10px_rgba(212,165,116,0.8)]" style={{ animationDelay: '0.2s' }} />
           </div>
        </div>
      )}

      {/* Autopilot Toggle - Enhanced */}
      <div className="px-6 py-4 border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between glass-card-elevated px-6 py-5 rounded-[2rem] card-3d micro-bounce">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isAutoMode 
                ? 'bg-gradient-to-br from-[#8b6f47]/30 to-[#d4a574]/20 border border-[#8b6f47]/40 shadow-lg shadow-[#8b6f47]/20' 
                : 'bg-white/5 border border-white/10'
            }`}>
              <svg className={`w-6 h-6 transition-all duration-300 ${isAutoMode ? 'text-[#d4a574] animate-pulse' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-black text-white mb-1">{isAutoMode ? t.autopilot_on : t.autopilot_off}</p>
              <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">{isAutoMode ? 'Автоматическая публикация активна' : 'Ручной режим'}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-500 micro-bounce ${
              isAutoMode 
                ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] shadow-xl shadow-[#8b6f47]/40' 
                : 'bg-white/10 border border-white/20'
            }`}
          >
            <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-xl transition-all duration-500 ${
              isAutoMode 
                ? 'translate-x-8 scale-110' 
                : 'translate-x-1 scale-100'
            }`} />
            {isAutoMode && (
              <div className="absolute inset-0 rounded-full bg-[#8b6f47]/30 animate-ping" style={{ animationDuration: '2s' }} />
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-32 scroll-smooth safe-bottom">
        {activeTab === 'dashboard' && <Dashboard posts={posts} activityLog={activityLog} isAutoMode={isAutoMode} language={language} />}
        {activeTab === 'content' && (
          <ContentPlanner 
            posts={posts.filter(p => p.channelId === activeChannelId || p.channelId === "")} 
            onGenerate={(count) => handleGeneratePost(count, false)} 
            onPost={handlePostToTelegram}
            onUpdateSchedule={(id, d) => setPosts(prev => prev.map(p => p.id === id ? {...p, scheduledFor: new Date(d).getTime(), status: 'scheduled'} : p))}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
            onDuplicate={handleDuplicatePost}
            isLoading={isLoading}
            language={language}
          />
        )}
        {activeTab === 'strategy' && (
          <StrategyPanel 
            channels={channels} 
            activeChannelId={activeChannelId}
            currentLanguage={language}
            onSetLanguage={setLanguage}
            onAddChannel={(c) => {
              const newChan: ChannelProfile = {
                id: Math.random().toString(36).substr(2, 9),
                name: c.name || 'Agent-X',
                telegramToken: c.telegramToken || '',
                channelId: c.channelId || '',
                niche: c.niche || NicheType.DESIGN,
                isActive: true,
                strategy: { ...INITIAL_STRATEGY, language }
              };
              setChannels(prev => [...prev, newChan]);
              setActiveChannelId(newChan.id);
            }}
            onRemoveChannel={(id) => setChannels(prev => prev.filter(c => c.id !== id))}
            onSetActive={setActiveChannelId}
            onUpdateStrategy={(id, upd) => setChannels(prev => prev.map(c => c.id === id ? {...c, strategy: {...c.strategy, ...upd}} : c))}
          />
        )}
      </main>

      {/* Enhanced Nav Bar with 3D Effects */}
      <nav className="absolute bottom-0 left-0 right-0 safe-bottom pb-6 px-6 z-[150]">
        <div className="glass-card-elevated max-w-md mx-auto rounded-[2.5rem] px-6 py-5 flex justify-around items-center shadow-2xl border border-white/20">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center gap-2.5 transition-all duration-500 ios-btn-active micro-bounce ${
              activeTab === 'dashboard' 
                ? 'text-[#d4a574] scale-110' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-br from-[#8b6f47]/30 to-[#d4a574]/20 scale-110 border border-[#8b6f47]/40 shadow-lg shadow-[#8b6f47]/20' 
                : 'bg-transparent'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              {activeTab === 'dashboard' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8b6f47] rounded-full animate-pulse shadow-lg shadow-[#8b6f47]/50" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{t.dashboard}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('content')} 
            className={`flex flex-col items-center gap-2.5 transition-all duration-500 ios-btn-active micro-bounce ${
              activeTab === 'content' 
                ? 'text-[#d4a574] scale-110' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
              activeTab === 'content' 
                ? 'bg-gradient-to-br from-[#8b6f47]/30 to-[#d4a574]/20 scale-110 border border-[#8b6f47]/40 shadow-lg shadow-[#8b6f47]/20' 
                : 'bg-transparent'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {activeTab === 'content' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8b6f47] rounded-full animate-pulse shadow-lg shadow-[#8b6f47]/50" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{t.queue}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('strategy')} 
            className={`flex flex-col items-center gap-2.5 transition-all duration-500 ios-btn-active micro-bounce ${
              activeTab === 'strategy' 
                ? 'text-[#d4a574] scale-110' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
              activeTab === 'strategy' 
                ? 'bg-gradient-to-br from-[#8b6f47]/30 to-[#d4a574]/20 scale-110 border border-[#8b6f47]/40 shadow-lg shadow-[#8b6f47]/20' 
                : 'bg-transparent'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {activeTab === 'strategy' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8b6f47] rounded-full animate-pulse shadow-lg shadow-[#8b6f47]/50" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{t.agents}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
