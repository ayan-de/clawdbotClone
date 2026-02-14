import { IChatAdapter } from '../chat-adapter.interface';
import { AdapterConfig } from '../chat-adapter.interface';

/**
 * Adapter Factory Service Interface
 * Defines the contract for creating and managing chat adapters
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class IAdapterFactoryService {
    /**
     * Create/get an adapter by platform name
     * @throws NotFoundException if adapter not found
     */
    abstract createAdapter(platform: string): IChatAdapter;

    /**
     * Get an existing adapter without creating
     */
    abstract getAdapter(platform: string): IChatAdapter | undefined;

    /**
     * Register a new adapter
     */
    abstract registerAdapter(platform: string, adapter: IChatAdapter): void;

    /**
     * Check if an adapter is available
     */
    abstract hasAdapter(platform: string): boolean;

    /**
     * Get all available platforms
     */
    abstract getAvailablePlatforms(): string[];

    /**
     * Get adapter configuration
     */
    abstract getAdapterConfig(platform: string): AdapterConfig | undefined;

    /**
     * Initialize all registered adapters
     */
    abstract initializeAll(): Promise<void>;

    /**
     * Disconnect all adapters
     */
    abstract disconnectAll(): Promise<void>;
}
