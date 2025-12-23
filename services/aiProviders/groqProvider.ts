import { AIProvider, AIProviderResponse } from "../aiProviderInterface.ts";

export class GroqProvider implements AIProvider {
  name = "Groq";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== "undefined" && this.apiKey.length > 10;
  }

  async generateText(prompt: string, systemInstruction?: string, options?: any): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw new Error("Groq API key not configured");
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || "llama-3.1-8b-instant",
        messages: messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: any = new Error(errorData.error?.message || `Groq API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty response from Groq");
    }

    return {
      text,
      model: data.model || "llama-3.1-8b-instant",
      provider: "Groq",
    };
  }

  async generateJSON(prompt: string, schema: any, systemInstruction?: string): Promise<any> {
    const enhancedPrompt = `${prompt}\n\nВерни ответ строго в формате JSON согласно следующей схеме: ${JSON.stringify(schema, null, 2)}`;
    
    const response = await this.generateText(enhancedPrompt, systemInstruction, {
      temperature: 0.3,
    });

    try {
      let jsonStr = response.text.trim();
      
      // Убираем markdown code blocks если есть
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Пытаемся найти JSON объект в тексте
      const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonStr = jsonObjectMatch[0];
      }

      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse JSON from Groq, trying to fix...");
      try {
        return JSON.parse(response.text);
      } catch (e2) {
        throw new Error(`Failed to parse JSON response from Groq: ${e}`);
      }
    }
  }
}

