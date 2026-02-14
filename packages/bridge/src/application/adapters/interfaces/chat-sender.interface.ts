/**
 * Chat Sender Interface
 * Defines the contract for sending messages to a chat platform
 * Follows Interface Segregation Principle - focused solely on sending
 */
export interface IChatSender {
    /**
     * Send a message to a specific user
     */
    sendMessage(userId: string, message: string): Promise<void>;

    /**
     * Send a stream to a specific user
     */
    sendStream(userId: string, data: ReadableStream): Promise<void>;
}
