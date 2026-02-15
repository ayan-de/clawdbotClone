import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomingMessage, ChatEvent } from '../adapters/chat-adapter.interface';
import { IMessageRouterService } from '../adapters/interfaces/message-router.interface';
import { ISessionService } from '../session/interfaces/session.service.interface';
import { UsersService } from '../users/users.service';
import { User } from '../domain/entities/user.entity';
import { ICommandExecutionService } from './interfaces/command-execution.interface';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';

/**
 * Command Execution Service
 * Manages the execution of commands on connected desktops
 */
@Injectable()
export class CommandExecutionService implements ICommandExecutionService {
    private readonly logger = new Logger(CommandExecutionService.name);
    // Track running commands by session ID
    private readonly runningCommands = new Map<string, boolean>();

    constructor(
        private readonly desktopGateway: DesktopGateway,
        private readonly messageRouter: IMessageRouterService,
        private readonly sessionService: ISessionService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Handle incoming chat message
     */
    @OnEvent(ChatEvent.MESSAGE_RECEIVED)
    async handleIncomingMessage(message: IncomingMessage) {
        this.logger.log(`Processing message from ${message.userId} (${message.platform}): ${message.content}`);

        try {
            // 1. Find or create user
            let user = await this.usersService.findEntityByEmail(`${message.platform}_${message.userId}@bridge.local`);

            if (!user) {
                // Create guest user
                // We have to use the DTO-based create method or direct repository if exposed.
                // UsersService.create returns DTO.
                // Let's rely on create then findEntity.
                await this.usersService.create({
                    email: `${message.platform}_${message.userId}@bridge.local`,
                    firstName: message.username || 'Guest',
                    lastName: message.platform,
                    displayName: message.username || `Guest ${message.userId}`,
                });
                user = await this.usersService.findEntityByEmail(`${message.platform}_${message.userId}@bridge.local`);
            }

            if (!user) throw new Error("Failed to create user");

            // 2. Get or create session
            const session = await this.sessionService.getOrCreateSession(user, message.platform, {
                platformUserId: message.userId,
                chatId: message.chatId,
                username: message.username,
            });

            // 3. Find available desktop
            // Check if session already has attached desktop
            const desktopId = session.desktopId;

            // Check if user has any connected desktops
            // We can check if this specific session has a connected desktop via the gateway or session service
            // For now, rely on session.desktopId and handle failure if command fails
            if (!desktopId) {
                this.logger.warn(`No desktops available for session ${session.id}`);
                await this.messageRouter.sendToPlatform(
                    message.platform,
                    message.userId,
                    "⚠️ No desktop terminals available. Please connect a desktop client."
                );
                return;
            }

            // 4. Send to desktop
            try {
                await this.desktopGateway.sendCommand(session.id, message.content);

                await this.messageRouter.sendToPlatform(
                    message.platform,
                    message.userId,
                    `⏳ Executing...`
                );
            } catch (error) {
                this.logger.error(`Failed to send command: ${error}`);
                await this.messageRouter.sendToPlatform(
                    message.platform,
                    message.userId,
                    "❌ Failed to reach desktop terminal."
                );
            }

        } catch (error) {
            this.logger.error(`Error processing message: ${error}`);
            await this.messageRouter.sendToPlatform(
                message.platform,
                message.userId,
                "❌ Internal Error"
            );
        }
    }

    /**
     * Handle command result from desktop
     */
    @OnEvent('command.result')
    async handleCommandResult(result: any) {
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

            let output = '';
            if (stdout) output += stdout;
            if (stderr) output += `\nCreate Error:\n${stderr}`;
            if (error) output += `\nSystem Error: ${error}`;

            if (!output.trim()) {
                output = "✅ Done (no output).";
            }

            // Send result back to user
            const formattedOutput = `\`\`\`\n${output}\n\`\`\``;

            await this.messageRouter.sendToPlatform(
                platform,
                userId,
                formattedOutput
            );

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
        options?: { userMessage?: string; userId?: string }
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

            await this.desktopGateway.sendCommand(session.id, command);

            this.runningCommands.set(sessionId, true);

            if (options?.userId && session.metadata?.platform && session.metadata?.platformUserId) {
                await this.messageRouter.sendToPlatform(
                    session.metadata.platform,
                    session.metadata.platformUserId,
                    `⏳ Executing...`
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

            // NOTE: The previous code sent { type: 'cancel' }. 
            // The new Gateway interface strictly takes (sessionId, command, requestId).
            // We would need to handle control signals separately.

            this.logger.warn('Cancel command not yet supported in new Gateway interface');

            /*
            await this.desktopGateway.sendCommand(session.id, 'CTRL+C'); // Hypothetical
            this.runningCommands.delete(sessionId);
            return true;
            */

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

        // Check if session exists
        const session = await this.sessionService.getSession(sessionId);
        if (!session) {
            return 'failed';
        }

        return 'idle';
    }
}
