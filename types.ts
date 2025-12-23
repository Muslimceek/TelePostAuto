
export enum ContentTone {
  EMOTIONAL = 'EMOTIONAL',
  AGGRESSIVE = 'AGGRESSIVE',
  LUXURY = 'LUXURY',
  MINIMALIST = 'MINIMALIST',
  ANALYTICAL = 'ANALYTICAL'
}

export enum NicheType {
  DESIGN = 'DESIGN',
  MOVIES = 'MOVIES',
  NEWS = 'NEWS',
}

export type SupportedLanguage = 'en' | 'ru' | 'uz' | 'kg' | 'tj';

export interface ReactionBreakdown {
  fire: number;
  heart: number;
  clap: number;
  star: number;
}

export interface MarketingStrategy {
  tone: ContentTone;
  postingIntensity: number; 
  targetAudience: string;
  focusKeywords: string[];
  regions: string[];
  lastOptimized: number;
  batchSize: number;
  dailyTarget: number;
  scheduleSlots: string[]; // List of HH:mm strings
  language: SupportedLanguage;
}

export interface ChannelProfile {
  id: string;
  name: string;
  telegramToken: string;
  channelId: string;
  niche: NicheType;
  isActive: boolean;
  strategy: MarketingStrategy;
}

export interface MarketingPost {
  id: string;
  timestamp: number;
  scheduledFor?: number;
  suggestedHoursDelay?: number;
  hook: string;
  content: string;
  emotionalTrigger: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
  imageUrl?: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  channelId: string;
  performance?: {
    views: number;
    reactions: number;
    shares: number;
    clicks: number;
    ctr: number;
    reactionBreakdown: ReactionBreakdown;
  };
}

export interface BotConfig {
  telegramToken: string;
  adminId: string;
}
