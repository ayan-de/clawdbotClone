# Orbit AI - Port Configuration Guide

Complete guide for configuring ports in Orbit AI to avoid conflicts with other applications.

---

## 🎯 Why Port Configuration Matters

By default, many applications use common ports like 3000, 4000, 8000, which can cause conflicts. Orbit AI now uses less common ports by default and allows easy port customization.

---

## 📦 Default Ports

Orbit AI uses the following ports by default (in the 8000-9000 range):

| Service | Port | Usage |
|---------|------|-------|
| **Python Agent** | 8888 | FastAPI AI service |
| **Bridge Server** | 8443 | NestJS API server |
| **Web Dashboard** | 8444 | Next.js web interface |
| **Desktop TUI** | 8445 | Terminal user interface |

These ports are chosen to minimize conflicts with common applications.

---

## 🔄 How Port Configuration Works

### Automatic Configuration

During installation, the script:

1. **Checks** if default ports are available
2. **Prompts** if ports are in use
3. **Auto-generates** alternative ports if needed
4. **Saves** configuration to `~/.orbit/.env-ports`

### Port Configuration File

Location: `~/.orbit/.env-ports`

```bash
# Orbit AI Port Configuration
# Generated: 2026-03-07 12:00:00
# You can manually edit these ports if needed

AGENT_PORT=8888
BRIDGE_PORT=8443
WEB_PORT=8444
DESKTOP_PORT=8445
```

---

## 🛠️ Changing Ports Manually

### Option 1: Edit Port Configuration File

1. **Edit the port config**:
   ```bash
   nano ~/.orbit/.env-ports
   ```

2. **Change the ports**:
   ```bash
   AGENT_PORT=9999
   BRIDGE_PORT=9998
   WEB_PORT=9997
   DESKTOP_PORT=9996
   ```

3. **Restart services**:
   ```bash
   # Stop all services
   kill $(cat ~/.orbit/logs/*.pid) 2>/dev/null || true

   # Update .env files (see Option 2)
   # Then start services again
   ```

### Option 2: Complete Port Change

If you want to change ports completely:

1. **Stop all services**:
   ```bash
   kill $(cat ~/.orbit/logs/*.pid) 2>/dev/null || true
   ```

2. **Update port configuration**:
   ```bash
   nano ~/.orbit/.env-ports
   ```

3. **Update all .env files**:

   **Agent config**:
   ```bash
   nano ~/.orbit/orbit-agent/.env
   # Change: PORT=your_agent_port
   # Change: BRIDGE_URL=http://localhost:your_bridge_port
   # Change: FRONTEND_URL=http://localhost:your_web_port
   ```

   **Bridge config**:
   ```bash
   nano ~/.orbit/clawdbotClone/packages/bridge/.env
   # Change: PORT=your_bridge_port
   # Change: FRONTEND_URL=http://localhost:your_web_port
   # Change: AGENT_API_URL=http://localhost:your_agent_port
   # Update OAuth redirect URIs to match your_web_port
   ```

   **Web config**:
   ```bash
   nano ~/.orbit/clawdbotClone/apps/web/.env.local
   # Change: NEXT_PUBLIC_API_URL=http://localhost:your_bridge_port
   # Change: NEXT_PUBLIC_DESKTOP_URL=http://localhost:your_desktop_port
   ```

4. **Start services**:
   ```bash
   cd ~/.orbit/orbit-agent
   source .venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port your_agent_port &

   cd ~/.orbit/clawdbotClone/packages/bridge
   pnpm start &

   cd ~/.orbit/clawdbotClone/apps/web
   pnpm start &
   ```

---

## 🔍 Checking Port Availability

### Check if a Port is in Use

```bash
# Check specific port
lsof -i:8888

# Check if port is listening
lsof -Pi :8888 -sTCP:LISTEN -t

# Check all Orbit AI ports
for port in 8888 8443 8444 8445; do
    echo "Port $port:"
    lsof -i:$port || echo "  Available"
    echo ""
done
```

### Find Process Using a Port

```bash
# Find process using port 8888
lsof -ti:8888

# Kill process using port 8888
lsof -ti:8888 | xargs kill -9
```

---

## 🎯 Recommended Port Ranges

### Safe Port Ranges

| Range | Usage | Recommendation |
|-------|-------|----------------|
| **8000-8099** | Development | Good for personal use |
| **8443-8499** | Development | Safe range |
| **9000-9999** | Development | Less commonly used |
| **10000-10999** | Development | Very safe |

### Ports to Avoid

These ports are commonly used by other applications:

| Port | Common Application | Avoid Using |
|------|-------------------|-------------|
| 3000 | React, Next.js (dev), many apps | ✗ |
| 4000 | Various dev servers | ✗ |
| 5000 | Flask, some development servers | ✗ |
| 8000 | Django dev server, various tools | ✗ |
| 8080 | Proxy servers, many apps | ✗ |
| 9000 | Some frameworks and tools | ✗ |

---

## 🌐 Port Conflicts Resolution

### Scenario 1: Port Already in Use

**Problem**: Port 8443 is in use by another application

**Solution**: Use alternative ports

```bash
# Edit port configuration
nano ~/.orbit/.env-ports

# Change to available ports
BRIDGE_PORT=9443
```

### Scenario 2: Multiple Orbit Instances

**Problem**: You need to run multiple Orbit AI instances

**Solution**: Use different ports for each instance

