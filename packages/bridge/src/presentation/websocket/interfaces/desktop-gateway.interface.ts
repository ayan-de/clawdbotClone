/**
 * Desktop Gateway Interface
 * Defines the contract for managing desktop WebSocket connections
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class IDesktopGateway {
    /**
     * Send a command to a specific desktop socket
     * @returns true if successful, false if socket not found
     */
    abstract sendCommand(socketId: string, command: any): boolean;

    /**
     * Get the first available desktop socket ID
     * @returns socket ID or null if no desktops available
     */
    abstract getFirstAvailableDesktop(): string | null;

    /**
     * Get all connected desktop socket IDs
     */
    abstract getConnectedDesktops(): string[];

    /**
     * Check if a desktop socket is connected
     */
    abstract isDesktopConnected(socketId: string): boolean;
}
