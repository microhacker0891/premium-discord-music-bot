# 🔧 Bot Troubleshooting Guide

## Common Issues and Solutions

### 1. Bot Shows "Unknown Integration" Error

**Problem:** Bot is online but slash commands don't work
**Solutions:**
- Wait 5-10 minutes for commands to register globally
- Check if bot has proper permissions in Discord server
- Verify bot is invited with `applications.commands` scope

### 2. Bot Not Responding to Commands

**Problem:** Bot is online but doesn't respond to slash commands
**Solutions:**
- Check Railway logs for errors
- Verify DISCORD_TOKEN is set correctly
- Ensure bot has proper permissions

### 3. Commands Not Appearing

**Problem:** Slash commands don't show up in Discord
**Solutions:**
- Wait for global command registration (up to 1 hour)
- Check if bot has `applications.commands` permission
- Try re-inviting bot with proper permissions

### 4. Bot Keeps Going Offline

**Problem:** Bot disconnects frequently
**Solutions:**
- Check Railway resource limits
- Verify stable internet connection
- Check for memory leaks in logs

## Quick Fixes

### Test Bot Connection
```bash
node test-simple-bot.js
```

### Test Command Registration
```bash
node diagnostic-bot.js
```

### Check Railway Logs
1. Go to Railway dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for errors or warnings

## Bot Permissions Required

When inviting the bot, make sure to include:
- ✅ Read Messages
- ✅ Send Messages
- ✅ Use Slash Commands
- ✅ Embed Links
- ✅ Attach Files

## Invite Link Format

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=2147483648&scope=bot%20applications.commands
```

## Still Not Working?

1. Check Railway logs for specific errors
2. Verify bot token is correct
3. Ensure bot is invited to the server
4. Wait 10-15 minutes for command registration
5. Try restarting the Railway service
