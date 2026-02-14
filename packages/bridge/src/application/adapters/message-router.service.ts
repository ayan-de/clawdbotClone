import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAdapterFactoryService } from './interfaces/adapter-factory.interface';
import { ChatEvent, IncomingMessage } from './chat-adapter.interface';
import { IMessageRouterService } from './interfaces/message-router.interface';
import { MessageTransformer } from './message-transformer.interface';
import { TelegramTransformer, DiscordTransformer, SlackTransformer } from './transformers';

/**
 * Message Router Service
 * Routes messages to appropriate chat platform adapters
 * Follows Strategy Pattern - selects adapter based on platform
 * Uses Strategy Pattern for message transformers - no switch statements
 */
@Injectable()
export class MessageRouterService implements IMessageRouterService {
  private readonly logger = new Logger(MessageRouterService.name);
  private readonly transformers = new Map<string, MessageTransformer>();

  constructor(
    private readonly adapterFactory: IAdapterFactoryService,
  ) {
    this.initializeTransformers();
  }

  /**
   * Initialize platform-specific message transformers
   * Follows Open/Closed Principle - add new platforms without modifying this method
   */
  private initializeTransformers(): void {
    const transformers: MessageTransformer[] = [
      new TelegramTransformer(),
      new DiscordTransformer(),
      new SlackTransformer(),
    ];

    for (const transformer of transformers) {
      this.transformers.set(transformer.getPlatform(), transformer);
    }

    this.logger.debug(`Initialized ${this.transformers.size} message transformers`);
  }

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
   * Uses Strategy Pattern - no switch statements (OCP compliant)
   */
  transformMessage(
    platform: string,
    message: string,
    options?: { format?: 'plain' | 'markdown' | 'html' },
  ): string {
    const transformer = this.transformers.get(platform.toLowerCase());

    if (!transformer) {
      this.logger.debug(`No transformer found for platform: ${platform}`);
      return message;
    }

    return transformer.transform(message, options);
  }

  /**
   * Register a custom message transformer
   * Allows dynamic registration of new platform transformers
   */
  registerTransformer(transformer: MessageTransformer): void {
    this.transformers.set(transformer.getPlatform(), transformer);
    this.logger.debug(`Registered message transformer for: ${transformer.getPlatform()}`);
  }

  /**
   * Get available transformer platforms
   */
  getAvailableTransformerPlatforms(): string[] {
    return Array.from(this.transformers.keys());
  }
}
