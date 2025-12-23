
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentTone, MarketingPost, MarketingStrategy, NicheType } from "../types.ts";
import { AIProviderRouter } from "./aiProviderInterface.ts";
import { GeminiProvider } from "./aiProviders/geminiProvider.ts";
import { DeepSeekProvider } from "./aiProviders/deepSeekProvider.ts";
import { OpenAIProvider } from "./aiProviders/openAIProvider.ts";
import { GroqProvider } from "./aiProviders/groqProvider.ts";
import { ImageGeneratorRouter } from "./imageGeneratorInterface.ts";
import { Dalle3Provider } from "./imageGenerators/dalle3Provider.ts";
import { StableDiffusionProvider } from "./imageGenerators/stableDiffusionProvider.ts";
import { GeminiImageProvider } from "./imageGenerators/geminiImageProvider.ts";
import { FreeImageProvider } from "./imageGenerators/freeImageProvider.ts";
import { ReplicateFreeProvider } from "./imageGenerators/replicateFreeProvider.ts";

export class GeminiMarketingService {
  private router: AIProviderRouter;
  private imageRouter: ImageGeneratorRouter;

  constructor() {
    // Инициализируем роутер со всеми доступными провайдерами
    const providers = [
      new GeminiProvider(),
      new DeepSeekProvider(),
      new OpenAIProvider(),
      new GroqProvider(),
    ];
    
    this.router = new AIProviderRouter(providers);

    // Инициализируем роутер генераторов изображений
    // Приоритет: платные сервисы (если есть ключи), затем бесплатные
    // FreeImageProvider всегда доступен как финальный fallback
    const imageGenerators = [
      new Dalle3Provider(), // Приоритет 1 - лучшее качество (если есть OPENAI_API_KEY)
      new GeminiImageProvider(), // Приоритет 2 (если есть GEMINI_API_KEY)
      new StableDiffusionProvider(), // Приоритет 3 (если есть STABLE_DIFFUSION_API_KEY)
      new ReplicateFreeProvider(), // Бесплатный вариант 1 - Stable Diffusion через HF (может быть медленным)
      new FreeImageProvider(), // Бесплатный вариант 2 - Picsum/Gradient (всегда доступен, не требует ключей)
    ];
    
    this.imageRouter = new ImageGeneratorRouter(imageGenerators);
  }

