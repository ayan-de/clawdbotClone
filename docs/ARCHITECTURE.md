# ClawDBot Clone - Architecture & Implementation Plan

## Overview
A three-tier scalable architecture for an AI-powered terminal bot. Clients from Telegram, WhatsApp, Slack, or any messaging platform send natural language commands via a Bridge Server, which routes to Desktop TUI endpoints that execute shell commands safely on Linux.

**Why a Bridge Server?**
- **Scalability**: Handle multiple messaging clients
- **Security**: Desktop remains behind firewall
- **Cloud Ready**: Deploy bridge server independently
- **Multi-user**: Support concurrent users
- **Rate Limiting**: Protect against abuse
- **Reliability**: Connection management for users

**Why Start with Telegram?**
- ✅ **Fastest MVP**: No app store, no build process, instant setup
- ✅ **Easier API**: Telegram Bot API is simpler than Android WebSocket
- ✅ **Accessible**: Works from any phone with Telegram
- ✅ **Real-time**: WebSocket support for streaming outputs
- ✅ **Design Pattern Ready**: Adapter pattern makes adding WhatsApp/Slack later trivial

---

## Architecture Diagram (Three-Tier with Adapter Pattern)

```
┌──────────────────┐          HTTP/WebSocket          ┌─────────────────┐         WebSocket          ┌─────────────────┐         Child Process       ┌─────────────────┐
│  Telegram Bot    │◄───────────────────────────────►│  Bridge Server  │◄───────────────────────────►│  Desktop TUI    │◄───────────────────────────►│  Linux Kernel   │
│   (Adapter 1)    │         (Telegram API)          │  (Express/Socket│        (Socket.io)         │  (Inquirer.js)  │        (exec/spawn)         │  (Shell/Linux)  │
└──────────────────┘                                  │    io)          │         (Registered)        └─────────────────┘                              └─────────────────┘
        │                                                     │
        │                                                     │
        ▼                                                     ▼
   User Input                                        AI Integration
   (natural language)                              (Claude/OpenAI/Ollama)
        ▲
        │
        │  (later adapters can be added)
        │
        ├─►  WhatsApp Bot (Adapter 2)
        ├─►  Slack Bot (Adapter 3)
        ├─►  Discord Bot (Adapter 4)
        └─►  Custom API (Adapter N)
```

---

## Tech Stack Selection

### Telegram Bot Adapter (Client)
- **Framework**: Telegram Bot API (node-telegram-bot-api)
- **Communication**: HTTP + Webhook
- **Real-time**: WebSocket for streaming outputs
- **Authentication**: Bot Token
- **Package Structure**:
  ```
  bridge/
  ├── adapters/
  │   ├── telegram/
  │   │   ├── telegramAdapter.js        # Main adapter
  │   │   ├── messageHandler.js         # Parse incoming messages
  │   │   ├── outputSender.js           # Send terminal output
  │   │   └── messageStore.js           # Store message history
  │   ├── whatsapp/
  │   │   ├── whatsappAdapter.js        # WhatsApp adapter (future)
  │   │   └── webhooks.js                # WhatsApp webhook handler
  │   ├── slack/
  │   │   ├── slackAdapter.js           # Slack adapter (future)
  │   │   └── slashCommands.js           # Slash command handler
  │   └── discord/
  │       └── discordAdapter.js         # Discord adapter (future)
  ```

### Adapter Design Pattern
The **Adapter Pattern** allows the bridge server to communicate with any messaging platform without changes:

```javascript
// Common adapter interface
class MessagingAdapter {
  async sendToUser(userId, message, options) {
    throw new Error("Must implement sendToUser()");
  }

  async sendOutputStream(userId, dataStream) {
    throw new Error("Must implement sendOutputStream()");
  }

  async getActiveUsers() {
    throw new Error("Must implement getActiveUsers()");
  }
}

// Telegram implementation
class TelegramAdapter extends MessagingAdapter {
  async sendToUser(userId, message) {
    return await this.bot.sendMessage(userId, message);
  }
}

// WhatsApp implementation (future)
class WhatsAppAdapter extends MessagingAdapter {
  async sendToUser(userId, message) {
    return await this.messageApi.send({
      to: userId,
      text: message
    });
  }
}
```

