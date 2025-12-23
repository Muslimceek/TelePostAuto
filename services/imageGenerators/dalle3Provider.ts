import { ImageGenerator } from "../imageGeneratorInterface.ts";

export class Dalle3Provider implements ImageGenerator {
  name = "DALL-E 3";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "undefined" && this.apiKey.length > 10;
  }

  private enhancePrompt(prompt: string, niche: string): string {
    // Улучшаем промпт в зависимости от ниши
    const nicheStyles: Record<string, string> = {
      'DESIGN': 'modern minimalist design, clean aesthetic, professional composition, studio lighting',
      'MOVIES': 'cinematic composition, dramatic lighting, film aesthetic, professional photography',
      'NEWS': 'journalistic style, clean and clear, professional photography, balanced composition'
    };

    const style = nicheStyles[niche] || 'professional, high quality, detailed, sharp focus';
    
    return `${prompt}, ${style}, 8k resolution, high quality, photorealistic, professional photography`;
  }

  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("DALL-E 3 API key not configured");
    }

    const enhancedPrompt = this.enhancePrompt(prompt, niche);
    
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: style || "vivid"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.error?.message || `DALL-E 3 API error: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL in DALL-E 3 response");
      }

      // Конвертируем URL в base64 для единообразия
      return await this.urlToBase64(imageUrl);
    } catch (error: any) {
      console.error("DALL-E 3 generation error:", error);
      throw error;
    }
  }

  private async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // Если не удалось конвертировать, возвращаем URL
      return url;
    }
  }
}

