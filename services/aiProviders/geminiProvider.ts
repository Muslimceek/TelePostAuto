import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIProvider, AIProviderResponse } from "../aiProviderInterface.ts";

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private apiKey: string;
  private readonly MODELS_TEXT = [
    'gemini-3-pro-preview', 
    'gemini-3-flash-preview', 
    'gemini-flash-lite-latest'
  ];

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "undefined" && this.apiKey.length > 10;
  }

  private async callWithCascade(modelList: string[], contents: any, config: any = {}): Promise<{ response: GenerateContentResponse, modelUsed: string }> {
    let lastError: any;

    for (const modelName of modelList) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        console.log(`[Gemini] Attempting ${modelName}...`);
        
        const parts = typeof contents === 'string' ? [{ text: contents }] : (contents.parts || contents);
        
        const activeConfig = { ...config };
        if (modelName.includes('lite') && activeConfig.tools) {
          delete activeConfig.tools; 
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: {
            ...activeConfig,
            thinkingConfig: modelName.includes('pro') ? { thinkingBudget: 4000 } : undefined
          }
        });
        
        if (!response || !response.text) {
          throw new Error(`Empty response from ${modelName}`);
        }

        return { response, modelUsed: modelName };
      } catch (error: any) {
        lastError = error;
        console.warn(`[Gemini] ${modelName} failed:`, error.message);
        
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('exhausted') || error?.status >= 500) {
          console.log(`[Gemini] Stepping down the ladder...`);
          continue; 
        }
        throw error;
      }
    }
    throw lastError;
  }

  async generateText(prompt: string, systemInstruction?: string, options?: any): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (options?.tools) {
      config.tools = options.tools;
    }

    const { response, modelUsed } = await this.callWithCascade(this.MODELS_TEXT, prompt, config);

    return {
      text: response.text || "",
      model: modelUsed,
      provider: "Gemini",
    };
  }

  async generateJSON(prompt: string, schema: any, systemInstruction?: string): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key not configured");
    }

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: schema,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const { response } = await this.callWithCascade(this.MODELS_TEXT, prompt, config);
    
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      throw new Error(`Failed to parse JSON response from Gemini: ${e}`);
    }
  }
}

