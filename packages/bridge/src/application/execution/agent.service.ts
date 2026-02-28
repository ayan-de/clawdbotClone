import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IAgentService, AgentResponse } from './interfaces/agent-service.interface';

/**
 * Agent Service
 * Handles communication with Python Orbit Agent API
 *
 * NOTE: The Python Agent is a REQUIRED service. This Bridge does NOT have a fallback
 * for direct command execution. All commands MUST go through the Agent for NLP
 * translation and intent classification.
 *
 * Responsibility Split:
 * - Python Agent: LLM reasoning, intent classification, command generation
 * - NestJS Bridge: Message routing, WebSocket management, session persistence
 * - Desktop TUI: Actual shell command execution (only here)
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
     *
     * @throws {NotFoundException} If agent service is unavailable
     * @throws {Error} If agent request fails
     */
    async processMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<AgentResponse> {
        this.logger.log(`Processing message via agent (Session: ${sessionId}, User: ${userId})`);

        try {
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
        } catch (error: any) {
            // The agent is a required service - fail fast if unavailable
            this.logger.error(`Agent request failed: ${error.message}`);

            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new NotFoundException(
                    'Python Agent service is not available. Please ensure the orbit-agent service is running at ' + this.agentBaseUrl,
                );
            }

            if (error.response?.status === 404) {
                throw new NotFoundException(
                    'Agent endpoint not found. Please verify the agent API is available at ' + this.agentBaseUrl,
                );
            }

            throw new Error(
                `Failed to communicate with Agent service: ${error.message || 'Unknown error'}`,
            );
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