```bash
# Instance 1 (~/.orbit/.env-ports)
AGENT_PORT=8888
BRIDGE_PORT=8443
WEB_PORT=8444
DESKTOP_PORT=8445

# Instance 2 (~/.orbit2/.env-ports)
AGENT_PORT=9888
BRIDGE_PORT=9443
WEB_PORT=9444
DESKTOP_PORT=9445
```

### Scenario 3: Corporate Firewall

**Problem**: Your firewall blocks certain ports

**Solution**: Use allowed ports

```bash
# Check with IT department which ports are allowed
# Then update ~/.orbit/.env-ports with allowed ports
```

---

## 🔧 Advanced Configuration

### Using Non-Standard Ports

If you need to use very high port numbers:

```bash
# ~/.orbit/.env-ports
AGENT_PORT=18888
BRIDGE_PORT=18443
WEB_PORT=18444
DESKTOP_PORT=18445
```

### Port Forwarding (for remote access)

If you want to access Orbit AI from another machine:

```bash
# On remote machine
ssh -L 8888:localhost:8888 user@remote-machine

# Now access via localhost:8888 on local machine
```

### Using Systemd Services (Linux)

Create systemd services with custom ports:

```bash
# ~/.config/systemd/user/orbit-agent.service
[Unit]
Description=Orbit AI Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/user/.orbit/orbit-agent
Environment="PORT=8888"
ExecStart=/home/user/.orbit/orbit-agent/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8888
Restart=on-failure

[Install]
WantedBy=default.target
```

---

## 📊 Port Reference Table

Quick reference for all Orbit AI components:

| Component | Config File | Port Variable | Default | URL Format |
|-----------|-------------|---------------|---------|------------|
| **Agent** | `~/.orbit/orbit-agent/.env` | `PORT` | 8888 | `http://localhost:8888` |
| **Bridge** | `~/.orbit/clawdbotClone/packages/bridge/.env` | `PORT` | 8443 | `http://localhost:8443` |
| **Web** | `~/.orbit/clawdbotClone/apps/web/.env.local` | N/A | 8444 | `http://localhost:8444` |
| **Desktop** | N/A | N/A | 8445 | `ws://localhost:8445` |

---

## 🚨 Troubleshooting

### Problem: Services Won't Start

**Error**: `Address already in use`

**Solution**:
```bash
# Check which ports are in use
lsof -i:8888
lsof -i:8443
lsof -i:8444

# Kill conflicting processes
lsof -ti:8888 | xargs kill -9
lsof -ti:8443 | xargs kill -9
lsof -ti:8444 | xargs kill -9

# Or change ports in ~/.orbit/.env-ports
```

### Problem: Can't Access Web Dashboard

**Solution**:
```bash
# Check if web service is running
ps aux | grep "next start"

# Check if port is listening
lsof -i:8444

# Check web logs
tail -f ~/.orbit/logs/web.log

# Verify URL in browser
# Should be http://localhost:8444 (not 3000)
```

### Problem: Agent Can't Connect to Bridge

**Error**: `Connection refused`

**Solution**:
```bash
# Verify bridge URL in agent config
cat ~/.orbit/orbit-agent/.env | grep BRIDGE_URL

# Should match bridge port
# http://localhost:8443 (not 3000)

# Update if needed
nano ~/.orbit/orbit-agent/.env
# Change BRIDGE_URL=http://localhost:8443

# Restart agent
kill $(cat ~/.orbit/logs/agent.pid)
cd ~/.orbit/orbit-agent
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8888 &
```

---

## 📝 Quick Commands

### View Current Port Configuration

```bash
cat ~/.orbit/.env-ports
```

### Check Which Ports Orbit AI is Using

```bash
# Check running processes
ps aux | grep -E "(uvicorn|nest|next)" | grep -v grep

# Or check port usage
lsof -i:8888,8443,8444,8445
```

### Change Ports Quickly

```bash
# 1. Stop services
kill $(cat ~/.orbit/logs/*.pid)

# 2. Edit port config
nano ~/.orbit/.env-ports

# 3. Update .env files
# (You'll need to update each .env file manually)

# 4. Restart services
# See start services command in previous sections
```

---

## 🎯 Best Practices

1. **Use high port numbers** (8000+): Less likely to conflict
2. **Check port availability** before changing: `lsof -i:PORT`
3. **Document your ports**: Keep a record of custom ports
4. **Update all .env files**: Consistency is key
5. **Restart services** after changing ports: Changes don't take effect until restart
6. **Test each service**: Verify each service works after port change

---

## 📚 Related Documentation

- **DEPLOYMENT_GUIDE.md**: Full deployment instructions
- **UPDATE_GUIDE.md**: How to update Orbit AI
- **DEPLOYMENT_CHECKLIST.md**: Step-by-step verification

---

## 💡 Pro Tips

### Tip 1: Keep a Port Registry

Keep a file with all your custom ports:

```bash
# ~/.orbit/port-registry.txt
Orbit AI:
  - Agent: 8888
  - Bridge: 8443
  - Web: 8444
  - Desktop: 8445
```

### Tip 2: Use Consistent Port Patterns

Use a pattern to remember your ports easily:

```
Agent:   8888 (starts with 88)
Bridge:  8443 (starts with 84)
Web:     8444 (starts with 84, +1)
Desktop: 8445 (starts with 84, +2)
```

### Tip 3: Port Monitoring

Create a script to monitor your ports:

```bash
# ~/.orbit/check-ports.sh
#!/bin/bash
for port in 8888 8443 8444 8445; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✓ Port $port: Active"
    else
        echo "✗ Port $port: Inactive"
    fi
done
```

---

**Version**: 1.0.0
**Last Updated**: 2026-03-07
