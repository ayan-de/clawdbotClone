// Protocol types for WebSocket/HTTP communication

export interface BridgeToDesktop {
  type: 'execute' | 'heartbeat';
  sessionId: string;
  command: string;
  userMessage: string;
}

export interface DesktopToBridge {
  type: 'result' | 'error' | 'status';
  sessionId: string;
  command: string;
  stdout?: string;
  stderr?: string;
  success?: boolean;
}

export interface ChatAdapter {
  platform: 'telegram' | 'whatsapp' | 'slack' | 'discord';
  sendMessage(userId: string, message: string): Promise<void>;
  sendStream(userId: string, data: ReadableStream): Promise<void>;
}