### Node.js Bridge Server (Controller)
- **Framework**: Express.js + Socket.io
- **Webhook Handler**: node-telegram-bot-api
- **Adapter System**: Strategy pattern for messaging platforms
- **TUI Library**: Inquirer.js, Blessed.js, or CLI Highlight (for desktop)
- **Terminal Colors**: Chalk
- **Command Execution**: child_process.exec() for safety
- **Validation**: Command whitelist/blacklist + sanitization
- **Path Management**: path.join() + checkIsInsideAllowedDir()
- **Database**: SQLite (session storage, usage metrics)

### AI Backend
- **Option A**: OpenAI API (GPT-4o)
- **Option B**: Anthropic Claude API
- **Option C**: Local Ollama (Mistral/LLaMA)
- **Framework**: OpenAI Node SDK

### Database (Optional)
- **Option A**: SQLite (simple JSON storage)
- **Option B**: PostgreSQL (for command history, user accounts)
- **Option C**: In-memory (MVP)

### Communication Protocol
- **Bridge ↔ Desktop**: WebSocket (Socket.io) for real-time command execution
- **Telegram ↔ Bridge**: HTTP/Webhook for incoming messages and responses
- **Message Format**: JSON
- **Webhook URL**: https://your-domain.com/webhooks/telegram

---

## System Components

### 1. Bridge Server (Middle Layer)
**Directory**: `/bridge`

**Role**: Acts as a middleman between mobile clients and desktop endpoints. Handles routing, authentication, rate limiting, and multi-desktop management.

**Key Files**:
```
bridge/
├── src/
│   ├── index.js                    # Entry point
│   ├── server.js                   # Express + Socket.io setup
│   ├── desktopRegistry.js         # Manage connected desktops
│   ├── commandRouter.js            # Route commands to available desktops
│   ├── aiService.js                # AI API integration (optional)
│   ├── rateLimiter.js              # Protect against abuse
│   ├── authMiddleware.js           # JWT token validation
│   ├── metrics.js                  # Track usage statistics
│   ├── messageHandler.js           # Handle incoming/outgoing messages
│   ├── desktopDiscovery.js         # Find available desktops
│   └── utils.js                    # Helper functions
├── package.json
├── .env
├── .gitignore
└── README.md
```

**Core Responsibilities**:
1. **Authentication**: Validate mobile client tokens
2. **Desktop Registration**: Accept desktop TUI connections and register capabilities
3. **Command Routing**: Distribute commands to appropriate desktops
4. **Multi-Desktop Support**: Handle multiple desktop endpoints simultaneously
5. **Heartbeat Monitoring**: Track desktop availability
6. **Rate Limiting**: Prevent API abuse
7. **Error Handling**: Route errors back to appropriate client
8. **Metrics**: Log command usage and timings

### 2. Desktop TUI Endpoint (Bottom Layer)
**Directory**: `/desktop` or `/server`

**Role**: Runs on Linux desktop, executes shell commands safely, exposes TUI interface.

**Key Files**:
```
desktop/
├── src/
│   ├── index.js                    # Entry point
│   ├── server.js                   # Express + Socket.io setup
│   ├── desktopClient.js            # Connect to Bridge Server
│   ├── commandHandler.js          # Validates and executes commands
│   ├── aiService.js               # AI API integration (optional)
│   ├── terminal.js                # TUI rendering
│   ├── security.js                # Security utilities
│   ├── capabilities.js            # Expose available commands
│   └── utils.js                   # Helper functions
├── package.json
├── .env
├── .gitignore
└── README.md
```

