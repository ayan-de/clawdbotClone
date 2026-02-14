import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IncomingMessage, ChatEvent } from '../adapters/chat-adapter.interface';
import { MessageRouterService } from '../adapters/message-router.service';
import { DesktopGateway } from '../../presentation/websocket/desktop.gateway';

/**
 * Command Execution Service
 * Manages the execution of commands on connected desktops
 */
@Injectable()
export class CommandExecutionService {
    private readonly logger = new Logger(CommandExecutionService.name);

    // Map sessionId to userId/platform for routing results back
    private readonly activeSessions = new Map<string, { userId: string, platform: string }>();

    constructor(
        private readonly desktopGateway: DesktopGateway,
        private readonly messageRouter: MessageRouterService,
    ) { }

    /**
     * Handle incoming chat message
     * Converts natural language to command (in future) or executes direct command
     */
    @OnEvent(ChatEvent.MESSAGE_RECEIVED)
    async handleIncomingMessage(message: IncomingMessage) {
        this.logger.log(`Processing message from ${message.userId}: ${message.content}`);

        // MVP: Treat message content directly as command
        // In future: Use AI Service to generate command
        const command = message.content;
        const sessionId = `${message.platform}-${message.userId}-${Date.now()}`;

        // Store session context
        this.activeSessions.set(sessionId, {
            userId: message.userId,
            platform: message.platform,
        });

        // Find available desktop
        const desktopId = this.desktopGateway.getFirstAvailableDesktop();

        if (!desktopId) {
            this.logger.warn(`No desktops available for user ${message.userId}`);
            await this.messageRouter.sendToPlatform(
                message.platform,
                message.userId,
                "⚠️ No desktop terminals connected. Please launch the desktop client."
            );
            return;
        }

        // Send to desktop
        const success = this.desktopGateway.sendCommand(desktopId, {
            type: 'execute',
            sessionId,
            command,
            userMessage: message.content,
        });

        if (success) {
            await this.messageRouter.sendToPlatform(
                message.platform,
                message.userId,
                `⏳ Executing: \`${command}\``
            );
        } else {
            this.logger.error(`Failed to send command to desktop ${desktopId}`);
            await this.messageRouter.sendToPlatform(
                message.platform,
                message.userId,
                "❌ Failed to reach desktop terminal."
            );
        }
    }

    /**
     * Handle command result from desktop
     */
    @OnEvent('command.result')
    async handleCommandResult(result: any) {
        const { sessionId, stdout, stderr, error } = result;

        // Retrieve session context
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            this.logger.warn(`Received result for unknown session: ${sessionId}`);
            return;
        }

        let output = '';
        if (stdout) output += stdout;
        if (stderr) output += `\nCreate Error:\n${stderr}`;
        if (error) output += `\nSystem Error: ${error}`;

        if (!output.trim()) {
            output = "✅ Command executed successfully (no output).";
        }

        // Send result back to user
        try {
            // Use markdown block for code output
            const formattedOutput = `\`\`\`\n${output}\n\`\`\``;

            await this.messageRouter.sendToPlatform(
                session.platform,
                session.userId,
                formattedOutput
            );

            this.logger.log(`Result sent to ${session.platform} user ${session.userId}`);
        } catch (err) {
            this.logger.error(`Failed to send result to user: ${err}`);
        }
    }
}
