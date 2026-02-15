import { Injectable, Logger } from '@nestjs/common';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';
import { ISessionService } from '../session/interfaces/session.service.interface';

/**
 * Desktop Selector Service
 * Handles desktop discovery and session attachment
 * Follows Single Responsibility Principle - focused solely on desktop selection
 */
@Injectable()
export class DesktopSelectorService {
    private readonly logger = new Logger(DesktopSelectorService.name);

    constructor(
        private readonly desktopGateway: DesktopGateway,
        private readonly sessionService: ISessionService,
    ) { }

    /**
     * Find or attach an available desktop to a session
     * @returns Desktop socket ID or null if none available
     */
    async findOrAttachDesktop(sessionId: string): Promise<string | null> {
        const session = await this.sessionService.getSession(sessionId);

        if (!session) {
            this.logger.warn(`Session not found: ${sessionId}`);
            return null;
        }

        // Check if session already has attached desktop
        let desktopId = session.desktopId;

        if (desktopId) {
            // Check if still connected
            const isAlive = await this.isDesktopAliveForUser(desktopId, session.userId);
            if (isAlive) {
                return desktopId;
            }
            // If not alive, clear it
            await this.detachDesktop(sessionId);
        }

        // Find new desktop for user
        const connectedDesktops = await this.desktopGateway.getConnectedDesktops(session.userId);

        if (connectedDesktops.length > 0) {
            // Pick first available
            // In future, could pick based on hostname or load
            const bestDesktop = connectedDesktops[0];
            desktopId = bestDesktop.sessionId; // Note: In Gateway interface, we return { sessionId, desktopName }. 
            // Wait, getConnectedDesktops returns sessions, not socket IDs directly. 
            // Actually, in DesktopGateway implementation:
            /*
            async getConnectedDesktops(userId: string): Promise<{ sessionId: string; desktopName?: string }[]> {
                // ... returns sessions
            }
            */
            // But here we need a socket ID (desktopId) to attach?
            // Wait, Session entity has `desktopId` which is the socket ID.
            // But `session.desktopId` is what we are trying to find.

            // Let's look at `DesktopGateway.getConnectedDesktops`:
            /*
              async getConnectedDesktops(userId: string): Promise<{ sessionId: string; desktopName?: string }[]> {
                const sessionIds = this.userSessions.get(userId) || [];
                // ...
                const session = await this.sessionService.getSession(sessionId);
                // ...
              }
            */
            // It returns existing SESSIONS that have desktops.
            // It doesn't return raw socket IDs of desktops that are not in a session?
            // Desktops are natively 1-to-1 with sessions upon connection in the current design.
            // When a desktop connects, a session is created/linked immediately.

            // So if `getConnectedDesktops` returns a list, those are sessions that have active desktops.
            // If our current session (sessionId) does NOT have a desktop, 
            // but the user HAS other sessions with desktops...
            // Should we "steal" the desktop? Or reuse that session?

            // If we are in this service with a `sessionId`, it implies we want THIS session to work.
            // But if this session has no desktop, we are stuck unless we allow multiple sessions per user 
            // and we route to the active one.

            // `CommandExecutionService` creates a NEW session for every incoming message if I recall correctly... 
            // "getOrCreateSession"

            // If `getOrCreateSession` reuses an active session, then `session.desktopId` should already be set!

            // If `session.desktopId` is NOT set, it means either:
            // 1. It's a brand new session and no desktop matched it yet? (But desktops initiate sessions).
            // 2. The desktop disconnected.

            // If the user has *another* active session with a desktop, maybe we should use *that* desktop ID?
            // But `desktopId` is a socket ID. We can attach the same socket ID to multiple sessions?
            // Theoretically yes, multiple chat sessions could talk to one desktop connection.

            if (connectedDesktops.length > 0) {
                // We need the SOCKET ID of that other session.
                // We don't have direct access to socket ID from `connectedDesktops` result (it returns session IDs).

                // Let's get the session of the first connected desktop
                const otherSessionId = connectedDesktops[0].sessionId;
                const otherSession = await this.sessionService.getSession(otherSessionId);

                if (otherSession && otherSession.desktopId) {
                    desktopId = otherSession.desktopId;
                    await this.sessionService.attachDesktop(sessionId, desktopId);
                    this.logger.debug(`Attached desktop from session ${otherSessionId} to session ${sessionId}`);
                    return desktopId;
                }
            }
        }

        this.logger.debug(`No desktops available for user ${session.userId}`);
        return null;
    }

    /**
     * Check if a desktop is responsive for a user
     */
    async isDesktopAliveForUser(desktopId: string, userId: string): Promise<boolean> {
        // We cannot ping. We can only check if it is in the list of connected desktops for the user.
        // But `getConnectedDesktops` returns sessions.
        // We need to see if any session for this user has this desktopId.

        const connectedDesktops = await this.desktopGateway.getConnectedDesktops(userId);

        // We need to resolve the sessions to check their desktopId? 
        // Or deeper query.

        // Faster way: `desktopGateway` doesn't expose "is socket connected".
        // But we can trust `getConnectedDesktops` which relies on `userSessions` map in gateway.

        // Let's iterate.
        for (const desktops of connectedDesktops) {
            const session = await this.sessionService.getSession(desktops.sessionId);
            if (session?.desktopId === desktopId) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get count of available desktops for user
     */
    getAvailableDesktopCount(userId: string): number {
        return this.desktopGateway.getActiveDesktopCount(userId);
    }

    /**
     * Check if any desktops are available for user
     */
    hasAvailableDesktops(userId: string): boolean {
        return this.getAvailableDesktopCount(userId) > 0;
    }

    /**
     * Detach desktop from session
     */
    async detachDesktop(sessionId: string): Promise<void> {
        await this.sessionService.detachDesktop(sessionId);
        this.logger.debug(`Detached desktop from session ${sessionId}`);
    }
}
