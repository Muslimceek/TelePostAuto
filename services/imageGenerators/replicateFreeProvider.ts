import { ImageGenerator } from "../imageGeneratorInterface.ts";

/**
 * Провайдер для использования бесплатных публичных API Stable Diffusion
 * Работает без API ключа (может иметь ограничения по скорости/доступности)
 */
export class ReplicateFreeProvider implements ImageGenerator {
  name = "Stable Diffusion Free";
  
  isAvailable(): boolean {
    // Всегда доступен (но может быть медленным или недоступным иногда)
    return true;
  }

  private enhancePrompt(prompt: string, niche: string): string {
    const nicheStyles: Record<string, string> = {
      'DESIGN': 'modern design, minimalist, clean aesthetic, professional',
      'MOVIES': 'cinematic, dramatic, film photography style',
      'NEWS': 'journalistic photography, clean, professional'
    };

    const style = nicheStyles[niche] || 'professional, high quality';
    return `${prompt}, ${style}, 8k, detailed, sharp focus`;
  }

  /**
   * Использует публичный API Replicate через прямые запросы
   * Внимание: Это использует публичные endpoints, которые могут быть ограничены
   */
  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    const enhancedPrompt = this.enhancePrompt(prompt, niche);
    
    try {
      // Используем публичный Stable Diffusion API через различные бесплатные сервисы
      // Вариант 1: Hugging Face Inference API (публичный, но с ограничениями)
      const hfUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
      
      const response = await fetch(hfUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            width: 1024,
            height: 1024,
          }
        }),
      });

      // Если модель еще загружается, пробуем другой вариант
      if (response.status === 503) {
        throw new Error("Model is loading");
      }

      if (response.ok) {
        const blob = await response.blob();
        
        // Конвертируем blob в base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      throw new Error(`HF API returned ${response.status}`);
    } catch (error: any) {
      // Если не удалось, пробрасываем ошибку для fallback
      console.warn('[ReplicateFree] Generation failed:', error.message);
      throw error;
    }
  }
}

