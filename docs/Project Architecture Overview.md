  Project Architecture Overview

  This is a multi-platform CLI assistant with a monorepo structure:
  - bridge (NestJS server) - Central hub for WebSocket/HTTP communication
  - desktop (TUI client) - Terminal-based user interface
  - adapters - Platform-specific implementations (Telegram, WhatsApp, Discord, etc.)
  - common - Shared types, utilities, and interfaces

---
  Design Patterns to Follow

  1. Adapter Pattern

  Already evident in packages/common/src/types/index.ts:19. Critical for supporting multiple chat platforms.

  // ChatAdapter interface - contract for all platform adapters
  export interface ChatAdapter {
    platform: 'telegram' | 'whatsapp' | 'slack' | 'discord';
    sendMessage(userId: string, message: string): Promise<void>;
    sendStream(userId: string, data: ReadableStream): Promise<void>;
  }

  // Concrete implementations
  class TelegramAdapter implements ChatAdapter { ... }
  class WhatsAppAdapter implements ChatAdapter { ... }

  2. Strategy Pattern

  For AI command generation with different providers:

  // packages/common/src/ai/index.ts already defines this
  interface AICommandGenerator {
    generateCommand(userInput: string): Promise<string>;
    explainCommand(command: string): Promise<string>;
  }

  // Implementations
  class OpenAICommandGenerator implements AICommandGenerator { ... }
  class AnthropicCommandGenerator implements AICommandGenerator { ... }
  class OllamaCommandGenerator implements AICommandGenerator { ... }

  3. Singleton Pattern

  For WebSocket connection management in the bridge:

  @Injectable()
  export class WebSocketGateway {
    private static instance: WebSocketGateway;
    // Single connection manager across the app
  }

  4. Observer Pattern / Pub-Sub

  For real-time command execution updates (stdout, stderr, status):

  // Packages can subscribe to execution events
  class CommandExecutor extends Observable {
    execute(command: string): void {
      // Emit progress events
      this.notify({ type: 'progress', data: '...' });
      this.notify({ type: 'complete', data: '...' });
    }
  }

  5. Factory Pattern

  For creating adapter instances dynamically:

  class AdapterFactory {
    static create(platform: string, config: AdapterConfig): ChatAdapter {
      switch(platform) {
        case 'telegram': return new TelegramAdapter(config);
        case 'whatsapp': return new WhatsAppAdapter(config);
        // ...
      }
    }
  }

  6. Dependency Injection Pattern

  NestJS already provides this natively. Use it extensively:

  // In bridge/src/app.module.ts
  @Module({
    providers: [
      AICommandGenerator,
      ChatAdapter,
      CommandExecutorService,
    ],
  })

  7. Command Pattern

  For CLI command execution with undo/redo support:

  interface Command {
    execute(): Promise<Result>;
    undo(): Promise<void>;
  }

  class LsCommand implements Command { ... }
  class CdCommand implements Command { ... }

  8. Decorator Pattern

  For command validation and security layers:

  @SecureCommand  // Security decorator
  @RateLimited    // Rate limiting decorator
  @ValidateInput  // Validation decorator
  class ExecuteCommand { ... }

  9. Proxy Pattern

  For WebSocket connection handling:

  class WebSocketProxy implements ChatAdapter {
    private realAdapter: ChatAdapter;
    // Handles reconnection, retries, caching
  }

  10. Middleware Pattern

  For request/response processing in the bridge:

  // NestJS middleware pipeline
  app.use(authenticationMiddleware);
  app.use(rateLimitMiddleware);
  app.use(commandValidationMiddleware);

---
  SOLID Principles

  ┌───────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │         Principle         │                                            Application in Orbit                                            │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ S - Single Responsibility │ Each adapter handles only its platform; bridge only manages connections; common only shares types          │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ O - Open/Closed           │ Add new chat platforms by implementing ChatAdapter without modifying existing code                         │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ L - Liskov Substitution   │ Any ChatAdapter implementation can be used interchangeably                                                 │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ I - Interface Segregation │ Keep interfaces focused - ChatAdapter vs AICommandGenerator - don't force adapters to implement AI methods │
  ├───────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ D - Dependency Inversion  │ Depend on abstractions (ChatAdapter, AICommandGenerator), not concrete implementations                     │
  └───────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

---
  KISS (Keep It Simple, Stupid)

  - Use NestJS built-in modules ( Guards, Interceptors, Pipes ) instead of custom implementations
  - Don't over-engineer the TUI - use libraries like blessed or ink
  - Start with simple REST endpoints, add WebSocket only when real-time is needed
  - Avoid unnecessary abstraction layers

---
  Additional Best Practices

  DRY (Don't Repeat Yourself)

  - Share all types in packages/common/src/types
  - Security utilities in packages/common/src/security
  - Common validation logic in packages/common/src/validators

  YAGNI (You Aren't Gonna Need It)

  - Don't implement features for future platforms (Matrix, Signal) until needed
  - Don't add complex caching before profiling shows it's necessary

  Clean Architecture Layers

  ┌─────────────────────────────────────┐
  │   Presentation Layer (TUI, Web)     │
  ├─────────────────────────────────────┤
  │   Application Layer (Bridge API)    │
  ├─────────────────────────────────────┤
  │   Domain Layer (Commands, AI, etc)  │
  ├─────────────────────────────────────┤
  │   Infrastructure (Adapters, WS)    │
  └─────────────────────────────────────┘