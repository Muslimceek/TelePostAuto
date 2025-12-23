import { MarketingPost, MarketingStrategy, NicheType } from "../types.ts";

export interface AIProviderResponse {
  text: string;
  model?: string;
  provider?: string;
}

export interface AIProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string, options?: any): Promise<AIProviderResponse>;
  generateJSON(prompt: string, schema: any, systemInstruction?: string): Promise<any>;
  isAvailable(): boolean;
}

export class AIProviderRouter {
  private providers: AIProvider[] = [];
  private currentProviderIndex: number = 0;
  private failedProviders: Set<string> = new Set();

  constructor(providers: AIProvider[]) {
    this.providers = providers.filter(p => p.isAvailable());
  }

  private isRateLimitError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    const message = error?.message?.toLowerCase() || '';
    
    return (
      status === 429 ||
      status === 403 ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('exhausted') ||
      message.includes('limit exceeded') ||
      message.includes('insufficient quota')
    );
  }

  async generateText(prompt: string, systemInstruction?: string, options?: any): Promise<AIProviderResponse> {
    const initialProviders = [...this.providers];
    let lastError: any = null;

    for (let attempt = 0; attempt < initialProviders.length; attempt++) {
      const provider = initialProviders[this.currentProviderIndex];
      
      if (!provider || this.failedProviders.has(provider.name)) {
        this.currentProviderIndex = (this.currentProviderIndex + 1) % initialProviders.length;
        continue;
      }

      try {
        console.log(`[AI Router] Trying ${provider.name}...`);
        const result = await provider.generateText(prompt, systemInstruction, options);
        console.log(`[AI Router] Success with ${provider.name}`);
        
        // Сбрасываем флаг ошибки при успехе
        this.failedProviders.delete(provider.name);
        
        return { ...result, provider: provider.name };
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI Router] ${provider.name} failed:`, error.message);

        if (this.isRateLimitError(error)) {
          console.log(`[AI Router] Rate limit hit on ${provider.name}, switching to next provider...`);
          this.failedProviders.add(provider.name);
        } else {
          // Для других ошибок тоже пробуем следующий провайдер
          console.log(`[AI Router] Error on ${provider.name}, trying next provider...`);
        }

        // Переключаемся на следующий провайдер
        this.currentProviderIndex = (this.currentProviderIndex + 1) % initialProviders.length;
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async generateJSON(prompt: string, schema: any, systemInstruction?: string): Promise<any> {
    const initialProviders = [...this.providers];
    let lastError: any = null;

    for (let attempt = 0; attempt < initialProviders.length; attempt++) {
      const provider = initialProviders[this.currentProviderIndex];
      
      if (!provider || this.failedProviders.has(provider.name)) {
        this.currentProviderIndex = (this.currentProviderIndex + 1) % initialProviders.length;
        continue;
      }

      try {
        console.log(`[AI Router] Trying ${provider.name} for JSON generation...`);
        const result = await provider.generateJSON(prompt, schema, systemInstruction);
        console.log(`[AI Router] Success with ${provider.name} for JSON`);
        
        this.failedProviders.delete(provider.name);
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AI Router] ${provider.name} JSON generation failed:`, error.message);

        if (this.isRateLimitError(error)) {
          console.log(`[AI Router] Rate limit hit on ${provider.name}, switching...`);
          this.failedProviders.add(provider.name);
        }

        this.currentProviderIndex = (this.currentProviderIndex + 1) % initialProviders.length;
      }
    }

    throw new Error(`All AI providers failed for JSON generation. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  getCurrentProvider(): string {
    return this.providers[this.currentProviderIndex]?.name || 'None';
  }
}

