import { Observable } from 'rxjs';

/**
 * Agent Service Interface
 *
 * Defines the contract for the Python Orbit Agent integration.
 *
 * IMPORTANT: The Python Agent is a REQUIRED service. This interface does NOT
 * provide any fallback mechanism. Implementations MUST throw errors if the
 * agent is unavailable.
 *
 * Architecture Responsibility:
 * - Python Agent (Orbit-Agent): LLM reasoning, intent classification, NLP translation
 * - NestJS Bridge (this service): Message routing, session management, agent communication
 * - Desktop TUI: Actual shell command execution (ONLY execution, no intelligence)
 */
export interface IAgentService {
    /**
     * Process user message through Python Orbit Agent
     *
     * The agent performs:
     * - Intent classification (command, question, workflow, email, etc.)
     * - Natural language to shell command translation
     * - Multi-step planning for complex workflows
     *
     * @param sessionId - The Bridge session ID for conversation persistence
     * @param message - The user's natural language input
     * @param userId - The Bridge user ID (not platform-specific ID)
     * @returns AgentResponse with classified intent and action
     * @throws {NotFoundException} If agent service is unavailable
     * @throws {Error} If agent request fails for any reason
     */
    processMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<AgentResponse>;

    /**
     * Stream agent response (for future use)
     *
     * Planned feature for real-time streaming of agent responses via WebSocket.
     * Currently throws an error as not implemented.
     */
    streamMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<void>;
}

/**
 * Agent Response DTO
 *
 * Returned from Python agent after processing a message.
 * The response includes the agent's intent classification and any actions to take.
 */
export interface AgentResponse {
    /** Response messages to show user (text responses) */
    messages: string[];
    /** Classified intent: command, question, workflow, confirmation, email */
    intent: string;
    /** Status of the request */
    status: 'success' | 'error';
    /** If intent is 'command', the actual shell command to execute */
    command?: string;
    /** Whether agent needs confirmation before proceeding (for dangerous operations) */
    needsConfirmation?: boolean;
    /** Confirmation prompt to show user if needsConfirmation is true */
    confirmationPrompt?: string;
}

/**
 * Stream event for real-time updates
 */
export interface AgentStreamEvent {
    type: 'token' | 'tool_start' | 'tool_end' | 'done';
    content?: string;
    tool?: string;
    output?: string;
}
