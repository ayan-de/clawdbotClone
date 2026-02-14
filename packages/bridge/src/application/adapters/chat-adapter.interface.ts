// ... imports
import { ChatAdapter } from '@orbit/common';

/**
 * Chat Event Constants
 */
export const ChatEvent = {
  MESSAGE_RECEIVED: 'chat.message.received',
  MESSAGE_SENT: 'chat.message.sent',
  ERROR: 'chat.error',
};

/**
 * Incoming Message Structure
 */
export interface IncomingMessage {
  id: string;
  platform: string;
  userId: string;
  chatId?: string;
  username?: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

/**
 * Extended Chat Adapter Interface
 * Adds additional functionality on top of common ChatAdapter
 */
export interface IChatAdapter extends ChatAdapter {
  /**
   * Initialize the adapter
   */
  initialize(): Promise<void>;

  /**
   * Disconnect the adapter
   */
  disconnect(): Promise<void>;

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean;

  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Process incoming update (webhook)
   */
  processUpdate(update: any): Promise<void>;
}

/**
 * Adapter Configuration
 * Configuration for adapter initialization
 */
export interface AdapterConfig {
  platform: string;
  token: string;
  webhookUrl?: string;
  options?: Record<string, any>;
}

/**
 * Message Queue Item
 */
export interface MessageQueueItem {
  id: string;
  userId: string;
  message: string;
  platform: string;
  priority: number;
  retries: number;
  maxRetries: number;
  nextRetryAt: Date;
  createdAt: Date;
}
