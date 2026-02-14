# Quick Setup: Initialize Monorepo

## Step 1: Create Monorepo Structure

```bash
# Create root directory
mkdir clawdbot-clone
cd clawdbot-clone
git init

# Create workspace configuration
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "clawdbot-clone",
  "version": "1.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^1.11.0"
  },
  "private": true
}
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF
```

## Step 2: Create Packages Directory Structure

```bash
# Create all package directories
mkdir -p packages/{bridge,desktop,adapters/{telegram,whatsapp,slack,discord},common/src/{types,validators,security,ai,utils}}
mkdir -p apps/dashboard

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.turbo/
.env
*.log
EOF
```

## Step 3: Create Common Package

```bash
# packages/common/package.json
cat > packages/common/package.json << 'EOF'
{
  "name": "@clawdbot/common",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./validators": "./dist/validators/index.js",
    "./security": "./dist/security/index.js",
    "./ai": "./dist/ai/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.0.0",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF

# packages/common/tsconfig.json
cat > packages/common/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

## Step 4: Create Bridge Package (NestJS)

```bash
# Initialize NestJS
cd packages/bridge
npx @nestjs/cli new . --skip-git --package-manager pnpm

# Update package.json for monorepo
cat > package.json << 'EOF'
{
  "name": "@clawdbot/bridge",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "test": "jest"
  },
  "dependencies": {
    "@clawdbot/common": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/websockets": "^10.0.0",
    "socket.io": "^4.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/socket.io": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
```

## Step 5: Create Desktop Package

```bash
# packages/desktop/package.json
cat > packages/desktop/package.json << 'EOF'
{
  "name": "@clawdbot/desktop",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/main.js",
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@clawdbot/common": "workspace:*",
    "socket.io-client": "^4.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "blessed": "^0.1.81",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.0"
  }
}
EOF

# packages/desktop/tsconfig.json
cat > packages/desktop/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

## Step 6: Create Telegram Adapter Package

```bash
# packages/adapters/telegram/package.json
cat > packages/adapters/telegram/package.json << 'EOF'
{
  "name": "@clawdbot/adapters-telegram",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@clawdbot/common": "workspace:*",
    "node-telegram-bot-api": "^0.63.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
```

## Step 7: Install Dependencies and Start

```bash
# Return to root
cd ../..

# Install pnpm
npm install -g pnpm

# Install all dependencies
pnpm install

# Start all packages in dev mode
pnpm run dev

# This will:
# 1. Build common package
# 2. Build adapters
# 3. Start desktop TUI
# 4. Start bridge server
# All running together!
```

## Step 8: Create Development Script (Optional)

```bash
# Create dev script
cat > dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting ClawDBot Development..."

# Start desktop in background
echo "🖥️  Starting Desktop TUI..."
cd packages/desktop
pnpm run dev &
DESKTOP_PID=$!
cd ../..

# Start bridge server
echo "🌉 Starting Bridge Server..."
cd packages/bridge
pnpm run dev &
BRIDGE_PID=$!
cd ../..

# Wait for processes
echo "✅ All services started!"
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
  echo "Stopping services..."
  kill $DESKTOP_PID 2>/dev/null
  kill $BRIDGE_PID 2>/dev/null
  exit
}

trap cleanup INT TERM

# Wait forever
wait
EOF

chmod +x dev.sh

# Now you can start everything with:
./dev.sh
```

## Step 9: Add .env Files

```bash
# packages/bridge/.env
cat > packages/bridge/.env << 'EOF'
TELEGRAM_BOT_TOKEN=your_bot_token_here
BRIDGE_SERVER_PORT=3000
DESKTOP_WS_URL=ws://localhost:4000
OPENAI_API_KEY=your_api_key_here
NODE_ENV=development
EOF

# packages/desktop/.env
cat > packages/desktop/.env << 'EOF'
BRIDGE_WS_URL=ws://localhost:3000
ALLOWED_DIR=$HOME
NODE_ENV=development
EOF
```

## Step 10: Create README

```bash
cat > README.md << 'EOF'
# ClawDBot Clone

Monorepo-based AI-powered terminal bot.

## Structure

\`\`\`
clawdbot-clone/
├── packages/
│   ├── common/          # Shared code
│   ├── bridge/          # NestJS Bridge Server
│   ├── desktop/         # Desktop TUI
│   └── adapters/       # Messaging adapters
└── apps/
\`\`\`

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Start all packages
pnpm run dev

# Or use custom script
./dev.sh
\`\`\`

## Architecture

- **Bridge Server**: Routes messages between Telegram and Desktop
- **Desktop TUI**: Executes shell commands safely
- **Adapters**: Support for Telegram, WhatsApp, Slack, Discord
- **Common**: Shared types, validators, security

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Bridge Server Framework](docs/BRIDGE_SERVER_FRAMEWORK.md)
\`\`\`

## License

MIT
EOF
```

## Summary

You now have a complete monorepo setup! 🎉

```
clawdbot-clone/
├── packages/
│   ├── common/          ✅ Created
│   ├── bridge/          ✅ Created
│   ├── desktop/         ✅ Created
│   └── adapters/
│       └── telegram/    ✅ Created
├── apps/
│   └── dashboard/      ✅ Created (placeholder)
├── .gitignore         ✅ Created
├── pnpm-workspace.yaml ✅ Created
├── package.json       ✅ Created
├── turbo.json         ✅ Created
└── dev.sh            ✅ Created
```

### Next Steps

1. **Set up Telegram Bot**
   - Create bot via @BotFather
   - Get token
   - Update `packages/bridge/.env`

2. **Start Development**
   ```bash
   pnpm run dev
   ```

3. **Implement Features**
   - Step 1: Common package types
   - Step 2: Telegram adapter
   - Step 3: Bridge server
   - Step 4: Desktop TUI
   - Step 5: Integration testing

4. **Test**
   ```bash
   pnpm run test
   ```

5. **Deploy**
   ```bash
   pnpm run build
   # Deploy packages/bridge to cloud
   ```

Good luck! 🚀
