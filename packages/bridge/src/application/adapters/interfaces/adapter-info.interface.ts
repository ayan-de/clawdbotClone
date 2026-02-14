/**
 * Adapter Info Interface
 * Defines the contract for adapter metadata
 * Follows Interface Segregation Principle - focused solely on adapter information
 */
export interface IAdapterInfo {
    /**
     * Get adapter name
     */
    getName(): string;
}
