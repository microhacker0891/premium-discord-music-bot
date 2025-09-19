# 🚂 Railway Deployment Guide

## Quick Activation Steps

### 1. Set Environment Variables
In your Railway project dashboard, go to **Variables** tab and add:

```
DISCORD_TOKEN=your_discord_bot_token_here
NODE_ENV=production
```

### 2. Configure Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `/` (default)

### 3. Deploy
- Railway will automatically detect the `package.json`
- The bot will start with `node predictive-analytics-bot.js`
- Check logs for any errors

## Bot Commands Available

Once active, your bot will respond to:

- `/predict <symbol>` - AI price predictions
- `/analyze <symbol>` - Technical analysis
- `/risk` - Portfolio risk assessment
- `/opportunities` - Investment opportunities
- `/trends` - Social media trends
- `/market` - Market overview
- `/crypto <symbol>` - Crypto analysis
- `/news` - News sentiment analysis

## Troubleshooting

### Bot Not Responding
1. Check Railway logs for errors
2. Verify DISCORD_TOKEN is set correctly
3. Ensure bot has proper permissions in Discord server

### Commands Not Working
1. Bot needs to be invited with proper slash command permissions
2. Wait 5-10 minutes for commands to register globally
3. Check bot is online in Discord

## Support
- Check Railway logs: `railway logs`
- Restart service: `railway restart`
- View service status: `railway status`