import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomingMessage, ChatEvent } from '../adapters/chat-adapter.interface';
import { IMessageRouterService } from '../adapters/interfaces/message-router.interface';
import { ISessionService } from '../session/interfaces/session.service.interface';
import { UserOrchestrationService } from './user-orchestration.service';
import { DesktopSelectorService } from './desktop-selector.service';
import { ICommandExecutionService } from './interfaces/command-execution.interface';
import { AgentService } from './agent.service';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';

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
        private readonly desktopGateway: DesktopGateway,
        private readonly messageRouter: IMessageRouterService,
        private readonly sessionService: ISessionService,
        private readonly userOrchestration: UserOrchestrationService,
        private readonly desktopSelector: DesktopSelectorService,
        private readonly agentService: AgentService,
    ) { }

    /**
     * Handle incoming chat message from platforms
     * NOTE: This is disabled - MessageRouterService handles the complete flow
     * from chat → desktop → output routing
     */
    // @OnEvent(ChatEvent.MESSAGE_RECEIVED)
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
     * Routes through Agent service first for NLP translation
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

            // 1. Route through Agent for NLP translation
            const userId = options?.userId || session.metadata?.platformUserId || 'unknown';
            const agentResponse = await this.agentService.processMessage(
                sessionId,
                command,
                userId,
            );

            this.logger.log(
                `Agent response: intent=${agentResponse.intent}, command=${agentResponse.command}`,
            );

            // 2. Handle based on agent's intent classification
            if (agentResponse.intent === 'question') {
                // Direct answer from agent - send to platform
                const answer = agentResponse.messages.join('\n');
                await this.messageRouter.sendToPlatform(
                    session.metadata?.platform || 'telegram',
                    session.metadata?.platformUserId || userId,
                    answer,
                );
                return true;
            }

            if (agentResponse.intent === 'command' && agentResponse.command) {
                // Agent translated to shell command - execute it
                await this.desktopGateway.sendCommand(session.id, agentResponse.command);

                this.runningCommands.set(sessionId, true);

                if (session.metadata?.platform && session.metadata?.platformUserId) {
                    await this.messageRouter.sendToPlatform(
                        session.metadata.platform,
                        session.metadata.platformUserId,
                        '⏳ Executing...',
                    );
                }
                return true;
            }

            // Fallback: Execute as-is
            this.logger.warn(`Unknown agent intent or no command extracted, executing as-is`);
            await this.desktopGateway.sendCommand(session.id, command);

            this.runningCommands.set(sessionId, true);

            if (options?.userId && session.metadata?.platform && session.metadata?.platformUserId) {
                await this.messageRouter.sendToPlatform(
                    session.metadata.platform,
                    session.metadata.platformUserId,
                    '⏳ Executing...',
                );
            }

            return true;
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

            // Not yet supported in new simple interface but can be mapped to a command
            // or we add specific cancel support later. 
            // For now, let's assume sending Ctrl+C or similar is needed, 
            // but the gateway sendCommand only takes a command string.
            // We might need to send a special control command if supported.
            // Since this is MVP, we might log warning or just return false.

            this.logger.warn('Cancel command not yet supported in new Gateway interface');

            return false;
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
