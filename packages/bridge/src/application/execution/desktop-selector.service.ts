import { Injectable, Logger } from '@nestjs/common';
import { IDesktopGateway } from '../../presentation/websocket/interfaces/desktop-gateway.interface';
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
        private readonly desktopGateway: IDesktopGateway,
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

        // Verify desktop is still connected
        if (!desktopId || !this.isDesktopAlive(desktopId)) {
            // Find new desktop
            desktopId = this.desktopGateway.getFirstAvailableDesktop();

            if (desktopId) {
                await this.sessionService.attachDesktop(sessionId, desktopId);
                this.logger.debug(`Attached desktop ${desktopId} to session ${sessionId}`);
            } else {
                this.logger.debug(`No desktops available for session ${sessionId}`);
            }
        }

        return desktopId || null;
    }

    /**
     * Check if a desktop is responsive
     */
    isDesktopAlive(desktopId: string): boolean {
        // Send ping to check if desktop is responsive
        return this.desktopGateway.sendCommand(desktopId, { type: 'ping' });
    }

    /**
     * Get count of available desktops
     */
    getAvailableDesktopCount(): number {
        return this.desktopGateway.getConnectedDesktops().length;
    }

    /**
     * Check if any desktops are available
     */
    hasAvailableDesktops(): boolean {
        return this.getAvailableDesktopCount() > 0;
    }

    /**
     * Detach desktop from session
     */
    async detachDesktop(sessionId: string): Promise<void> {
        await this.sessionService.detachDesktop(sessionId);
        this.logger.debug(`Detached desktop from session ${sessionId}`);
    }
}