  private validateKey(): string {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
      throw new Error("КРИТИЧЕСКАЯ ОШИБКА: API_KEY не найден. \n\nДЕЙСТВИЕ: Перейдите в настройки, добавьте хотя бы один API ключ (GEMINI_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY или GROQ_API_KEY).");
    }
    return apiKey;
  }

  async analyzeMarketAndChannel(niche: NicheType, regions: string[], channelId: string): Promise<{text: string, model: string}> {
    const regionStr = regions.join(", ");
    const nicheLabels: Record<NicheType, string> = {
      [NicheType.DESIGN]: 'дизайн и креатив',
      [NicheType.MOVIES]: 'кино и развлечения',
      [NicheType.NEWS]: 'новости и актуальные события'
    };

    const prompt = `Проведи ГЛУБОКИЙ анализ ниши "${nicheLabels[niche] || niche}" для создания вирусного контента.

РЕГИОНЫ: ${regionStr}

Проведи исследование по следующим направлениям:

1. ТРЕНДЫ И ВИРУСНЫЙ КОНТЕНТ:
   - Какие темы сейчас вирусные в этой нише?
   - Какие форматы контента (видео, картинки, тексты) набирают максимальный охват?
   - Какие эмоции и триггеры работают лучше всего?

2. ЦЕЛЕВАЯ АУДИТОРИЯ:
   - Кто основная аудитория в этой нише в регионах ${regionStr}?
   - Какие проблемы и интересы у этой аудитории?
   - Какой язык и стиль общения резонирует с ними?

3. КОНКУРЕНТНЫЙ АНАЛИЗ:
   - Что делают успешные каналы в этой нише?
   - Какие хэштеги и форматы они используют?
   - Что работает, а что нет?

4. АКТУАЛЬНЫЕ СОБЫТИЯ:
   - Какие события и новости сейчас актуальны в этой нише?
   - Как можно их использовать для вирусного контента?
   - Связь с Wildberries, Ozon (если применимо к нише)

5. РЕКОМЕНДАЦИИ ДЛЯ КОНТЕНТА:
   - Конкретные идеи для постов, которые могут стать вирусными
   - Лучшее время для публикаций
   - Рекомендуемые визуальные стили

Важно: Весь ответ должен быть строго на РУССКОМ языке. Дай детальный анализ минимум на 500-700 слов.`;

    const systemInstruction = `Ты — топовый эксперт по вирусному маркетингу и аналитик трендов с 15+ годами опыта. 
Твоя задача — провести глубокий анализ ниши и выдать конкретные, действенные инсайты для создания вирусного контента.
Ты знаешь все о трендах в социальных сетях, понимаешь психологию аудитории и можешь предсказывать вирусный потенциал контента.
Используй актуальные данные и конкретные примеры.
Весь ответ должен быть СТРОГО на русском языке. Использование английского допускается только для технических терминов или промптов для генерации изображений.`;

    try {
      // Пытаемся использовать Gemini с поиском, если доступен
      const geminiProvider = new GeminiProvider();
      if (geminiProvider.isAvailable()) {
        try {
          const result = await geminiProvider.generateText(prompt, systemInstruction, {
            tools: [{ googleSearch: {} }]
          });
          return {
            text: result.text || "Анализ завершен.",
            model: result.model || "gemini"
          };
        } catch (e: any) {
          // Если Gemini с поиском не сработал, используем роутер
          console.log("[Service] Gemini with search failed, using router...");
        }
      }
    } catch (e) {
      // Продолжаем с роутером
    }

    // Используем роутер для fallback
    const result = await this.router.generateText(prompt, systemInstruction);

    return {
      text: result.text || "Анализ завершен.",
      model: result.model || result.provider || "unknown"
    };
  }

  async generateHighCtrPost(niche: NicheType, strategy: MarketingStrategy, marketInsights: string): Promise<MarketingPost> {
    const prompt = `На основе этих данных: ${marketInsights}. 
    Создай виральный пост для Telegram канала @designer_pro_muslim.
    Ниша: ${niche}.
    Тон: ${strategy.tone}.
    
    ТРЕБОВАНИЕ: Весь текстовый контент должен быть на РУССКОМ языке. Используй кириллицу.`;

    const systemInstruction = "Ты пишешь контент для русскоязычного Telegram канала. Твоя цель — максимальный охват и вовлечение. Пиши только на русском языке. Структурируй ответ в формате JSON.";

    const schema = {
      type: "object",
      properties: {
        hook: { type: "string", description: "Цепляющий заголовок на РУССКОМ языке" },
        content: { type: "string", description: "Основной текст поста на РУССКОМ языке" },
        emotionalTrigger: { type: "string", description: "Эмоциональный триггер на РУССКОМ языке" },
        cta: { type: "string", description: "Призыв к действию на РУССКОМ языке" },
        hashtags: { type: "array", items: { type: "string" }, description: "Хэштеги на русском или английском" },
        imagePrompt: { type: "string", description: "Промпт для генерации картинки (на английском для лучшего результата)" },
        suggestedHoursDelay: { type: "number", description: "Рекомендуемая задержка в часах" }
      },
      required: ["hook", "content", "emotionalTrigger", "cta", "hashtags", "imagePrompt", "suggestedHoursDelay"]
    };

    // Пытаемся использовать Gemini с JSON schema, если доступен
    let data: any;
    const geminiProvider = new GeminiProvider();
    
    if (geminiProvider.isAvailable()) {
      try {
        // Используем Gemini с нативной поддержкой JSON schema
        const geminiSchema = {
          type: Type.OBJECT,
          properties: {
            hook: { type: Type.STRING, description: "Цепляющий заголовок на РУССКОМ языке" },
            content: { type: Type.STRING, description: "Основной текст поста на РУССКОМ языке" },
            emotionalTrigger: { type: Type.STRING, description: "Эмоциональный триггер на РУССКОМ языке" },
            cta: { type: Type.STRING, description: "Призыв к действию на РУССКОМ языке" },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Хэштеги на русском или английском" },
            imagePrompt: { type: Type.STRING, description: "Промпт для генерации картинки (на английском для лучшего результата)" },
            suggestedHoursDelay: { type: Type.NUMBER, description: "Рекомендуемая задержка в часах" }
          },
          required: ["hook", "content", "emotionalTrigger", "cta", "hashtags", "imagePrompt", "suggestedHoursDelay"]
        };
        
        data = await geminiProvider.generateJSON(prompt, geminiSchema, systemInstruction);
      } catch (e: any) {
        console.log("[Service] Gemini JSON generation failed, using router...");
        // Fallback на роутер
        data = await this.router.generateJSON(prompt, schema, systemInstruction);
      }
    } else {
      // Используем роутер
      data = await this.router.generateJSON(prompt, schema, systemInstruction);
    }
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      scheduledFor: Date.now() + ((data.suggestedHoursDelay || 0) * 3600000),
      channelId: "", 
      ...data,
      status: 'draft',
      performance: {
        views: 0, reactions: 0, shares: 0, clicks: 0, ctr: 0,
        reactionBreakdown: { fire: 0, heart: 0, clap: 0, star: 0 }
      }
    };
  }

  async generateImage(prompt: string, niche: NicheType): Promise<string> {
    try {
      // Используем роутер для автоматического выбора лучшего генератора изображений
      const imageUrl = await this.imageRouter.generateImage(prompt, niche.toString());
      return imageUrl;
    } catch (e: any) {
      console.error("Image generation error:", e.message);
      throw e;
    }
  }

  getCurrentProvider(): string {
    return this.router.getCurrentProvider();
  }

  getCurrentImageGenerator(): string {
    return this.imageRouter.getCurrentGenerator();
  }
}
