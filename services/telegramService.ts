
import { MarketingPost, BotConfig } from "../types";

export class TelegramBotService {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async postToChannel(post: MarketingPost): Promise<{ success: boolean; error?: string }> {
    const fullMessage = `<b>${post.hook}</b>\n\n${post.content}\n\n<i>${post.emotionalTrigger}</i>\n\n${post.cta}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`;
    
    try {
      if (!this.config.telegramToken || this.config.telegramToken.includes("PASTE")) {
        return { success: false, error: "Invalid Telegram Token" };
      }

      if (post.imageUrl) {
        // Telegram caption limit is 1024 characters.
        // If content is too long, we send the photo with just the hook and cta, then the full content as a separate message.
        const canFitAll = fullMessage.length <= 1024;
        const caption = canFitAll ? fullMessage : `<b>${post.hook}</b>\n\n${post.cta}\n\n(Полный текст ниже 👇)`;

        let blob: Blob;
        
        // Обработка base64 data URL
        if (post.imageUrl.startsWith('data:')) {
          const response = await fetch(post.imageUrl);
          blob = await response.blob();
        } else {
          // Обычный URL
          const photoResponse = await fetch(post.imageUrl);
          blob = await photoResponse.blob();
        }
        
        const formData = new FormData();
        formData.append('chat_id', this.config.adminId);
        formData.append('photo', blob, 'post-image.png');
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        const photoUrl = `https://api.telegram.org/bot${this.config.telegramToken}/sendPhoto`;
        const res = await fetch(photoUrl, { method: 'POST', body: formData });
        
        if (!res.ok) {
          const errorData = await res.json();
          return { success: false, error: `Telegram Error: ${errorData.description || res.statusText}` };
        }

        // If we split the message, send the text part now
        if (!canFitAll) {
          await this.sendTextMessage(fullMessage);
        }

        return { success: true };
      } else {
        return await this.sendTextMessage(fullMessage);
      }
    } catch (error: any) {
      console.error("CORS/Network error:", error);
      return { success: false, error: `Network Error: Проверьте интернет и настройки бота.` };
    }
  }

  private async sendTextMessage(text: string): Promise<{ success: boolean; error?: string }> {
    const url = `https://api.telegram.org/bot${this.config.telegramToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.config.adminId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { success: false, error: `Telegram Error: ${errorData.description || res.statusText}` };
    }
    return { success: true };
  }
}
