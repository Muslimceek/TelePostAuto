import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MarketingPost, SupportedLanguage } from '../types';
import { useI18n } from '../services/i18n';

interface ContentPlannerProps {
  posts: MarketingPost[];
  onGenerate: (count: number) => void;
  onPost: (post: MarketingPost) => void;
  onUpdateSchedule: (postId: string, date: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: MarketingPost) => void;
  onDuplicate?: (post: MarketingPost) => void;
  isLoading: boolean;
  language: SupportedLanguage;
}

type ViewMode = 'list' | 'grid' | 'calendar';
type SortBy = 'date' | 'status' | 'performance' | 'scheduled';
type FilterStatus = 'all' | 'draft' | 'scheduled' | 'posted' | 'failed';

export const ContentPlanner: React.FC<ContentPlannerProps> = ({ 
  posts, 
  onGenerate, 
  onPost, 
  onUpdateSchedule,
  onDelete,
  onEdit,
  onDuplicate,
  isLoading, 
  language 
}) => {
  const t = useI18n(language);
  const [genCount, setGenCount] = useState(1);
  const [targetTime, setTargetTime] = useState("12:00");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<MarketingPost | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = posts.length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const posted = posts.filter(p => p.status === 'posted').length;
    const failed = posts.filter(p => p.status === 'failed').length;
    const avgPerformance = posted > 0 
      ? posts.filter(p => p.status === 'posted' && p.performance)
        .reduce((acc, p) => acc + (p.performance?.ctr || 0), 0) / posted
      : 0;
    
    return { total, drafts, scheduled, posted, failed, avgPerformance };
  }, [posts]);

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.hook.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.hashtags.some(h => h.toLowerCase().includes(query)) ||
        p.cta.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'status':
          const statusOrder = { 'draft': 0, 'scheduled': 1, 'posted': 2, 'failed': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'performance':
          const perfA = a.performance?.ctr || 0;
          const perfB = b.performance?.ctr || 0;
          return perfB - perfA;
        case 'scheduled':
          const schedA = a.scheduledFor || 0;
          const schedB = b.scheduledFor || 0;
          return schedA - schedB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [posts, filterStatus, searchQuery, sortBy]);

  // Toggle post selection
  const toggleSelection = (postId: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Select all visible posts
  const selectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (onDelete && selectedPosts.size > 0 && confirm(`Удалить ${selectedPosts.size} постов?`)) {
      selectedPosts.forEach(id => onDelete(id));
      setSelectedPosts(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkSchedule = () => {
    if (selectedPosts.size > 0) {
      const dateTime = new Date();
      dateTime.setHours(parseInt(targetTime.split(':')[0]), parseInt(targetTime.split(':')[1]));
      selectedPosts.forEach(id => {
        const post = posts.find(p => p.id === id);
        if (post) {
          onUpdateSchedule(id, dateTime.toISOString());
        }
      });
      setSelectedPosts(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkPost = () => {
    if (selectedPosts.size > 0) {
      selectedPosts.forEach(id => {
        const post = posts.find(p => p.id === id);
        if (post && post.status !== 'posted') {
          onPost(post);
        }
      });
      setSelectedPosts(new Set());
      setShowBulkActions(false);
    }
  };

  return (
    <div className="safe-area-padding min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#151520] pb-24">
      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
        {selectedPosts.size > 0 && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <button
              onClick={handleBulkPost}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center micro-bounce"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleBulkSchedule}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center micro-bounce"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {onDelete && (
              <button
                onClick={handleBulkDelete}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 flex items-center justify-center micro-bounce"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <button
          onClick={() => onGenerate(1)}
          disabled={isLoading}
          className="w-16 h-16 rounded-3xl bg-gradient-to-r from-[#8b6f47] via-[#d4a574] to-[#a6895f] shadow-2xl shadow-[#8b6f47]/50 flex items-center justify-center micro-bounce"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-4 space-y-5 pt-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Планировщик</h1>
            <p className="text-sm text-white/50 mt-1">Постов: {posts.length}</p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>

        {/* STATISTICS - Horizontal Scroll */}
        {showStats && (
          <div className="overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              <div className="glass-card rounded-2xl p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-xs text-white/50">Всего</div>
              </div>
              <div className="glass-card rounded-2xl p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-[#d4a574] mb-1">{stats.drafts}</div>
                <div className="text-xs text-white/50">Черновики</div>
              </div>
              <div className="glass-card rounded-2xl p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.scheduled}</div>
                <div className="text-xs text-white/50">Запланировано</div>
              </div>
              <div className="glass-card rounded-2xl p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.posted}</div>
                <div className="text-xs text-white/50">Опубликовано</div>
              </div>
              <div className="glass-card rounded-2xl p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-[#d4a574] mb-1">{stats.avgPerformance.toFixed(1)}%</div>
                <div className="text-xs text-white/50">Ср. CTR</div>
              </div>
            </div>
          </div>
        )}

        {/* GENERATION PANEL */}
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">Количество</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  value={genCount} 
                  onChange={(e) => setGenCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-base font-medium text-white outline-none focus:border-[#8b6f47]/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">Время публикации</label>
              <input 
                type="time"
                value={targetTime} 
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-base font-medium text-white outline-none focus:border-[#8b6f47]/50"
              />
            </div>
          </div>
          
          <button 
            onClick={() => onGenerate(genCount)}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-[#8b6f47] to-[#d4a574] rounded-2xl text-white font-semibold flex items-center justify-center gap-2 micro-bounce disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Генерация...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Создать контент</span>
              </>
            )}
          </button>
        </div>

        {/* FILTERS BAR */}
        <div className="glass-card rounded-2xl p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск постов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pl-12 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#8b6f47]/50"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filters - Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 min-w-0">
              {(['all', 'draft', 'scheduled', 'posted'] as FilterStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap micro-bounce ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] text-white'
                      : 'bg-white/5 text-white/70'
                  }`}
                >
                  {status === 'all' ? 'Все' : status === 'draft' ? 'Черновики' : status === 'scheduled' ? 'Планы' : 'Опубликовано'}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] text-white' : 'text-white/60'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  viewMode === 'grid' ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] text-white' : 'text-white/60'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sort and Selection */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-medium text-white outline-none"
            >
              <option value="date">По дате</option>
              <option value="status">По статусу</option>
              <option value="performance">По CTR</option>
              <option value="scheduled">По расписанию</option>
            </select>
            
            {filteredPosts.length > 0 && (
              <button
                onClick={selectAll}
                className="px-4 h-10 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white whitespace-nowrap"
              >
                {selectedPosts.size === filteredPosts.length ? 'Снять все' : 'Выбрать все'}
              </button>
            )}
          </div>
        </div>

        {/* POSTS LIST/GRID */}
        {filteredPosts.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/50">
              {searchQuery ? 'Ничего не найдено' : 'Начните с генерации контента'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                isSelected={selectedPosts.has(post.id)}
                isExpanded={expandedPost === post.id}
                onSelect={() => toggleSelection(post.id)}
                onExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                onPost={() => onPost(post)}
                onSchedule={(date) => onUpdateSchedule(post.id, date)}
                onDelete={onDelete ? () => onDelete(post.id) : undefined}
                onEdit={onEdit ? () => onEdit(post) : undefined}
                onDuplicate={onDuplicate ? () => onDuplicate(post) : undefined}
                onPreview={() => setShowPreview(post)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={() => setShowPreview(null)}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="text-white font-medium">Превью поста</div>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {showPreview.imageUrl && (
              <div className="rounded-2xl overflow-hidden mb-4">
                <img src={showPreview.imageUrl} alt="Preview" className="w-full h-auto" />
              </div>
            )}
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">{showPreview.hook}</h2>
              <p className="text-white/80 leading-relaxed">{showPreview.content}</p>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 italic text-sm">{showPreview.emotionalTrigger}</p>
              </div>
              <div className="bg-gradient-to-r from-[#8b6f47]/20 to-[#d4a574]/20 rounded-xl p-4">
                <p className="text-white font-medium">{showPreview.cta}</p>
              </div>
              {showPreview.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {showPreview.hashtags.map((tag, i) => (
                    <span key={i} className="px-3 py-2 bg-white/10 rounded-lg text-sm text-white/80">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Post Card Component - Mobile Optimized
interface PostCardProps {
  post: MarketingPost;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onPost: () => void;
  onSchedule: (date: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onPreview: () => void;
  viewMode: ViewMode;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  index,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onPost,
  onSchedule,
  onDelete,
  onEdit,
  onDuplicate,
  onPreview,
  viewMode
}) => {
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-emerald-500/20 text-emerald-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'failed': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-[#8b6f47]/20 text-[#d4a574]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'posted': return '✓ Опубликовано';
      case 'scheduled': return '⏰ Запланировано';
      case 'failed': return '✗ Ошибка';
      default: return '📝 Черновик';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <div 
        className={`glass-card rounded-2xl overflow-hidden relative ${
          isSelected ? 'ring-2 ring-[#8b6f47]' : ''
        }`}
      >
        {/* Selection */}
        <button
          onClick={onSelect}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border flex items-center justify-center ${
            isSelected
              ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] border-[#8b6f47]'
              : 'bg-black/50 border-white/30'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Image */}
        {post.imageUrl ? (
          <div className="aspect-square relative overflow-hidden">
            <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
              <h4 className="text-white text-sm font-semibold line-clamp-2">{post.hook}</h4>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-[#8b6f47]/10 to-[#d4a574]/10 flex items-center justify-center p-4">
            <h4 className="text-white text-sm font-semibold text-center line-clamp-3">{post.hook}</h4>
          </div>
        )}

        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-1 rounded-lg ${getStatusColor(post.status)}`}>
              {getStatusLabel(post.status)}
            </span>
            <span className="text-[10px] text-white/50">
              {new Date(post.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          
          <button
            onClick={onPost}
            className="w-full py-2 bg-gradient-to-r from-[#8b6f47] to-[#d4a574] rounded-lg text-xs font-medium text-white"
          >
            Опубликовать
          </button>
        </div>
      </div>
    );
  }

  // List view layout
  return (
    <div 
      className={`glass-card rounded-2xl overflow-hidden relative ${
        isSelected ? 'ring-2 ring-[#8b6f47]' : ''
      }`}
    >
      {/* Selection */}
      <button
        onClick={onSelect}
        className={`absolute top-4 left-4 z-10 w-6 h-6 rounded-lg border flex items-center justify-center ${
          isSelected
            ? 'bg-gradient-to-r from-[#8b6f47] to-[#d4a574] border-[#8b6f47]'
            : 'bg-white/10 border-white/30'
        }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {post.imageUrl && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-2">{post.hook}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-1 rounded-lg ${getStatusColor(post.status)}`}>
                {getStatusLabel(post.status)}
              </span>
              {post.scheduledFor && (
                <span className="text-[10px] text-white/50">
                  {formatDate(post.scheduledFor)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <p className={`text-white/70 text-sm mb-3 ${!isExpanded && 'line-clamp-2'}`}>
          {post.content}
        </p>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-3 mb-3 border-t border-white/10 pt-3">
            {post.performance && (
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-white font-bold text-sm">{post.performance.views}</div>
                  <div className="text-[10px] text-white/50">Просмотры</div>
                </div>
                <div className="text-center">
                  <div className="text-[#d4a574] font-bold text-sm">{post.performance.reactions}</div>
                  <div className="text-[10px] text-white/50">Реакции</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold text-sm">{post.performance.shares}</div>
                  <div className="text-[10px] text-white/50">Репосты</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 font-bold text-sm">{post.performance.ctr.toFixed(1)}%</div>
                  <div className="text-[10px] text-white/50">CTR</div>
                </div>
              </div>
            )}
            
            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3">
          {post.status !== 'posted' && (
            <>
              <button
                onClick={onPost}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#8b6f47] to-[#d4a574] rounded-lg text-xs font-medium text-white"
              >
                Опубликовать
              </button>
              
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(12, 0, 0, 0);
                  onSchedule(tomorrow.toISOString());
                }}
                className="flex-1 py-2.5 bg-white/10 rounded-lg text-xs font-medium text-white"
              >
                Запланировать
              </button>
            </>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
            {onEdit && (
              <button
                onClick={onEdit}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onExpand}
              className="text-xs text-white/50 hover:text-white/70"
            >
              {isExpanded ? 'Свернуть' : 'Подробнее'}
            </button>
            
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Удалить этот пост?')) onDelete();
                }}
                className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};