**Core Responsibilities**:
1. Register with Bridge Server and report capabilities
2. Listen for WebSocket commands from Bridge Server
3. Validate incoming commands against capabilities
4. Send commands to AI (optional) for translation
5. Execute shell commands safely
6. Stream terminal output back to Bridge Server
7. Send TUI status updates
8. Respond to heartbeat requests

### 3. Android App Client (Top Layer)
**Directory**: `/android/app`

**Key Files**:
```
app/
├── src/
│   ├── main/
│   │   ├── java/com/clawdbot/android/
│   │   │   ├── MainActivity.kt
│   │   │   ├── WebSocketClient.kt
│   │   │   ├── CommandService.kt
│   │   │   ├── MessageAdapter.kt
│   │   │   ├── SecureSocket.kt
│   │   │   └── BridgeService.kt
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   ├── values/
│   │   │   └── drawable/
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── app/build.gradle.kts
└── proguard-rules.pro
```

**Core Responsibilities**:
1. Authenticate with Bridge Server (JWT token)
2. Discover available Desktop TUI endpoints
3. Send natural language commands to Bridge Server
4. Receive results from Bridge Server
5. Display terminal output and AI responses
6. Handle connection status (connect/disconnect/reconnect)
7. Display available endpoints (if multiple desktops)

---

## AI Integration

### AI Command Generator (Optional but Recommended)
**File**: `src/aiService.js` (in both Bridge Server and Desktop TUI)

**Functionality**:
- Take natural language input
- Generate shell commands
- Include safety checks (no rm -rf, exec, etc.)
- Use system prompts for behavior

**Example System Prompt**:
```
You are a Linux terminal assistant. Generate ONLY valid shell commands.
Command restrictions:
- No dangerous commands (rm -rf, sudo, reboot, etc.)
- Default to safe operations (ls, cd, mkdir, cat)
- Always use valid paths
- Return only the command, nothing else
```

---

## Command Validation & Execution

### Command Validator & Executor
**File**: `src/commandHandler.js`

**Security Checklist**:
1. **Path Validation**: Check if target directory is within home directory
2. **Command Whitelist**: Only allow safe commands
3. **Input Sanitization**: Remove special characters
4. **Timeout Handling**: Kill long-running commands
5. **Output Capture**: Read stderr/stdout safely
6. **File Permission Checks**: Ensure read/write access

**Whitelist Commands**:
```javascript
const safeCommands = [
  'ls', 'cd', 'pwd', 'mkdir', 'touch', 'cat', 'echo',
  'grep', 'find', 'cp', 'mv', 'rm', 'chmod', 'chown',
  'date', 'whoami', 'uname', 'sleep', 'head', 'tail',
  'wc', 'sort', 'uniq', 'cat', 'head', 'tail'
];
```

---

## Communication Protocol

### Telegram Bot API (HTTP/Webhook)

**Incoming Command (Telegram ↔ Bridge Server)**:
```json
{
  "message": {
    "message_id": 12345,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "User"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "text": "Create a folder named project-beta",
    "date": 1707922200
  },
  "session_id": "telegram-user-123456789"
}
```

**Bridge Server Response to Telegram**:
```json
// Success response
{
  "session_id": "telegram-user-123456789",
  "message": {
    "text": "✅ Creating folder: project-beta"
  },
  "status": "processing"
}

// Output stream (sent via another API call)
{
  "session_id": "telegram-user-123456789",
  "output": "mkdir: created directory 'project-beta'\n\n" // Sent via sendMessage
}
```

**Bridge Server → Desktop TUI**:
```json
{
  "type": "execute",
  "data": {
    "command": "mkdir project-beta",
    "sessionId": "uuid-generated",
    "userMessage": "Create a folder named project-beta"
  }
}
```

**Desktop TUI → Bridge Server**:
```json
{
  "type": "result",
  "data": {
    "command": "mkdir project-beta",
    "stdout": "mkdir: created directory 'project-beta'",
    "stderr": "",
    "success": true
  }
}
```

