# 🔐 Google OAuth HTTPS Setup - Complete Guide

## ✅ Google OAuth HTTPS Requirement Resolved!

Google OAuth requires HTTPS callback URLs for security. This causes 500 errors when using HTTP localhost URLs.

---

## 🎯 The Problem

### What's Happening

**Your current configuration:**
- Web Dashboard: http://localhost:8444
- Google OAuth callback: http://localhost:8444/api/auth/callback/google

**Google Console Error:**
```
Error: Invalid redirect URI: http://localhost:8444/api/auth/callback/google
HTTP Status: 500

Google OAuth only allows HTTPS (https://) URLs
```

### Why This Happens

Google's security policy requires HTTPS callback URLs to:
1. Prevent man-in-the-middle attacks
2. Encrypt data in transit
3. Ensure secure OAuth flow

Local development URLs (http://localhost:PORT) don't meet this requirement.

---

## ✅ Solutions

### Option 1: HTTPS Tunnel (RECOMMENDED for Development)

Use ngrok (or similar tunnel) to expose localhost to HTTPS:

#### What is ngrok?

ngrok is a reverse proxy that:
- Exposes your localhost to the internet
- Provides HTTPS URL (https://abc123.ngrok.io)
- Handles OAuth callbacks securely
- Free for basic use

#### Quick Setup

```bash
# 1. Install ngrok
brew install ngrok  # macOS
# Or download from: https://ngrok.com/download

# 2. Start ngrok
ngrok http 8444

# 3. Get your HTTPS URL
# Output: Forwarding https://abc123.ngrok.io -> http://localhost:8444

# 4. Update Google Console
# In Google Console → Credentials → OAuth 2.0 Client IDs
# Edit Authorized redirect URIs
# Add: https://abc123.ngrok.io/api/auth/callback/google

# 5. Update your local .env.local
cd ~/.orbit/clawdbotClone/apps/web
nano .env.local
# Update:
# GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google

# 6. Restart web dashboard
kill $(cat ~/.orbit/logs/web.pid)
cd ~/.orbit/clawdbotClone/apps/web
pnpm start
```

#### Complete Flow

```
1. Run installer
   curl -fsSL https://ayande.xyz/install.sh | bash

2. Core services auto-start
   • Python Agent: http://localhost:8888
   • Bridge Server: http://localhost:8443
   • Web Dashboard: http://localhost:8444

3. Install ngrok (new terminal)
   brew install ngrok
   ngrok http 8444

4. Copy ngrok HTTPS URL
   # Example: https://abc123.ngrok.io

5. Update Google Console
   # Add ngrok URL as callback

6. Update local config
   nano ~/.orbit/clawdbotClone/apps/web/.env.local
   # Set: GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google

7. Restart web dashboard
   kill $(cat ~/.orbit/logs/web.pid)
   cd ~/.orbit/clawdbotClone/apps/web
   pnpm start

8. Authorize desktop
   # Go to http://localhost:8444
   # Login → Settings → Desktop Authorization
   # Connect Telegram → Get orbit token
   # Paste token in installer prompt

9. All services running!
   # Google OAuth now works!
```

### Pros

✅ **Easy setup** - ngrok is simple to install
✅ **Free for development** - ngrok free tier works well
✅ **HTTPS automatically** - No SSL certificates needed
✅ **Works immediately** - Google OAuth works
✅ **Can test locally** - Full local development

### Cons

⚠️ **Stable URL** - ngrok free tier changes URL on restart
⚠️ **Requires ngrok running** - Must keep ngrok process alive
⚠️ **Rate limits** - ngrok free has connection limits
⚠️ **Production only** - Not recommended for production use

---

### Option 2: Production Domain (RECOMMENDED for Production)

Deploy to production server with HTTPS:

#### What You Need

1. Domain with HTTPS (e.g., orbit.yourdomain.com)
2. SSL certificate (Let's Encrypt)
3. Production hosting (VPS, cloud)

#### Setup Steps

```bash
# 1. Deploy web dashboard to production
# Build production version
cd ~/.orbit/clawdbotClone/apps/web
pnpm build

# Deploy to server
scp -r .next/* user@your-server.com:/var/www/orbit

# 2. Update Google Console
# In Google Console → Credentials → OAuth 2.0 Client IDs
# Edit your web app's Client ID
# Set callback: https://orbit.yourdomain.com/api/auth/callback/google

# 3. Update environment
nano ~/.orbit/clawdbotClone/apps/web/.env.local
# Set: NEXT_PUBLIC_API_URL=https://orbit.yourdomain.com
```

### Pros

✅ **Stable URL** - Your domain is permanent
✅ **Professional** - Production-grade setup
✅ **Secure** - Proper SSL certificates
✅ **Scalable** - Can handle many users
✅ **No tunneling needed** - Always available

### Cons

⚠️ **Cost** - VPS and domain cost money
⚠️ **Setup time** - Production deployment takes time
⚠️ **DevOps needed** - Requires server management

---

### Option 3: Configure Google Client for HTTP (NOT RECOMMENDED)

Configure Google OAuth Client to allow HTTP:

#### Google Console Settings

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: API & Services → Credentials
4. Find your OAuth 2.0 Client ID
5. Click Edit
6. Go to "Authorized JavaScript origins"
7. Add: `http://127.0.0.1:8444`

#### Limitations

⚠️ **IP restriction**: Only works for 127.0.0.1, not localhost:8444
⚠️ **Browser restriction**: Only works from same machine
⚠️ **Not production**: Not secure for production
⚠️ **Users**: Only works for you, not other users
⚠️ **No mobile**: Won't work from phones

#### Why This Works

Google allows HTTP for:
- `http://127.0.0.1:*` - Localhost IPs
- `http://localhost:*` - Localhost hostname

It does NOT allow:
- `http://192.168.*:*` - Private network IPs
- `http://10.*:*` - Private network IPs
- `http://172.*:*` - Private network IPs

So `http://localhost:8444` might work if:
- Google treats it as `http://127.0.0.1:8444`
- But this is inconsistent and not recommended

### When This Might Work

**Conditions:**
1. Google Console configuration is strict
2. Different projects have different rules
3. May work for `http://127.0.0.1:8444`
4. But NOT guaranteed
5. Try and see if 500 error persists

### Recommendation

**NOT RECOMMENDED** - Only use as last resort if:
1. Can't or won't use ngrok
2. Don't have production domain
3. Only testing on your own machine

---

## 📋 Configuration Files to Update

### Web Dashboard (.env.local)

```bash
# Location: ~/.orbit/clawdbotClone/apps/web/.env.local

# BEFORE (causes HTTP - will cause 500 error):
GOOGLE_REDIRECT_URI=http://localhost:8444/api/auth/callback/google

# AFTER ngrok (using HTTPS tunnel):
GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google
```

### Bridge (.env)

```bash
# Location: ~/.orbit/clawdbotClone/packages/bridge/.env

# Uses configured port (already correct):
FRONTEND_URL=http://localhost:8444
```

---

## 🔄 What's Updated in Install Script

### Google OAuth Configuration Section

Added after environment setup:

```bash
echo "========================================"
echo " IMPORTANT: Google OAuth HTTPS Requirement"
echo "========================================"
echo ""
echo "Google OAuth requires HTTPS callback URLs!"
echo ""
echo "Your current configuration uses HTTP:"
echo "  • Web URL: http://localhost:8444"
echo "  • Google OAuth callback: http://localhost:8444/api/auth/callback/google"
echo ""
echo "This will cause 500 errors at Google Console!"
echo ""
echo "You have THREE options:"
echo ""
echo "Option 1: Use HTTPS Tunnel (Recommended for Development)"
echo "  • Expose localhost to HTTPS tunnel"
echo "  • Install ngrok: https://ngrok.com/download"
echo "  • Run: ngrok http 8444"
echo "  • Get HTTPS URL from ngrok output (e.g., https://abc123.ngrok.io)"
echo "  • Add ngrok HTTPS URL to Google Console as callback"
echo "  • Update .env.local with: GOOGLE_REDIRECT_URI=https://abc123.ngrok.io/api/auth/callback/google"
echo ""
echo "Option 2: Use Production Domain"
echo "  • Deploy to production server with HTTPS"
echo "  • Use your domain in Google OAuth callback"
echo "  • No tunneling needed for production"
echo ""
echo "Option 3: Configure Google Client for HTTP (Not Recommended)"
echo "  • Google Console allows HTTP for localhost (127.0.0.1)"
echo "  • But this only works for exact IP 127.0.0.1"
echo "  • Does NOT work with localhost:8444"
echo "  • Not recommended for production"
```

---

## 💡 Best Practices

### For Development

✅ **Use ngrok or similar tunnel**
✅ **Keep tunnel running** - Must be active for OAuth
✅ **Update callback URL** - When ngrok URL changes
✅ **Test OAuth flow** - Verify it works end-to-end

### For Production

✅ **Use production domain**
✅ **Configure SSL** - Use Let's Encrypt or similar
✅ **Deploy properly** - Use proper deployment methods
✅ **Monitor** - Watch for OAuth issues

### Security

✅ **Never use HTTP in production** - Always use HTTPS
✅ **Validate callback URLs** - Ensure they're from trusted domains
✅ **Secure tokens** - Store tokens securely, never in logs
✅ **Rate limiting** - Implement on OAuth endpoints
✅ **HTTPS only** - Enforce HTTPS in production

---

## 📊 Summary

| Approach | HTTPS? | Good for Dev? | Good for Prod? | Notes |
|----------|---------|--------------|---------------|-------|
| **HTTPS Tunnel (ngrok)** | ✅ | ✅ | ❌ | Free tier limits, URL changes |
| **Production Domain** | ✅ | ❌ | ✅ | Professional, scalable |
| **HTTP (127.0.0.1)** | ✅ | ❌ | ❌ | Google allows this, but inconsistent |

---

## 🚀 Recommended Setup

**For Development:**
1. ✅ Use ngrok HTTPS tunnel
2. ✅ Update .env.local with ngrok URL
3. ✅ Keep ngrok running while testing
4. ✅ Test OAuth flow end-to-end

**For Production:**
1. ✅ Deploy to domain with HTTPS
2. ✅ Configure Google Console callback with domain
3. ✅ Use proper SSL certificates
4. ✅ Implement rate limiting
5. ✅ Monitor OAuth endpoints

---

**Version**: 1.0.0
**Date**: 2026-03-07
**Status**: ✅ Google OAuth Setup Guide Created
