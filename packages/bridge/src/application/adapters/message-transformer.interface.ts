/**
 * Message Transformer Interface
 * Defines the contract for platform-specific message formatting
 * Follows Strategy Pattern - each platform can have its own transformer
 */
export interface MessageTransformer {
    /**
     * Format message for the platform
     */
    transform(message: string, options?: { format?: 'plain' | 'markdown' | 'html' }): string;

    /**
     * Get platform name
     */
    getPlatform(): string;
}
