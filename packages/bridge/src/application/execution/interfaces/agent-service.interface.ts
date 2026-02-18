import { Observable } from 'rxjs';

/**
 * Agent Service Interface
 * Defines contract for AI agent integration
 */
export interface IAgentService {
    /**
     * Process user message through AI agent
     * Returns agent response with intent and action to take
     */
    processMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<AgentResponse>;

    /**
     * Stream agent response (for future use)
     */
    streamMessage(
        sessionId: string,
        message: string,
        userId: string,
    ): Promise<void>;
}

/**
 * Agent Response DTO
 * Returned from Python agent after processing a message
 */
export interface AgentResponse {
    /** Response messages to show user */
    messages: string[];
    /** Classified intent: command, question, workflow, confirmation */
    intent: string;
    /** Status of the request */
    status: 'success' | 'error';
    /** If intent is 'command', the actual command to execute */
    command?: string;
    /** Whether agent needs confirmation before proceeding */
    needsConfirmation?: boolean;
    /** Confirmation prompt if needed */
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
