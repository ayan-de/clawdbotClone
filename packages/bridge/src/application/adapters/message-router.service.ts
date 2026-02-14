import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdapterFactoryService } from './adapter-factory.service';
import { ChatEvent, IncomingMessage } from './chat-adapter.interface';

/**
 * Message Router Service
 * Routes messages to appropriate chat platform adapters
 * Follows Strategy Pattern - selects adapter based on platform
 */
@Injectable()
export class MessageRouterService {
  private readonly logger = new Logger(MessageRouterService.name);

  constructor(
    private readonly adapterFactory: AdapterFactoryService,
  ) { }

  /**
   * Handle incoming message event
   */
  @OnEvent(ChatEvent.MESSAGE_RECEIVED)
  handleIncomingMessage(message: IncomingMessage) {
    this.logger.log(
      `Routed incoming message from ${message.userId} on ${message.platform}: ${message.content}`,
    );
    // Here we can route to:
    // 1. Command Executor Service
    // 2. AI Agent Service
    // 3. WebSocket Gateway
  }

  /**
   * Send message to a specific platform
   */
  async sendToPlatform(
    platform: string,
    userId: string,
    message: string,
  ): Promise<void> {
    try {
      const adapter = this.adapterFactory.createAdapter(platform);

      await adapter.sendMessage(userId, message);

      this.logger.log(
        `Message routed to ${platform} user ${userId}: ${message.substring(0, 50)}...`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send message to ${platform} user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send stream to a specific platform
   */
  async sendStreamToPlatform(
    platform: string,
    userId: string,
    data: ReadableStream,
  ): Promise<void> {
    try {
      const adapter = this.adapterFactory.createAdapter(platform);

      await adapter.sendStream(userId, data);

      this.logger.log(`Stream routed to ${platform} user ${userId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send stream to ${platform} user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send message with platform detection
   * Auto-detects platform from userId format (e.g., telegram:123456)
   */
  async sendWithPlatformDetection(
    userIdWithPlatform: string,
    message: string,
  ): Promise<void> {
    const [platform, userId] = this.parseUserId(userIdWithPlatform);
    return this.sendToPlatform(platform, userId, message);
  }

  /**
   * Parse userId to extract platform and actual userId
   * Supports formats: "platform:userId" or just "userId"
   */
  private parseUserId(userIdWithPlatform: string): [string, string] {
    if (userIdWithPlatform.includes(':')) {
      const [platform, userId] = userIdWithPlatform.split(':', 2);
      return [platform, userId];
    }

    // Default to Telegram for backward compatibility
    return ['telegram', userIdWithPlatform];
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms(): string[] {
    return this.adapterFactory.getAvailablePlatforms();
  }

  /**
   * Check if platform is available
   */
  isPlatformAvailable(platform: string): boolean {
    return this.adapterFactory.hasAdapter(platform);
  }

  /**
   * Broadcast message to multiple platforms
   */
  async broadcast(
    userIdsByPlatform: Record<string, string[]>,
    message: string,
  ): Promise<Map<string, number[]>> {
    const results = new Map<string, number[]>();

    for (const [platform, userIds] of Object.entries(userIdsByPlatform)) {
      const platformResults: number[] = [];

      for (const userId of userIds) {
        try {
          await this.sendToPlatform(platform, userId, message);
          platformResults.push(1); // Success
        } catch (error) {
          platformResults.push(0); // Failed
          this.logger.error(
            `Broadcast failed for ${platform} user ${userId}: ${error}`,
          );
        }
      }

      results.set(platform, platformResults);
    }

    return results;
  }

  /**
   * Transform message for platform-specific formatting
   * Can be extended for markdown, HTML, etc.
   */
  transformMessage(
    platform: string,
    message: string,
    options?: { format?: 'plain' | 'markdown' | 'html' },
  ): string {
    // Default formatting
    let formattedMessage = message;

    // Platform-specific transformations
    switch (platform.toLowerCase()) {
      case 'telegram':
        // Telegram supports Markdown v2
        if (options?.format === 'markdown') {
          formattedMessage = this.formatTelegramMarkdown(message);
        }
        break;

      case 'discord':
        // Discord supports Markdown
        if (options?.format === 'markdown') {
          formattedMessage = this.formatDiscordMarkdown(message);
        }
        break;

      case 'slack':
        // Slack has its own formatting
        formattedMessage = this.formatSlackMessage(message);
        break;

      default:
        // No transformation needed
        break;
    }

    return formattedMessage;
  }

  /**
   * Format message for Telegram Markdown
   */
  private formatTelegramMarkdown(message: string): string {
    // Basic Markdown formatting can be added here
    return message;
  }

  /**
   * Format message for Discord Markdown
   */
  private formatDiscordMarkdown(message: string): string {
    // Discord-specific Markdown formatting
    return message;
  }

  /**
   * Format message for Slack
   */
  private formatSlackMessage(message: string): string {
    // Slack-specific formatting
    return message;
  }
}
