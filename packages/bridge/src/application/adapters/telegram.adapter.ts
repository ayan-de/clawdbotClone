import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BridgeLogger } from '../../logger';
import { BaseChatAdapter } from './base-adapter';
import { ChatEvent, IncomingMessage } from './chat-adapter.interface';

/**
 * Telegram Adapter
 * Implements ChatAdapter for Telegram platform
 * Follows Adapter Pattern - bridges Telegram API with our system
 */
@Injectable()
export class TelegramAdapter extends BaseChatAdapter {
  readonly platform = 'telegram';
  private bot?: TelegramBot;
  private readonly token: string;
  private readonly webhookUrl?: string;

  constructor(
    bridgeLogger: BridgeLogger,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(bridgeLogger);
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.webhookUrl = this.configService.get<string>('TELEGRAM_WEBHOOK_URL');
  }

  getName(): string {
    return 'TelegramAdapter';
  }

  /**
   * Initialize Telegram bot
   */
  async initialize(): Promise<void> {
    if (this.bot) {
      this.logger.warn('Telegram adapter already initialized');
      return;
    }

    try {
      const options: TelegramBot.ConstructorOptions = {
        polling: !this.webhookUrl, // Use polling if no webhook URL
      };

      // Create bot instance
      this.bot = new TelegramBot(this.token, options);

      // Verify bot connection
      const botInfo = await this.bot.getMe();
      this.logger.log(
        `Telegram bot initialized: @${botInfo.username} (${botInfo.id})`,
      );

      // Setup webhook if URL provided
      if (this.webhookUrl) {
        await this.bot.setWebHook(this.webhookUrl);
        this.logger.log(`Telegram webhook set: ${this.webhookUrl}`);
      }

      // Register message handler
      this.bot.on('message', (msg) => this.handleIncomingMessage(msg));

      await super.initialize();
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize Telegram adapter: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Handle incoming Telegram message
   */
  private async handleIncomingMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.text) return; // Ignore non-text messages for now

    const incomingMessage: IncomingMessage = {
      id: msg.message_id.toString(),
      platform: this.platform,
      userId: msg.from?.id.toString() || 'unknown',
      chatId: msg.chat.id.toString(),
      username: msg.from?.username,
      content: msg.text,
      timestamp: new Date(msg.date * 1000),
      metadata: msg,
    };

    this.logger.debug(
      `Received message from ${incomingMessage.username}: ${incomingMessage.content}`,
    );

    this.eventEmitter.emit(ChatEvent.MESSAGE_RECEIVED, incomingMessage);
  }

  /**
   * Process incoming update (webhook)
   */
  async processUpdate(update: any): Promise<void> {
    if (!this.bot) {
      throw new Error('Telegram adapter not initialized');
    }
    this.bot.processUpdate(update);
  }

  /**
   * Disconnect Telegram bot
   */
  async disconnect(): Promise<void> {
    if (!this.bot) {
      return;
    }

    try {
      if (this.webhookUrl) {
        await this.bot.deleteWebHook();
        this.logger.log('Telegram webhook deleted');
      } else {
        await this.bot.stopPolling();
      }

      this.bot = undefined;
      await super.disconnect();
      this.logger.log('Telegram adapter disconnected');
    } catch (error: any) {
      this.logger.error(
        `Failed to disconnect Telegram adapter: ${error.message}`,
      );
    }
  }

  /**
   Send message to Telegram user
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    if (!this.bot) {
      throw new Error('Telegram adapter not initialized');
    }

    try {
      await this.bot.sendMessage(userId, this.formatMessage(message));
      this.logger.debug(
        `Message sent to Telegram user ${userId}: ${message.substring(0, 50)}...`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send message to Telegram user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send stream to Telegram user (splits into chunks)
   */
  async sendStream(userId: string, data: ReadableStream): Promise<void> {
    if (!this.bot) {
      throw new Error('Telegram adapter not initialized');
    }

    try {
      // Telegram has message size limits (4096 chars)
      // For streaming, we'll send in chunks
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) buffer += decoder.decode(value, { stream: true });
      }

      // Send in chunks if buffer exceeds limit or stream is done
      const chunks = this.splitIntoChunks(buffer, 4096);

      for (const chunk of chunks) {
        await this.sendMessage(userId, chunk);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.logger.debug(`Stream sent to Telegram user ${userId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send stream to Telegram user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Format message for Telegram
   * Can be extended with markdown, HTML, etc.
   */
  private formatMessage(message: string): string {
    // Basic formatting - can be extended for markdown, HTML, etc.
    return message;
  }

  /**
   * Split message into chunks respecting Telegram's 4096 char limit
   */
  private splitIntoChunks(message: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let current = '';

    for (const char of message) {
      if (current.length + 1 > maxLength) {
        chunks.push(current);
        current = char;
      } else {
        current += char;
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }

  /**
   * Get bot instance
   */
  getBot(): TelegramBot | undefined {
    return this.bot;
  }
}