## Adapter Pattern Architecture

### Strategy Pattern for Messaging Platforms

The architecture uses the **Strategy Pattern** to support multiple messaging platforms without modifying the core Bridge Server:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Bridge Server Layer                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Message Router (Strategy Pattern)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │ Telegram     │  │ WhatsApp     │  │ Slack        │        │   │
│  │  │ Adapter      │  │ Adapter      │  │ Adapter      │        │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### How the Adapter Pattern Works

**Step 1**: Define Common Interface
```javascript
// core/MessageAdapter.js
class MessageAdapter {
  constructor(config) {
    this.config = config;
    this.platform = config.platform;
  }

  // Platform-specific initialization
  async initialize() {
    throw new Error("Must implement initialize()");
  }

  // Send a message to a user
  async sendMessage(userId, text, options = {}) {
    throw new Error("Must implement sendMessage()");
  }

  // Send streaming output
  async sendOutputStream(userId, stream) {
    throw new Error("Must implement sendOutputStream()");
  }

  // Get available platforms
  static getAvailablePlatforms() {
    return ['telegram', 'whatsapp', 'slack', 'discord'];
  }
}
```

**Step 2**: Implement Telegram Adapter
```javascript
// adapters/telegram/telegramAdapter.js
const { Webhook } = require('telebot');
const MessageAdapter = require('../../core/MessageAdapter');

class TelegramAdapter extends MessageAdapter {
  constructor(config) {
    super({
      ...config,
      platform: 'telegram'
    });
    this.bot = null;
  }

  async initialize() {
    this.bot = new Webhook({ token: this.config.botToken });
    this.bot.on('text', (msg) => this.handleMessage(msg));
    await this.bot.start();
  }

  async handleMessage(message) {
    const sessionId = this.generateSessionId(message.from.id);
    this.messageHandler(message.text, sessionId);
  }

  async sendMessage(userId, text, options = {}) {
    return await this.bot.sendMessage(userId, text, options);
  }

  async sendOutputStream(userId, data) {
    // Send output chunks as separate messages
    for (const chunk of data) {
      await this.sendMessage(userId, chunk);
    }
  }

  generateSessionId(userId) {
    return `telegram-${userId}`;
  }
}
```

**Step 3**: Implement WhatsApp Adapter (Future)
```javascript
// adapters/whatsapp/whatsappAdapter.js
const MessageAdapter = require('../../core/MessageAdapter');

class WhatsAppAdapter extends MessageAdapter {
  constructor(config) {
    super({
      ...config,
      platform: 'whatsapp'
    });
    this.api = null;
  }

  async initialize() {
    this.api = new WhatsAppAPI({
      token: this.config.apiToken
    });
  }

  async handleMessage(webhookData) {
    const sessionId = this.generateSessionId(webhookData.from);
    this.messageHandler(webhookData.message, sessionId);
  }

  async sendMessage(phoneNumber, text, options = {}) {
    return await this.api.sendMessage(phoneNumber, text, options);
  }

  async sendOutputStream(phoneNumber, stream) {
    // Send as WhatsApp Template Messages
    await this.api.sendTemplate(phoneNumber, stream.join('\n'));
  }

  generateSessionId(phoneNumber) {
    return `whatsapp-${phoneNumber}`;
  }
}
```

