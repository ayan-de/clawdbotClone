import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomingMessage, ChatEvent } from '../adapters/chat-adapter.interface';
import { MessageRouterService } from '../adapters/message-router.service';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';
import { SessionService } from '../session/session.service';
import { UsersService } from '../users/users.service';
import { User } from '../domain/entities/user.entity';

/**
 * Command Execution Service
 * Manages the execution of commands on connected desktops
 */
@Injectable()
export class CommandExecutionService {
    private readonly logger = new Logger(CommandExecutionService.name);

    constructor(
        private readonly desktopGateway: DesktopGateway,
        private readonly messageRouter: MessageRouterService,
        private readonly sessionService: SessionService,
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
            // Check if session already has attached desktop?
            let desktopId = session.desktopId;

            // Verify desktop is still connected
            if (!desktopId || !this.desktopGateway.sendCommand(desktopId, { type: 'ping' })) {
                // Find new desktop
                desktopId = this.desktopGateway.getFirstAvailableDesktop() || undefined; // Handle null
                if (desktopId) {
                    await this.sessionService.attachDesktop(session.id, desktopId);
                }
            }

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
            const success = this.desktopGateway.sendCommand(desktopId, {
                type: 'execute',
                sessionId: session.id, // Use UUID
                command: message.content,
                userMessage: message.content,
            });

            if (success) {
                await this.messageRouter.sendToPlatform(
                    message.platform,
                    message.userId,
                    `⏳ Executing...`
                );
            } else {
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
}
