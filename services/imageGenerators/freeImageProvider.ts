import { ImageGenerator } from "../imageGeneratorInterface.ts";

/**
 * Бесплатный провайдер изображений - не требует API ключей
 * Использует бесплатные источники изображений
 */
export class FreeImageProvider implements ImageGenerator {
  name = "Free Images";
  
  isAvailable(): boolean {
    // Всегда доступен, так как не требует API ключа
    return true;
  }

  /**
   * Преобразует промпт в ключевые слова для поиска изображений
   */
  private extractKeywords(prompt: string, niche: string): string {
    // Убираем технические термины и оставляем ключевые слова
    const words = prompt
      .toLowerCase()
      .replace(/high-end|cinematic|professional|studio lighting|photorealistic|8k|high quality|detailed|sharp focus/g, '')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3)
      .join(' ');
    
    // Добавляем ключевые слова из ниши
    const nicheKeywords: Record<string, string> = {
      'DESIGN': 'design',
      'MOVIES': 'cinema',
      'NEWS': 'news'
    };
    
    return (words + ' ' + (nicheKeywords[niche] || '')).trim() || 'abstract';
  }

  /**
   * Генерирует seed на основе промпта для получения стабильного изображения
   */
  private generateSeed(prompt: string): number {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 1000;
  }

  /**
   * Пытается получить изображение из Picsum (Lorem Picsum) - полностью бесплатный сервис
   */
  private getPicsumImage(seed: number): string {
    // Lorem Picsum - полностью бесплатный сервис случайных изображений
    return `https://picsum.photos/seed/${seed}/1024/1024`;
  }

  /**
   * Создает градиентное изображение через Data URI (fallback)
   * Работает только в браузере, для SSR использует Picsum
   */
  private createGradientImage(niche: string, prompt: string): string {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const seed = this.generateSeed(prompt + niche);
      return this.getPicsumImage(seed);
    }

    // Создаем градиент на основе ниши с учетом промпта
    const seed = this.generateSeed(prompt);
    
    // Разные цветовые схемы для разных ниш
    const colorSchemes: Record<string, string[][]> = {
      'DESIGN': [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
      ],
      'MOVIES': [
        ['#fa709a', '#fee140'],
        ['#30cfd0', '#330867'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a9e', '#fecfef'],
      ],
      'NEWS': [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#a8edea', '#fed6e3'],
      ]
    };

    const schemes = colorSchemes[niche] || colorSchemes['DESIGN'];
    const [color1, color2] = schemes[seed % schemes.length];

    // Создаем canvas для генерации изображения
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return this.getPicsumImage(seed);
      }

      // Создаем радиальный градиент для более интересного эффекта
      const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 724);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      // Добавляем декоративные элементы
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 20; i++) {
        const x = (seed + i * 73) % 1024;
        const y = (seed + i * 137) % 1024;
        const radius = (seed + i * 31) % 100 + 40;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Добавляем геометрические формы
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const x = (seed + i * 151) % 1024;
        const y = (seed + i * 211) % 1024;
        const size = (seed + i * 47) % 150 + 50;
        ctx.beginPath();
        ctx.rect(x - size/2, y - size/2, size, size);
        ctx.stroke();
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      // Если canvas недоступен, используем Picsum
      const seed = this.generateSeed(prompt + niche);
      return this.getPicsumImage(seed);
    }
  }

  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    try {
      // Генерируем seed на основе промпта для получения стабильного изображения
      const seed = this.generateSeed(prompt + niche);
      
      // Используем Picsum для получения изображения
      // Это полностью бесплатный сервис без необходимости API ключей
      const imageUrl = this.getPicsumImage(seed);
      
      console.log('[FreeImage] Using Picsum image service');
      return imageUrl;
    } catch (error: any) {
      console.warn('[FreeImage] Error, using gradient fallback:', error);
      // Финальный fallback - градиентное изображение
      return this.createGradientImage(niche, prompt);
    }
  }
}