**Step 4**: Use in Bridge Server
```javascript
// bridge/src/index.js
const MessageAdapter = require('./core/MessageAdapter');
const TelegramAdapter = require('./adapters/telegram/telegramAdapter');
const WhatsAppAdapter = require('./adapters/whatsapp/whatsappAdapter');

class BridgeServer {
  constructor() {
    this.adapters = new Map();
    this.messageQueue = new Map();
  }

  async initialize() {
    // Initialize Telegram
    const telegram = new TelegramAdapter({
      botToken: process.env.TELEGRAM_BOT_TOKEN
    });
    await telegram.initialize();
    this.adapters.set('telegram', telegram);

    // Initialize WhatsApp (if configured)
    if (process.env.WHATSAPP_API_TOKEN) {
      const whatsapp = new WhatsAppAdapter({
        apiToken: process.env.WHATSAPP_API_TOKEN
      });
      await whatsapp.initialize();
      this.adapters.set('whatsapp', whatsapp);
    }
  }

  async handleIncomingMessage(platform, message, sessionId) {
    const adapter = this.adapters.get(platform);
    if (adapter) {
      await adapter.sendMessage(sessionId, `Processing: ${message}`);
      this.messageQueue.set(sessionId, message);
    }
  }
}
```

### Benefits of Adapter Pattern

1. **Scalability**: Add new platforms without touching core logic
2. **Testability**: Mock adapters for unit testing
3. **Flexibility**: Enable/disable platforms independently
4. **Maintainability**: Each adapter is isolated and independent
5. **Extensibility**: Easy to add new platforms

### Supported Platforms (MVP → Future)

**MVP (First Release)**:
- ✅ Telegram Bot (HTTP/Webhook)

**Future Releases**:
- ⏳ WhatsApp Business API (Webhooks)
- ⏳ Slack Bot API (Slash commands)
- ⏳ Discord Bot API (Interactions)
- ⏳ Custom API (REST endpoints)
- ⏳ Email Adapter
- ⏳ SMS Adapter

---

### Connection Lifecycle

1. **Telegram**: Bot receives message via webhook
2. **Bridge**: Routes message to appropriate adapter
3. **Desktop**: Register with Bridge Server and report capabilities
4. **Command Flow**: Adapter → Bridge → Desktop → Shell → Bridge → Adapter → User
5. **Reconnect**: Bot handles errors and retries naturally

---

## Data Flow Example

### Scenario: User asks to create a folder

**Step 1**: Android App sends message to Bridge Server
```
Kotlin: socket.emit("command", {"message": "Make a folder for my new project"})
```

**Step 2**: Bridge Server authenticates and routes to available desktop
```javascript
// bridgeServer.js
socket.on("command", async (data) => {
  // 1. Authenticate
  if (!await authMiddleware.validateToken(data.token)) {
    socket.emit("error", { message: "Unauthorized" });
    return;
  }

  // 2. Find available desktop
  const desktop = commandRouter.findDesktopWithCapability("mkdir");
  if (!desktop) {
    socket.emit("error", { message: "No desktop available" });
    return;
  }

  // 3. Send to desktop
  await sendToDesktop(desktop.id, {
    type: "execute",
    data: {
      command: data.message,
      sessionId: data.sessionId
    }
  });
});
```

**Step 3**: Bridge Server sends to Desktop TUI
```javascript
// commandRouter.js
async sendToDesktop(desktopId, data) {
  const socket = desktopRegistry[desktopId]?.socket;
  if (socket) {
    socket.emit(data.type, data);
  }
}
```

**Step 4**: Desktop TUI validates and executes
```javascript
// desktopServer.js
socket.on("execute", async (data) => {
  // 1. Validate desktop has capability
  const desktop = desktopRegistry[data.desktopId];
  if (!desktop.capabilities.includes("mkdir")) {
    return { error: "Command not supported" };
  }

  // 2. Execute command
  const result = await commandHandler.execute(data.command);
  socket.emit("result", { ...result, command: data.command });
});
```

**Step 5**: Command executor
```javascript
// commandHandler.js
async execute(command) {
  // 1. Validate command against whitelist
  if (!whitelist.includes(command.split(' ')[0])) {
    return { error: "Command not allowed" };
  }

  // 2. Check directory safety
  const targetDir = command.match(/cd\s+(\S+)/)?.[1];
  if (targetDir && !isInsideHome(targetDir)) {
    return { error: "Directory outside allowed path" };
  }

  // 3. Execute command
  return new Promise((resolve) => {
    exec(command, { cwd: process.env.HOME, timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ command, stdout, stderr });
    });
  });
}
```

