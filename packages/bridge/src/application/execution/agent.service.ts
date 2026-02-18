import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IAgentService, AgentResponse } from './interfaces/agent-service.interface';

/**
 * Agent Service
 * Handles communication with Python Orbit Agent API
 */
@Injectable()
export class AgentService implements IAgentService {
    private readonly logger = new Logger(AgentService.name);
    private readonly agentBaseUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        // Get agent URL from config or default to localhost:8000
        this.agentBaseUrl = this.configService.get<string>('AGENT_API_URL') || 'http://localhost:8000';
        this.logger.log(`Agent service initialized with URL: ${this.agentBaseUrl}`);
    }

    /**
     * Process user message through Python Agent
     */
    async processMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<AgentResponse> {
        try {
            this.logger.log(`Processing message via agent (Session: ${sessionId})`);

            // Call Python agent API
            const response = await this.httpService.axiosRef.post(
                `${this.agentBaseUrl}/api/v1/agent/invoke`,
                {
                    message,
                    session_id: sessionId,
                    user_id: userId,
                },
            );

            const agentResponse: AgentResponse = response.data;

            this.logger.log(
                `Agent responded (Session: ${sessionId}, Intent: ${agentResponse.intent}, Command: ${agentResponse.command || 'none'})`,
            );

            return agentResponse;
        } catch (error) {
            this.logger.error(`Failed to process message via agent: ${error}`);

            // Fall back to treating message as direct command
            // This ensures system still works even if agent is down
            return {
                messages: [`❌ Agent unavailable. Executing as direct command.`],
                intent: 'command',
                status: 'success',
                command: message.trim(),
            };
        }
    }

    /**
     * Stream agent response (for future WebSocket support)
     */
    async streamMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<void> {
        // TODO: Implement WebSocket streaming when Python agent supports it
        throw new Error('Streaming not yet implemented');
    }
}
