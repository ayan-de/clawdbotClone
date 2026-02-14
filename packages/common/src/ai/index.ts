// AI service interfaces

export interface AICommandGenerator {
  generateCommand(userInput: string): Promise<string>;
  explainCommand(command: string): Promise<string>;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  model?: string;
  endpoint?: string;
}
