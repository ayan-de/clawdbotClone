/**
 * Chat Receiver Interface
 * Defines the contract for receiving updates from a chat platform
 * Follows Interface Segregation Principle - focused solely on receiving
 */
export interface IChatReceiver {
    /**
     * Process incoming update (webhook)
     */
    processUpdate(update: any): Promise<void>;
}
