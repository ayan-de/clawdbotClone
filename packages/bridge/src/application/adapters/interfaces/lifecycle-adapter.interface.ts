/**
 * Lifecycle Adapter Interface
 * Defines the contract for adapter lifecycle management
 * Follows Interface Segregation Principle - focused solely on lifecycle
 */
export interface ILifecycleAdapter {
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
}
