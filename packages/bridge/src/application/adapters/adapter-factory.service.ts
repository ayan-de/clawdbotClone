import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BridgeLogger } from '../../logger';
import { IChatAdapter, AdapterConfig } from './chat-adapter.interface';
import { TelegramAdapter } from './telegram.adapter';
import { IAdapterFactoryService } from './interfaces/adapter-factory.interface';

/**
 * Adapter Factory Service
 * Factory Pattern - creates chat adapter instances dynamically
 * Follows SOLID - Open/Closed: Add new adapters without modifying factory
 *
 * @example usage:
 * const telegramAdapter = factory.createAdapter('telegram');
 * await telegramAdapter.sendMessage(userId, message);
 */
@Injectable()
export class AdapterFactoryService implements IAdapterFactoryService {
  private readonly logger = new Logger(AdapterFactoryService.name);
  private readonly adapters = new Map<string, IChatAdapter>();
  private readonly config = new Map<string, AdapterConfig>();

  constructor(
    private readonly bridgeLogger: BridgeLogger,
    private readonly configService: ConfigService,
    private readonly telegramAdapter: TelegramAdapter,
  ) {
    // Register available adapters
    this.registerAdapter('telegram', telegramAdapter);

    // Future adapters can be registered here:
    // this.registerAdapter('github', githubAdapter);
    // this.registerAdapter('whatsapp', whatsappAdapter);
  }

  /**
   * Register a chat adapter
   */
  private registerAdapter(platform: string, adapter: IChatAdapter): void {
    this.adapters.set(platform, adapter);

    // Load configuration for this platform
    const adapterConfig: AdapterConfig = {
      platform,
      token: this.configService.get<string>(
        `${platform.toUpperCase()}_BOT_TOKEN`,
        '',
      ),
      webhookUrl: this.configService.get<string>(
        `${platform.toUpperCase()}_WEBHOOK_URL`,
      ),
    };

    this.config.set(platform, adapterConfig);

    this.logger.log(`Adapter registered: ${platform}`);
  }

  /**
   * Create/get an adapter by platform name
   * @throws NotFoundException if adapter not found
   */
  createAdapter(platform: string): IChatAdapter {
    const adapter = this.adapters.get(platform.toLowerCase());

    if (!adapter) {
      const availablePlatforms = Array.from(this.adapters.keys()).join(', ');
      throw new NotFoundException(
        `Adapter '${platform}' not found. Available platforms: ${availablePlatforms}`,
      );
    }

    // Initialize if not already connected
    if (!adapter.isConnected()) {
      adapter.initialize().catch((error) => {
        this.logger.error(
          `Failed to initialize adapter ${platform}: ${error}`,
        );
      });
    }

    return adapter;
  }

  /**
   * Get an existing adapter without creating
   */
  getAdapter(platform: string): IChatAdapter | undefined {
    return this.adapters.get(platform.toLowerCase());
  }

  /**
   * Check if adapter is available
   */
  hasAdapter(platform: string): boolean {
    return this.adapters.has(platform.toLowerCase());
  }

  /**
   * Get all available platforms
   */
  getAvailablePlatforms(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get adapter configuration
   */
  getAdapterConfig(platform: string): AdapterConfig | undefined {
    return this.config.get(platform.toLowerCase());
  }

  /**
   * Initialize all registered adapters
   */
  async initializeAll(): Promise<void> {
    this.logger.log('Initializing all adapters...');

    const initPromises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        await adapter.initialize();
      } catch (error) {
        this.logger.error(
          `Failed to initialize adapter ${adapter.getName()}: ${error}`,
        );
      }
    });

    await Promise.allSettled(initPromises);

    const connectedCount = Array.from(this.adapters.values()).filter((a) =>
      a.isConnected(),
    ).length;

    this.logger.log(
      `Adapters initialized: ${connectedCount}/${this.adapters.size} connected`,
    );
  }

  /**
   * Disconnect all adapters
   */
  async disconnectAll(): Promise<void> {
    this.logger.log('Disconnecting all adapters...');

    const disconnectPromises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        await adapter.disconnect();
      } catch (error) {
        this.logger.error(
          `Failed to disconnect adapter ${adapter.getName()}: ${error}`,
        );
      }
    });

    await Promise.allSettled(disconnectPromises);

    this.logger.log('All adapters disconnected');
  }
}