**Step 6**: Bridge Server sends result back to mobile
```javascript
// bridgeServer.js (continuing)
desktop.on("result", (data) => {
  socket.emit("output", data);
});
```

**Step 7**: Android App displays result
```
Mobile: Displays "Folder created: project-beta"
```

---

## Data Flow Example

### Scenario: User asks to create a folder

**Step 1**: Android App sends message
```
Kotlin: socket.emit("command", {"message": "Make a folder for my new project"})
```

**Step 2**: Node.js receives and validates
```javascript
// server.js
socket.on("command", async (data) => {
  // 1. Validate input
  if (!isValidInput(data.message)) {
    socket.emit("error", { message: "Invalid command" });
    return;
  }

  // 2. Send to AI
  const aiCommand = await aiService.generateCommand(data.message);
  socket.emit("ai_response", aiCommand);

  // 3. Execute command
  const result = await commandHandler.execute(aiCommand.command);
  socket.emit("output", result);
});
```

**Step 3**: AI generates command
```javascript
// aiService.js
async generateCommand(userInput) {
  const prompt = `
    User wants to: ${userInput}
    Generate a safe bash command to accomplish this.
    Return ONLY the command, no explanations.
  `;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50
  });
  return { command: response.choices[0].message.content.trim() };
}
```

**Step 4**: Command executor
```javascript
// commandHandler.js
async execute(command) {
  // 1. Validate command against whitelist
  if (!whitelist.includes(command.split(' ')[0])) {
    return { error: "Command not allowed" };
  }

  // 2. Check directory safety
  const targetDir = command.match(/cd\s+(\S+)/)?.[1];
  if (targetDir && !isInsideHome(targetDir)) {
    return { error: "Directory outside allowed path" };
  }

  // 3. Execute command
  return new Promise((resolve) => {
    exec(command, { cwd: process.env.HOME, timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ command, stdout, stderr });
    });
  });
}
```

**Step 5**: Send output to client
```javascript
// server.js (continued)
socket.emit("output", result);

// TUI display
terminal.log(`$ ${command}`);
terminal.log(result.stdout);
```

---

## Security Architecture

### Command Sanitization
```javascript
function sanitizeCommand(command) {
  // Remove special characters that could allow injection
  return command
    .replace(/;/g, '')
    .replace(/\|/g, '')
    .replace(/&/g, '')
    .replace(/\n/g, '')
    .trim();
}
```

### Path Validation
```javascript
function isInsideHome(targetPath) {
  const home = process.env.HOME;
  const absolutePath = path.resolve(targetPath);

  // Check if path is within home directory
  return absolutePath.startsWith(home + '/') ||
         absolutePath === home ||
         absolutePath.startsWith(home + '\\');
}
```

### Timeout Protection
```javascript
function executeWithTimeout(command, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // Kill process after timeout
      kill(process.pid, 'SIGTERM');
      reject(new Error('Command timeout'));
    }, timeout);

    exec(command, (error, stdout, stderr) => {
      clearTimeout(timeoutId);
      resolve({ error, stdout, stderr });
    });
  });
}
```

---

## MVP Feature Breakdown

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up Node.js project with Express + Socket.io
- [ ] Implement Webhook server for Telegram Bot API
- [ ] Create MessageAdapter base class
- [ ] Create Telegram Adapter implementation
- [ ] Setup project structure with adapters/

### Phase 2: Bridge Server & Desktop Connection (Week 2)
- [ ] Implement Bridge Server with message routing
- [ ] Implement desktop TUI with Socket.io
- [ ] Desktop registration with Bridge Server
- [ ] Implement command validation in Bridge
- [ ] Test flow: Telegram → Bridge → Desktop

