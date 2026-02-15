import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IAdapterFactoryService } from './interfaces/adapter-factory.interface';
import { ChatEvent, IncomingMessage } from './chat-adapter.interface';
import { IMessageRouterService } from './interfaces/message-router.interface';
import { MessageTransformer } from './message-transformer.interface';
import { TelegramTransformer, DiscordTransformer, SlackTransformer } from './transformers';
import { ISessionService } from '../session/interfaces/session.service.interface';
import { UsersService } from '../users/users.service';
import { User } from '../domain/entities/user.entity';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';

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
    private readonly sessionService: ISessionService,
    private readonly usersService: UsersService,
    private readonly desktopGateway: DesktopGateway,
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
  async handleIncomingMessage(message: IncomingMessage) {
    this.logger.log(
      `Routed incoming message from ${message.userId} on ${message.platform}: ${message.content}`,
    );

    // Find user by telegram username (stateless - just lookup)
    const user = await this.findUserByTelegram(message.username);

    if (!user) {
      this.logger.warn(`User not found for telegram username: ${message.username}`);
      // Send "Please sign up at orbit.ayande.xyz" message
      await this.sendToPlatform(
        message.platform,
        message.chatId || message.userId,
        "Welcome! To use Orbit, please sign up at https://orbit.ayande.xyz/signup with your Telegram username.",
      );
      return;
    }

    // Update user's telegramId if not set (needed for response routing)
    if (user && !user.telegramId && message.userId) {
      const numericTelegramId = parseInt(message.userId, 10);
      if (!isNaN(numericTelegramId)) {
        try {
          await (this.usersService as any).update(user.id, { telegramId: numericTelegramId });
          this.logger.log(`Updated user ${user.id} with telegramId: ${numericTelegramId}`);
          user.telegramId = numericTelegramId; // Update in-memory reference
        } catch (error) {
          this.logger.warn(`Failed to update telegramId for user ${user.id}: ${error}`);
        }
      }
    }

    // Check if user has active desktop session (real-time)
    const activeSessions = await this.sessionService.getActiveSessionsByUserId(user.id);

    if (!activeSessions || activeSessions.length === 0) {
      this.logger.warn(`No active sessions for user: ${user.id}`);
      await this.sendToPlatform(
        message.platform,
        message.chatId || message.userId,
        "Your desktop is not connected. Start the TUI client to receive commands.",
      );
      return;
    }

    // Update session with Telegram metadata for response routing
    const session = activeSessions[0];
    await this.sessionService.updateSessionMetadata(session.id, {
      platform: message.platform,
      platformUserId: message.userId,
      chatId: message.chatId,
      username: message.username,
    });

    // Route command to TUI via WebSocket
    const sessionId = activeSessions[0].id; // Use first active session
    const command = message.content;

    this.logger.log(`Routing command to desktop session ${sessionId}: ${command}`);

    try {
      await this.desktopGateway.sendCommand(sessionId, command);

      // Optionally acknowledge receipt if needed, but streaming output is better
      // await this.sendToPlatform(
      //   message.platform,
      //   message.chatId || message.userId,
      //   `Executing: "${command}"...`,
      // );
    } catch (error: any) {
      this.logger.error(`Failed to route command to desktop: ${error.message}`);
      await this.sendToPlatform(
        message.platform,
        message.chatId || message.userId,
        `Error executing command: ${error.message}`,
      );
    }
  }

  /**
   * Handle desktop output event
   * Routes output back to user via Telegram (or other platform)
   */
  @OnEvent('desktop.output')
  async handleDesktopOutput(event: any) {
    const { userId, output } = event;

    if (!userId || !output) return;

    this.logger.log(`Desktop output for user ${userId}: ${output?.substring(0, 80)}...`);

    // Find user to get Telegram chat ID
    const user = await this.usersService.findEntityById(userId);

    if (!user) {
      this.logger.warn(`User not found for desktop output: ${userId}`);
      return;
    }

    // Send to Telegram if user has telegramId
    if (user.telegramId) {
      try {
        await this.sendToPlatform('telegram', user.telegramId.toString(), output);
      } catch (error) {
        this.logger.error(`Failed to send output to Telegram: ${error}`);
      }
    } else {
      this.logger.warn(`User ${userId} has no telegramId linked`);
    }
  }

  /**
   * Handle desktop command completion
   */
  @OnEvent('desktop.complete')
  async handleDesktopComplete(event: any) {
    const { userId, result } = event;

    if (!userId) return;

    const user = await this.usersService.findEntityById(userId);
    if (!user || !user.telegramId) return;

    // Send final result output if available
    if (result?.stdout) {
      await this.sendToPlatform('telegram', user.telegramId.toString(), result.stdout);
    }

    if (!result?.success) {
      const errorMsg = result?.stderr || result?.error || 'Unknown error';
      await this.sendToPlatform('telegram', user.telegramId.toString(), `❌ Command failed: ${errorMsg}`);
    }
  }

  /**
   * Handle desktop error
   */
  @OnEvent('desktop.error')
  async handleDesktopError(event: any) {
    const { userId, error } = event;

    if (!userId || !error) return;

    const user = await this.usersService.findEntityById(userId);
    if (!user || !user.telegramId) return;

    await this.sendToPlatform('telegram', user.telegramId.toString(), `❌ Error: ${error}`);
  }

  /**
   * Find user by Telegram username
   */
  private async findUserByTelegram(username?: string): Promise<User | null> {
    if (!username) {
      return null;
    }
    return this.usersService.findEntityByTelegramUsername(username);
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
