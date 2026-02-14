import { IncomingMessage } from '../chat-adapter.interface';

/**
 * Message Router Service Interface
 * Defines the contract for message routing between platforms and adapters
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class IMessageRouterService {
    /**
     * Handle incoming message event
     */
    abstract handleIncomingMessage(message: IncomingMessage): void;

    /**
     * Send message to a specific platform
     */
    abstract sendToPlatform(platform: string, userId: string, message: string): Promise<void>;

    /**
     * Send stream to a specific platform
     */
    abstract sendStreamToPlatform(
        platform: string,
        userId: string,
        data: ReadableStream
    ): Promise<void>;

    /**
     * Send message with platform auto-detection
     * Supports format: "platform:userId" or just "userId"
     */
    abstract sendWithPlatformDetection(userIdWithPlatform: string, message: string): Promise<void>;

    /**
     * Transform message for platform-specific formatting
     */
    abstract transformMessage(
        platform: string,
        message: string,
        options?: { format?: 'plain' | 'markdown' | 'html' }
    ): string;

    /**
     * Get list of available platforms
     */
    abstract getAvailablePlatforms(): string[];

    /**
     * Check if a platform is available
     */
    abstract isPlatformAvailable(platform: string): boolean;

    /**
     * Broadcast message to multiple platforms/users
     * Returns map of platform to array of success/failure indicators
     */
    abstract broadcast(
        userIdsByPlatform: Record<string, string[]>,
        message: string
    ): Promise<Map<string, number[]>>;
}
