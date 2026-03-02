# 🖥️ Layer 7: Desktop Runtime Integration (Phase 8)

**Duration**: 3 weeks
**Last Updated**: 2026-03-01

---

## Overview

Layer 7 is the Desktop Runtime Integration that creates a local desktop deployment with service daemon, system tray, TUI interface, configuration system, and desktop integration. This layer makes the agent accessible and manageable from the user's desktop.

---

## Final MVP

**Agent runs as a desktop application:**
- User runs installer → agent installed as system service
- Agent starts automatically on system boot
- System tray shows agent status (green = running, yellow = paused, red = error)
- User opens TUI → types "what's my schedule today?" → agent responds
- User can configure LLM provider, permissions, settings via TUI
- Agent sends desktop notifications for important events
- Agent updates automatically when new versions available

**Key Capabilities:**
- ☐ Service daemon (runs as background process)
- ☐ System tray integration with status indicator
- ☐ TUI interface for direct interaction
- ☐ Configuration system (editable via UI)
- ☐ Plugin architecture (for extensions)
- ☐ Desktop integration (systemd, launchd)
- ☐ Notification system
- ☐ Auto-update mechanism

---

## Implementation Steps

### Week 1: Service Daemon & System Integration

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 1 | Design Local Service Daemon Architecture | `packages/desktop/src/daemon/daemon-main.ts` | ⬜ |
| 2 | Implement Service Manager (start/stop/restart/status) | `packages/desktop/src/daemon/service-manager.ts` | ⬜ |
| 3 | Build System Tray Process with Status Indicator | `packages/desktop/src/tray/tray-manager.ts` | ⬜ |
| 4 | Create Local TUI (Terminal UI) for Interaction | `packages/desktop/src/tui/app.ts` | ⬜ |
| 5 | Design Local Storage Directory Structure | `packages/desktop/src/storage/structure.ts` | ⬜ |
| 6 | Implement Configuration System (editable via UI) | `packages/desktop/src/config/manager.ts` | ⬜ |
| 7 | Build systemd Service Unit (Linux) | `packages/desktop/systemd/orbit.service` | ⬜ |
| 8 | Build launchd Agent (macOS) | `packages/desktop/launchd/com.orbit.agent.plist` | ⬜ |

### Week 2: Desktop Features & Plugins

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 9 | Build Plugin System Architecture | `packages/desktop/src/plugins/plugin-loader.ts` | ⬜ |
| 10 | Create Plugin Interface and Registry | `packages/desktop/src/plugins/plugin-interface.ts` | ⬜ |
| 11 | Design Desktop-specific Security (file permissions, sandbox) | `packages/desktop/src/security/desktop-security.ts` | ⬜ |
| 12 | Implement Auto-update Mechanism | `packages/desktop/src/updater/updater.ts` | ⬜ |
| 13 | Create Desktop Notification System | `packages/desktop/src/notifications/manager.ts` | ⬜ |
| 14 | Build Notification Handlers (important events, errors) | `packages/desktop/src/notifications/handlers.ts` | ⬜ |
| 15 | Implement TUI Commands (help, status, config, etc.) | `packages/desktop/src/tui/commands/` | ⬜ |
| 16 | Create TUI Theme System | `packages/desktop/src/tui/themes.ts` | ⬜ |

### Week 3: Polish & Testing

| Step | Task | File(s) | Status |
|------|------|---------|--------|
| 17 | Build Installation Script (Linux/macOS) | `install.sh` | ⬜ |
| 18 | Build Uninstallation Script | `uninstall.sh` | ⬜ |
| 19 | Create First-run Setup Wizard | `packages/desktop/src/setup/wizard.ts` | ⬜ |
| 20 | Implement Desktop Integration (file associations, etc.) | `packages/desktop/src/integration/desktop-integration.ts` | ⬜ |
| 21 | Build Log Viewer Tool | `packages/desktop/src/tools/log-viewer.ts` | ⬜ |
| 22 | Create Performance Monitor | `packages/desktop/src/monitor/monitor.ts` | ⬜ |
| 23 | Write Integration Tests for Desktop Runtime | `packages/desktop/src/__tests__/` | ⬜ |

