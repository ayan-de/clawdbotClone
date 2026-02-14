import { Injectable, Logger } from '@nestjs/common';
import { BridgeLogger } from '../../logger';
import { IChatAdapter, MessageQueueItem } from './chat-adapter.interface';

/**
 * Base Chat Adapter
 * Provides common functionality for all chat platform adapters
 * Follows Template Method Pattern - base class with shared logic
 */
@Injectable()
export abstract class BaseChatAdapter implements IChatAdapter {
  abstract readonly platform: any;
  protected readonly logger: Logger;
  protected connected: boolean = false;
  protected messageQueue: Map<string, MessageQueueItem> = new Map();
  protected queueProcessorInterval?: NodeJS.Timeout;

  constructor(bridgeLogger: BridgeLogger) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return this.constructor.name.replace('Adapter', '');
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    this.connected = true;
  }

  /**
   * Disconnect the adapter
   */
  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Send message (to be implemented by subclass)
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    // Default implementation
    this.logger.warn(`sendMessage not implemented in ${this.getName()}`);
  }

  /**
   * Send stream - optional implementation
   */
  async sendStream(userId: string, data: ReadableStream): Promise<void> {
    // Default implementation - can be overridden by subclasses
    const reader = data.getReader();
    const decoder = new TextDecoder();
    let message = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) message += decoder.decode(value, { stream: true });
    }

    await this.sendMessage(userId, message);
  }

  /**
   * Process incoming update
   */
  async processUpdate(update: any): Promise<void> {
    this.logger.warn(`processUpdate not implemented in ${this.getName()}`);
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Start message queue processing
   */
  startQueueProcessing(intervalMs: number = 1000): void {
    if (this.queueProcessorInterval) {
      return;
    }

    this.queueProcessorInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    this.logger.log(`Message queue processor started: ${this.getName()}`);
  }

  /**
   * Stop message queue processing
   */
  stopQueueProcessing(): void {
    if (this.queueProcessorInterval) {
      clearInterval(this.queueProcessorInterval);
      this.queueProcessorInterval = undefined;
      this.logger.log(`Message queue processor stopped: ${this.getName()}`);
    }
  }

  /**
   * Process message queue
   * Implements exponential backoff for retries
   */
  protected async processQueue(): Promise<void> {
    const now = Date.now();
    const itemsToProcess: MessageQueueItem[] = [];

    // Find items ready for processing
    for (const [id, item] of this.messageQueue.entries()) {
      if (item.nextRetryAt.getTime() <= now) {
        itemsToProcess.push(item);
        this.messageQueue.delete(id);
      }
    }

    // Process items
    for (const item of itemsToProcess) {
      try {
        await this.sendMessage(item.userId, item.message);
        this.logger.debug(
          `Message sent successfully: ${item.id} to ${item.userId} via ${this.platform}`,
        );
      } catch (error: any) {
        // Retry with exponential backoff
        if (item.retries < item.maxRetries) {
          const backoffMs = this.calculateBackoff(item.retries);
          item.retries++;
          item.nextRetryAt = new Date(now + backoffMs);

          this.messageQueue.set(item.id, item);
          this.logger.warn(
            `Message failed, will retry: ${item.id} (Attempt ${item.retries}/${item.maxRetries}) in ${backoffMs}ms`,
          );
        } else {
          // Max retries exceeded
          this.logger.error(
            `Message failed after ${item.maxRetries} attempts: ${item.id}`,
          );
        }
      }
    }
  }

  /**
   * Add message to queue
   */
  enqueueMessage(
    userId: string,
    message: string,
    priority: number = 0,
    maxRetries: number = 3,
  ): void {
    const item: MessageQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      message,
      platform: this.platform,
      priority,
      retries: 0,
      maxRetries,
      nextRetryAt: new Date(),
      createdAt: new Date(),
    };

    this.messageQueue.set(item.id, item);
    this.logger.debug(
      `Message enqueued: ${item.id} to ${userId} via ${this.platform}`,
    );
  }

  /**
   * Calculate exponential backoff
   * Formula: min(2^retry * base, max)
   */
  protected calculateBackoff(retryCount: number): number {
    const base = 1000; // 1 second
    const max = 60000; // 60 seconds
    const exponential = Math.pow(2, retryCount) * base;
    return Math.min(exponential, max);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.messageQueue.size;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    const size = this.messageQueue.size;
    this.messageQueue.clear();
    this.logger.log(`Message queue cleared: ${size} items`);
  }
}
