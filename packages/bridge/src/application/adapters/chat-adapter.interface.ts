// ... imports
import { ChatAdapter } from '@orbit/common';
import { IChatSender } from './interfaces/chat-sender.interface';
import { IChatReceiver } from './interfaces/chat-receiver.interface';
import { ILifecycleAdapter } from './interfaces/lifecycle-adapter.interface';
import { IAdapterInfo } from './interfaces/adapter-info.interface';

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
 * Composes smaller, focused interfaces (ISP compliant)
 * Extends common ChatAdapter from @orbit/common
 */
export interface IChatAdapter
  extends ChatAdapter,
    IChatSender,
    IChatReceiver,
    ILifecycleAdapter,
    IAdapterInfo {
  // All methods are inherited from composed interfaces
  // This interface serves as a convenience facade
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
