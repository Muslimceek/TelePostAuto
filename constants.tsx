
import { ContentTone, MarketingStrategy } from './types';

export const INITIAL_STRATEGY: MarketingStrategy = {
  tone: ContentTone.ANALYTICAL,
  postingIntensity: 7,
  targetAudience: 'Global professional audience, marketplace sellers, film enthusiasts.',
  focusKeywords: ['Trends', 'E-commerce', 'Content Strategy'],
  regions: ['Global'],
  lastOptimized: Date.now(),
  batchSize: 1,
  dailyTarget: 3,
  scheduleSlots: ['09:00', '14:00', '20:00'],
  language: 'ru'
};

export const TELEGRAM_BOT_TOKEN = "6077327246:AAELORhd3YEoAt2RJLQKQ9NSrvq88HZ41pY";
export const ADMIN_CHAT_ID = "@designer_pro_muslim";