---

## 📊 Total Progress

```
Layer 7: Desktop Runtime      ░░░░░░░░░   0/23 steps
```

---

## Success Criteria

☐ Daemon runs as background service (systemd/launchd)
☐ System tray shows correct status (running/paused/error)
☐ TUI allows direct interaction with agent
☐ Configuration changes apply immediately without restart
☐ Plugins can be loaded and unloaded dynamically
☐ Notifications appear for important events
☐ Auto-update downloads and applies updates
☐ Installation completes successfully on Linux and macOS

---

## Desktop Architecture

```
User's Desktop
│
├─ Service Daemon (Node.js)
│  ├─ Event Loop
│  ├─ Gateway Layer
│  ├─ Reasoning Layer
│  ├─ Memory System
│  └─ Tool Execution
│
├─ System Tray Icon
│  ├─ Status Indicator
│  ├─ Quick Actions
│  └─ Menu (start, stop, pause, config, logs)
│
└─ TUI Application
   ├─ Interactive Terminal
   ├─ Configuration UI
   ├─ Log Viewer
   └─ Status Dashboard
```

---

## TUI Features

### Commands
- `/help` - Show help and available commands
- `/status` - Show agent status and stats
- `/config` - Open configuration editor
- `/logs` - View log files
- `/pause` - Pause event processing
- `/resume` - Resume event processing
- `/restart` - Restart agent daemon
- `/plugins` - List and manage plugins

### Configuration UI
- LLM Provider selection (OpenAI, Anthropic, Ollama)
- API key management
- Tool permission settings
- Memory settings (retention, consolidation)
- Logging level and location
- Auto-update settings

---

## System Tray Menu

```
🤖 Orbit Agent
├─ ✅ Running
├─ ──────────────
├─ 💬 Open TUI
├─ ⚙️  Configuration
├─ 📝 View Logs
├─ ──────────────
├─ ⏸️  Pause
├─ ▶️  Resume
├─ 🔄 Restart
├─ ──────────────
├─ 📦 Check for Updates
├─ ❌ Exit
```

---

## File Structure

```
packages/desktop/src/
├── daemon/
│   ├── daemon-main.ts
│   └── service-manager.ts
├── tray/
│   └── tray-manager.ts
├── tui/
│   ├── app.ts
│   ├── commands/
│   │   ├── help.ts
│   │   ├── status.ts
│   │   ├── config.ts
│   │   └── logs.ts
│   └── themes.ts
├── storage/
│   └── structure.ts
├── config/
│   └── manager.ts
├── plugins/
│   ├── plugin-loader.ts
│   └── plugin-interface.ts
├── security/
│   └── desktop-security.ts
├── updater/
│   └── updater.ts
├── notifications/
│   ├── manager.ts
│   └── handlers.ts
├── setup/
│   └── wizard.ts
├── integration/
│   └── desktop-integration.ts
├── tools/
│   ├── log-viewer.ts
│   └── ...
├── monitor/
│   └── monitor.ts
└── __tests__/
    └── ...

~/.orbit/
├── orbit-daemon
├── orbit-tui
├── config/
│   ├── agent.config.json
│   ├── llm.config.json
│   └── tools.config.json
├── data/
│   ├── memory/
│   ├── vector-index/
│   ├── sessions/
│   └── logs/
└── logs/
    ├── orbit-daemon.log
    └── orbit-tui.log

/etc/systemd/system/
└── orbit.service

~/Library/LaunchAgents/
└── com.orbit.agent.plist
```

---

## Dependencies

**Requires**: Layer 6 (Event Loop Integration) complete
- Autonomous operation for daemon
- Full event processing pipeline

**Enables**: Phase 9 (Testing & Stabilization), Phase 10 (Production Readiness)
- End-to-end testing with real desktop deployment
- Production packaging and distribution

---

> **Document Version**: 1.0
> **Last Updated**: 2026-03-01
> **Status**: Ready for Implementation