### Phase 3: Command Execution (Week 3)
- [ ] Implement basic command whitelist
- [ ] Add path validation (home directory only)
- [ ] Execute shell commands via child_process
- [ ] Stream output back to Bridge
- [ ] Handle errors gracefully

### Phase 4: AI Integration (Week 4)
- [ ] Set up OpenAI/Anthropic API integration
- [ ] Create prompt engineering for command generation
- [ ] Add command validation before AI
- [ ] Test AI command generation
- [ ] Add command explanation to responses

### Phase 5: Polish & Security (Week 5)
- [ ] Add comprehensive command logging
- [ ] Implement rate limiting
- [ ] Add session management
- [ ] Create usage statistics
- [ ] Write tests for command execution
- [ ] Add error handling

---

## Key Challenges & Solutions

### Challenge 1: Security
**Risk**: Executing arbitrary commands could damage system
**Solution**: Strict whitelist, path validation, input sanitization

### Challenge 2: Real-time Output
**Risk**: Waiting for commands to complete blocks UI
**Solution**: Stream output chunks, use promises with timeouts

### Challenge 3: AI Trust
**Risk**: AI might generate unsafe commands
**Solution**: Validate AI-generated commands before execution

### Challenge 4: Connection Stability
**Risk**: WebSocket disconnects on network issues
**Solution**: Auto-reconnect with exponential backoff, message queue

### Challenge 5: Cross-platform
**Risk**: Commands behave differently on Linux/macOS/Windows
**Solution**: Linux-first implementation, document platform differences

---

## Development Setup

### Prerequisites
- **Node.js** >= 18.x
- **Android Studio** with Kotlin SDK
- **OpenAI API key** (or Anthropic Ollama)
- **Git** for version control

{"token": "$TOKEN"}
Select Language: Kotlin
Select Minimum SDK: API 21+
Configure project name: ClawBot
```

---

## Deployment Plan

### Phase 1: Local Development
- Run Node.js server locally on desktop
- Run Android app in emulator
- Test WebSocket communication

### Phase 2: Local Network
- Expose Node.js to local network
- Test from phone on same WiFi

### Phase 3: Cloud Deployment (Optional)
- Deploy Node.js server on VPS (Render/Heroku)
- Use ngrok for temporary HTTPS tunneling
- Configure SSL certificates

---

## Future Enhancements

1. **SSH Integration**: Connect to remote servers
2. **Script Library**: Pre-built command templates
3. **Voice Commands**: Android speech-to-text integration
4. **Command History**: Persist command logs
5. **User Accounts**: Multi-user support
6. **Cloud Synchronization**: Sync across devices
7. **Web Dashboard**: Web interface for non-mobile users
8. **Custom Prompts**: Allow users to configure AI behavior
9. **File Management**: Advanced file operations
10. **Process Monitoring**: Check running processes

---

## MVP Success Criteria

- User can send natural language commands via Android
- Node.js server receives, validates, and executes commands
- Output is displayed back to user in real-time
- Commands stay within safe directory (home)
- System handles network disconnections gracefully
- No system damage from executed commands
- All commands are logged for review

---

## Learning Resources

### WebSocket
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [WebSocket API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### Node.js Terminal
- [Inquirer.js](https://www.npmjs.com/package/inquirer)
- [Blessed.js](https://github.com/chocolateboy/blessed)

### Android WebSocket
- [OkHttp WebSocket](https://square.github.io/okhttp/west_2/)
- [Kotlinx Coroutines for Async](https://kotlinlang.org/docs/coroutines-overview.html)

### AI Command Generation
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Command Injection Prevention](https://owasp.org/www-community/attacks/Command_Injection)

---

## Summary

This architecture provides a secure, scalable foundation for a terminal bot that:
1. Allows natural language commands from Android
2. Executes safe shell commands on Linux
3. Uses AI to translate user intent to valid commands
4. Provides real-time feedback via WebSocket
5. Enforces strict security boundaries

The MVP will focus on core functionality with room for future enhancements as the project grows.
