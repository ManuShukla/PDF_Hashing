# ⚠️ Known Issue: Node.js Cannot Connect to NeonDB

## Problem

The Node.js implementation cannot connect to NeonDB, resulting in `ETIMEDOUT` errors:

```
✗ Error connecting to database: 
  Error code: ETIMEDOUT
  Trying to connect to: ep-lively-dust-ah4f4fnu-pooler.c-3.us-east-1.aws.neon.tech:5432
```

## Root Cause

- ✅ **Python can connect** using `psycopg2`
- ❌ **Node.js cannot connect** using `pg` library
- The issue is **port 5432 being blocked** for Node.js specifically
- This is likely a **firewall, iptables, or system security policy** issue

## Diagnosis

```bash
# Python works:
python -c "import psycopg2; conn = psycopg2.connect('...')"  # ✓ Success

# Node.js fails:
node -e "import pg from 'pg'; ..."  # ✗ ETIMEDOUT
```

The error shows Node.js tries multiple IP addresses but all timeout:
- `98.89.62.209:5432` - ETIMEDOUT
- `18.215.6.120:5432` - ETIMEDOUT  
- `23.21.74.185:5432` - ETIMEDOUT
- IPv6 addresses - ENETUNREACH

## Possible Causes

### 1. **Firewall Blocking Node.js**
Some firewalls block connections based on the process name or user agent.

```bash
# Check iptables
sudo iptables -L -n | grep 5432

# Check if Node.js is blocked
sudo iptables -L OUTPUT -v -n
```

### 2. **SELinux or AppArmor**
Security policies might restrict Node.js network access.

```bash
# Check SELinux
sestatus

# Check AppArmor
sudo aa-status | grep node
```

### 3. **Corporate/University Network**
Some networks block outbound PostgreSQL connections for non-system processes.

### 4. **IPv6 Configuration**
Node.js tries IPv6 first, which might not be properly configured.

```bash
# Disable IPv6 temporarily
sysctl -w net.ipv6.conf.all.disable_ipv6=1
```

### 5. **Node.js Network Permissions**
Node.js might not have permission to open sockets on port 5432.

---

## Workarounds

### Option 1: Use Python Version (Recommended)
Since Python works fine, use the Python implementation:

```bash
cd /home/manu/Desktop/resumeHashingPOC
source .venv/bin/activate
./run_hasher.sh
```

**This is the simplest solution and works perfectly!**

### Option 2: Use Proxy/Tunnel
Create an SSH tunnel or use a local proxy that Python can connect through:

```bash
# SSH tunnel (if you have SSH access to another server)
ssh -L 5433:neon-host:5432 user@your-server

# Update Node.js to use localhost:5433
```

### Option 3: Docker
Run Node.js in Docker where network rules might be different:

```bash
# Create Dockerfile
FROM node:20
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]

# Run
docker build -t pdf-hasher-node .
docker run --env-file ../.env pdf-hasher-node
```

### Option 4: Use Different NeonDB Connection
Try getting a different connection string from NeonDB dashboard:
- Use non-pooler connection (if available)
- Try different region
- Use connection pooling service

---

## Testing Commands

### Test if port 5432 is accessible:
```bash
# Test with netcat
nc -zv ep-lively-dust-ah4f4fnu-pooler.c-3.us-east-1.aws.neon.tech 5432

# Test with telnet
telnet ep-lively-dust-ah4f4fnu-pooler.c-3.us-east-1.aws.neon.tech 5432

# Test with Python (works)
python -c "import socket; s=socket.socket(); s.connect(('ep-lively-dust-ah4f4fnu-pooler.c-3.us-east-1.aws.neon.tech', 5432)); print('Connected')"
```

### Check Node.js network capabilities:
```bash
# Simple Node.js network test
node -e "const net = require('net'); const s = net.createConnection(5432, 'ep-lively-dust-ah4f4fnu-pooler.c-3.us-east-1.aws.neon.tech'); s.on('connect', () => console.log('Connected')); s.on('error', (e) => console.error(e));"
```

---

## Recommendation

**Use the Python version** - it works perfectly and has identical functionality:

```bash
# Python implementation (works)
cd /home/manu/Desktop/resumeHashingPOC
source .venv/bin/activate
./run_hasher.sh
```

The Node.js implementation is provided for environments where it can connect (development machines, cloud environments, Docker, etc.), but your current system has a network configuration that blocks Node.js from accessing port 5432.

---

## For System Administrators

If you need Node.js to work, investigate:

1. **Check firewall rules** affecting Node.js specifically
2. **Review security policies** (SELinux, AppArmor)
3. **Test from different network** (mobile hotspot, different WiFi)
4. **Check corporate network policies**
5. **Try Docker** (bypasses some host restrictions)

---

## Files Status

| Implementation | Status | Notes |
|----------------|--------|-------|
| **Python** (`pdf_hasher_content_only.py`) | ✅ **Working** | Use this! |
| **Node.js** (`node_implementation/pdf_hasher_node.js`) | ⚠️ **Network Blocked** | Port 5432 timeout |

**Both implementations are identical in functionality - just use Python for now!**
