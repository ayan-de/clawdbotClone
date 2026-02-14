import { IncomingMessage } from '../chat-adapter.interface';

/**
 * Message Router Service Interface
 * Defines the contract for message routing between platforms and adapters
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export interface IMessageRouterService {
    /**
     * Handle incoming message event
     */
    handleIncomingMessage(message: IncomingMessage): void;

    /**
     * Send message to a specific platform
     */
    sendToPlatform(platform: string, userId: string, message: string): Promise<void>;

    /**
     * Send stream to a specific platform
     */
    sendStreamToPlatform(
        platform: string,
        userId: string,
        data: ReadableStream
    ): Promise<void>;

    /**
     * Send message with platform auto-detection
     * Supports format: "platform:userId" or just "userId"
     */
    sendWithPlatformDetection(userIdWithPlatform: string, message: string): Promise<void>;

    /**
     * Transform message for platform-specific formatting
     */
    transformMessage(
        platform: string,
        message: string,
        options?: { format?: 'plain' | 'markdown' | 'html' }
    ): string;

    /**
     * Get list of available platforms
     */
    getAvailablePlatforms(): string[];

    /**
     * Check if a platform is available
     */
    isPlatformAvailable(platform: string): boolean;

    /**
     * Broadcast message to multiple platforms/users
     * Returns map of platform to array of success/failure indicators
     */
    broadcast(
        userIdsByPlatform: Record<string, string[]>,
        message: string
    ): Promise<Map<string, number[]>>;
}
