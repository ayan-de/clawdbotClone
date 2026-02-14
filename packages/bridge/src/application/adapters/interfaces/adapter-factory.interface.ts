import { IChatAdapter } from '../chat-adapter.interface';
import { AdapterConfig } from '../chat-adapter.interface';

/**
 * Adapter Factory Service Interface
 * Defines the contract for creating and managing chat adapters
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export interface IAdapterFactoryService {
    /**
     * Create/get an adapter by platform name
     * @throws NotFoundException if adapter not found
     */
    createAdapter(platform: string): IChatAdapter;

    /**
     * Get an existing adapter without creating
     */
    getAdapter(platform: string): IChatAdapter | undefined;

    /**
     * Register a new adapter
     */
    registerAdapter(platform: string, adapter: IChatAdapter): void;

    /**
     * Check if an adapter is available
     */
    hasAdapter(platform: string): boolean;

    /**
     * Get all available platforms
     */
    getAvailablePlatforms(): string[];

    /**
     * Get adapter configuration
     */
    getAdapterConfig(platform: string): AdapterConfig | undefined;

    /**
     * Initialize all registered adapters
     */
    initializeAll(): Promise<void>;

    /**
     * Disconnect all adapters
     */
    disconnectAll(): Promise<void>;
}
