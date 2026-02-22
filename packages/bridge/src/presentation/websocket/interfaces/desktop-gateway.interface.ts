/**
 * Desktop Gateway Interface
 * Defines the contract for managing desktop WebSocket connections
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export abstract class IDesktopGateway {
    /**
     * Send a command to a specific desktop session
     */
    abstract sendCommand(sessionId: string, command: string, requestId?: string, trusted?: boolean): Promise<void>;

    /**
     * Get connected desktops for a user
     */
    abstract getConnectedDesktops(userId: string): Promise<{ sessionId: string; desktopName?: string }[]>;

    /**
     * Get active desktop count for a user
     */
    abstract getActiveDesktopCount(userId: string): number;

    /**
     * Disconnect all desktops for a user
     */
    abstract disconnectAllDesktops(userId: string): Promise<void>;
}
