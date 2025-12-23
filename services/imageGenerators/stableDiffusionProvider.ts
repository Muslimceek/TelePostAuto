import { ImageGenerator } from "../imageGeneratorInterface.ts";

export class StableDiffusionProvider implements ImageGenerator {
  name = "Stable Diffusion";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Поддержка различных Stable Diffusion API провайдеров
    this.apiKey = process.env.STABLE_DIFFUSION_API_KEY || process.env.HUGGINGFACE_API_KEY || "";
    this.baseUrl = process.env.STABLE_DIFFUSION_BASE_URL || "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "undefined" && this.apiKey.length > 10;
  }

  private enhancePrompt(prompt: string, niche: string): string {
    const nicheStyles: Record<string, string> = {
      'DESIGN': 'modern design, minimalist, clean aesthetic, professional, studio lighting, 8k',
      'MOVIES': 'cinematic, dramatic lighting, film photography, professional, high quality',
      'NEWS': 'journalistic photography, clean, professional, balanced composition, sharp focus'
    };

    const style = nicheStyles[niche] || 'professional, high quality, detailed, 8k resolution';
    
    return `${prompt}, ${style}, masterpiece, best quality`;
  }

  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Stable Diffusion API key not configured");
    }

    const enhancedPrompt = this.enhancePrompt(prompt, niche);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            width: 1024,
            height: 1024,
            num_inference_steps: 30,
            guidance_scale: 7.5
          }
        }),
      });

      if (!response.ok) {
        // Hugging Face может вернуть 503 если модель еще загружается
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Model is loading, please wait: ${errorData.estimated_time || 'unknown'} seconds`);
        }
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.error || `Stable Diffusion API error: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const blob = await response.blob();
      
      // Конвертируем blob в base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      console.error("Stable Diffusion generation error:", error);
      throw error;
    }
  }
}

