export interface ImageGenerator {
  name: string;
  generateImage(prompt: string, niche: string, style?: string): Promise<string>;
  isAvailable(): boolean;
}

export class ImageGeneratorRouter {
  private generators: ImageGenerator[] = [];
  private currentGeneratorIndex: number = 0;
  private failedGenerators: Set<string> = new Set();

  constructor(generators: ImageGenerator[]) {
    this.generators = generators.filter(g => g.isAvailable());
    if (this.generators.length === 0) {
      console.warn('[Image Router] No image generators available');
    }
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
      message.includes('limit exceeded')
    );
  }

  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    const initialGenerators = [...this.generators];
    let lastError: any = null;

    // Если нет доступных генераторов, это критическая ошибка
    if (initialGenerators.length === 0) {
      throw new Error('No image generators available');
    }

    for (let attempt = 0; attempt < initialGenerators.length * 2; attempt++) {
      const generator = initialGenerators[this.currentGeneratorIndex];
      
      if (!generator) {
        this.currentGeneratorIndex = (this.currentGeneratorIndex + 1) % initialGenerators.length;
        continue;
      }

      // Пропускаем только если это не бесплатный провайдер и он уже провалился
      // Бесплатные провайдеры (Free Images) всегда пробуем
      if (this.failedGenerators.has(generator.name) && !generator.name.includes('Free')) {
        this.currentGeneratorIndex = (this.currentGeneratorIndex + 1) % initialGenerators.length;
        continue;
      }

      try {
        console.log(`[Image Router] Trying ${generator.name}...`);
        const result = await generator.generateImage(prompt, niche, style);
        console.log(`[Image Router] Success with ${generator.name}`);
        
        // Сбрасываем флаг ошибки при успехе
        this.failedGenerators.delete(generator.name);
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[Image Router] ${generator.name} failed:`, error.message);

        // Для бесплатных провайдеров не добавляем в failed, чтобы можно было повторить
        if (this.isRateLimitError(error) && !generator.name.includes('Free')) {
          console.log(`[Image Router] Rate limit hit on ${generator.name}, switching...`);
          this.failedGenerators.add(generator.name);
        }

        // Переключаемся на следующий генератор
        this.currentGeneratorIndex = (this.currentGeneratorIndex + 1) % initialGenerators.length;
      }
    }

    throw new Error(`All image generators failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  getCurrentGenerator(): string {
    return this.generators[this.currentGeneratorIndex]?.name || 'None';
  }
}

