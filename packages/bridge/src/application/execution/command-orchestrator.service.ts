import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomingMessage, ChatEvent } from '../adapters/chat-adapter.interface';
import { IMessageRouterService } from '../adapters/interfaces/message-router.interface';
import { ISessionService } from '../session/interfaces/session.service.interface';
import { UserOrchestrationService } from './user-orchestration.service';
import { DesktopSelectorService } from './desktop-selector.service';
import { ICommandExecutionService } from './interfaces/command-execution.interface';
import { IDesktopGateway } from '../../presentation/websocket/interfaces/desktop-gateway.interface';

/**
 * Command Orchestrator Service
 * Coordinates the command execution flow between services
 * Follows Single Responsibility Principle - focused solely on orchestration
 */
@Injectable()
export class CommandOrchestratorService implements ICommandExecutionService {
    private readonly logger = new Logger(CommandOrchestratorService.name);
    // Track running commands by session ID
    private readonly runningCommands = new Map<string, boolean>();

    constructor(
        private readonly desktopGateway: IDesktopGateway,
        private readonly messageRouter: IMessageRouterService,
        private readonly sessionService: ISessionService,
        private readonly userOrchestration: UserOrchestrationService,
        private readonly desktopSelector: DesktopSelectorService,
    ) { }

    /**
     * Handle incoming chat message from platforms
     */
    @OnEvent(ChatEvent.MESSAGE_RECEIVED)
    async handleIncomingMessage(message: IncomingMessage): Promise<void> {
        this.logger.log(`Processing message from ${message.userId} (${message.platform}): ${message.content}`);

        try {
            // 1. Find or create user
            const user = await this.userOrchestration.findOrCreateUser(
                message.platform,
                message.userId,
                message.username,
            );

            // 2. Get or create session
            const session = await this.sessionService.getOrCreateSession(user, message.platform, {
                platformUserId: message.userId,
                chatId: message.chatId,
                username: message.username,
            });

            // 3. Find or attach desktop
            const desktopId = await this.desktopSelector.findOrAttachDesktop(session.id);

            if (!desktopId) {
                await this.messageRouter.sendToPlatform(
                    message.platform,
                    message.userId,
                    '⚠️ No desktop terminals available. Please connect a desktop client.',
                );
                return;
            }

            // 4. Execute command
            await this.executeCommand(session.id, message.content, {
                userMessage: message.content,
                userId: message.userId,
            });
        } catch (error) {
            this.logger.error(`Error processing message: ${error}`);
            await this.messageRouter.sendToPlatform(
                message.platform,
                message.userId,
                '❌ Internal Error',
            );
        }
    }

    /**
     * Handle command result from desktop
     */
    @OnEvent('command.result')
    async handleCommandResult(result: any): Promise<void> {
        const { sessionId, stdout, stderr, error } = result;

        try {
            const session = await this.sessionService.getSession(sessionId);

            if (!session) {
                this.logger.warn(`Received result for unknown session: ${sessionId}`);
                return;
            }

            const platform = session.metadata?.platform;
            const userId = session.metadata?.platformUserId;

            if (!platform || !userId) {
                this.logger.warn(`Session ${sessionId} missing platform metadata`);
                return;
            }

            // Mark command as completed
            this.runningCommands.delete(sessionId);

            // Format output
            const formattedOutput = this.formatCommandOutput(stdout, stderr, error);

            // Send result back to user
            await this.messageRouter.sendToPlatform(platform, userId, formattedOutput);

            this.logger.log(`Result sent to ${platform} user ${userId} (Session: ${sessionId})`);
        } catch (err) {
            this.logger.error(`Failed to handle command result: ${err}`);
        }
    }

    /**
     * Execute a command on a specific session
     */
    async executeCommand(
        sessionId: string,
        command: string,
        options?: { userMessage?: string; userId?: string },
    ): Promise<boolean> {
        try {
            const session = await this.sessionService.getSession(sessionId);

            if (!session) {
                this.logger.warn(`Session not found: ${sessionId}`);
                return false;
            }

            if (!session.desktopId) {
                this.logger.warn(`Session ${sessionId} has no desktop attached`);
                return false;
            }

            const success = this.desktopGateway.sendCommand(session.desktopId, {
                type: 'execute',
                sessionId: session.id,
                command,
                userMessage: options?.userMessage || command,
            });

            if (success) {
                this.runningCommands.set(sessionId, true);

                if (options?.userId && session.metadata?.platform && session.metadata?.platformUserId) {
                    await this.messageRouter.sendToPlatform(
                        session.metadata.platform,
                        session.metadata.platformUserId,
                        '⏳ Executing...',
                    );
                }
            }

            return success;
        } catch (error) {
            this.logger.error(`Failed to execute command on session ${sessionId}: ${error}`);
            return false;
        }
    }

    /**
     * Cancel a running command
     */
    async cancelCommand(sessionId: string): Promise<boolean> {
        try {
            const session = await this.sessionService.getSession(sessionId);

            if (!session || !session.desktopId) {
                return false;
            }

            const success = this.desktopGateway.sendCommand(session.desktopId, {
                type: 'cancel',
                sessionId,
            });

            if (success) {
                this.runningCommands.delete(sessionId);
            }

            return success;
        } catch (error) {
            this.logger.error(`Failed to cancel command on session ${sessionId}: ${error}`);
            return false;
        }
    }

    /**
     * Get status of a command execution
     */
    async getCommandStatus(sessionId: string): Promise<'idle' | 'running' | 'cancelled' | 'failed'> {
        const isRunning = this.runningCommands.get(sessionId);

        if (isRunning) {
            return 'running';
        }

        const session = await this.sessionService.getSession(sessionId);
        if (!session) {
            return 'failed';
        }

        return 'idle';
    }

    /**
     * Format command output for display
     */
    private formatCommandOutput(stdout?: string, stderr?: string, error?: string): string {
        let output = '';

        if (stdout) output += stdout;
        if (stderr) output += `\nCreate Error:\n${stderr}`;
        if (error) output += `\nSystem Error: ${error}`;

        if (!output.trim()) {
            output = '✅ Done (no output).';
        }

        return `\`\`\`\n${output}\n\`\`\``;
    }
}
