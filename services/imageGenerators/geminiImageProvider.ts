import { GoogleGenAI } from "@google/genai";
import { ImageGenerator } from "../imageGeneratorInterface.ts";

export class GeminiImageProvider implements ImageGenerator {
  name = "Gemini Image";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "undefined" && this.apiKey.length > 10;
  }

  private enhancePrompt(prompt: string, niche: string): string {
    const nicheStyles: Record<string, string> = {
      'DESIGN': 'High-end cinematic visuals for design brand style',
      'MOVIES': 'Cinematic movie poster style, dramatic composition',
      'NEWS': 'Professional journalism photography, clean and clear'
    };

    const style = nicheStyles[niche] || 'High-end professional visuals';
    
    return `${style}. ${prompt}. Professional studio lighting, photorealistic, 8k, high quality.`;
  }

  async generateImage(prompt: string, niche: string, style?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const enhancedPrompt = this.enhancePrompt(prompt, niche);
    
    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: enhancedPrompt }] },
        config: { 
          imageConfig: { 
            aspectRatio: "1:1"
          } 
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      const base64Data = part?.inlineData?.data;
      
      if (!base64Data) {
        throw new Error("No image data in Gemini response");
      }
      
      return `data:image/png;base64,${base64Data}`;
    } catch (error: any) {
      console.error("Gemini Image generation error:", error);
      throw error;
    }
  }
}

