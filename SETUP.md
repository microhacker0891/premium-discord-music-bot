# 🚀 Discord Music Bot Setup Guide

This guide will walk you through setting up your Discord music bot from scratch.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 16.0.0 or higher** - [Download here](https://nodejs.org/)
- **A Discord account** - [Create one here](https://discord.com/)
- **Basic knowledge of Discord** - Understanding of servers, channels, and bots

## 🔧 Step 1: Create a Discord Application

### 1.1 Go to Discord Developer Portal
1. Visit [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Click **"New Application"**

### 1.2 Configure Your Application
1. Enter a name for your bot (e.g., "My Music Bot")
2. Click **"Create"**
3. You'll be taken to the application dashboard

### 1.3 Get Your Application ID
1. In the **"General Information"** tab
2. Copy the **"Application ID"** - you'll need this for `DISCORD_CLIENT_ID`

## 🤖 Step 2: Create and Configure the Bot

### 2.1 Create the Bot
1. Go to the **"Bot"** tab in your application
2. Click **"Add Bot"**
3. Click **"Yes, do it!"** to confirm

### 2.2 Configure Bot Settings
1. Under **"Token"**, click **"Copy"** to get your bot token
2. **⚠️ IMPORTANT**: Keep this token secret! Never share it publicly
3. Under **"Privileged Gateway Intents"**, enable:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**

### 2.3 Set Bot Permissions
1. Go to **"OAuth2"** > **"URL Generator"**
2. Select scopes:
   - ✅ **bot**
   - ✅ **applications.commands**
3. Select permissions:
   - ✅ **Send Messages**
   - ✅ **Use Slash Commands**
   - ✅ **Connect**
   - ✅ **Speak**
   - ✅ **Use Voice Activity**
   - ✅ **Read Message History**
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

## 🎵 Step 3: Set Up Spotify Integration (Optional)

### 3.1 Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in:
   - **App Name**: "Discord Music Bot"
   - **App Description**: "Music bot for Discord"
   - **Redirect URI**: `http://localhost:3000/callback`
5. Click **"Save"**

### 3.2 Get Spotify Credentials
1. Click on your app
2. Copy the **Client ID** and **Client Secret**
3. You'll need these for `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

## 💻 Step 4: Set Up the Code

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   
   # Spotify API (Optional)
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   
   # Bot Configuration
   PREFIX=!
   OWNER_ID=your_discord_user_id_here
   MAX_QUEUE_SIZE=100
   DEFAULT_VOLUME=50
   
   # Logging
   LOG_LEVEL=info
   ```

### 4.3 Deploy Slash Commands
```bash
npm run deploy
```

### 4.4 Start the Bot
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## ✅ Step 5: Test Your Bot

### 5.1 Basic Test
1. Make sure your bot is online (green status)
2. Go to a voice channel in your Discord server
3. Type `/play query: Never Gonna Give You Up`
4. The bot should join the voice channel and start playing

### 5.2 Test Commands
Try these commands to test functionality:
- `/help` - Show all commands
- `/play query: [song name]` - Play a song
- `/pause` - Pause the music
- `/resume` - Resume the music
- `/queue` - Show the queue
- `/skip` - Skip current song
- `/stop` - Stop and clear queue

## 🔧 Step 6: Advanced Configuration

### 6.1 Customize Bot Settings
Edit `src/config/bot.js` to customize:
- Default volume levels
- Maximum song duration
- Search result limits
- Colors and emojis

### 6.2 Add More Features
- Create new commands in `src/commands/`
- Add new music sources in `src/music/`
- Customize the UI and responses

## 🚨 Troubleshooting

### Bot Not Responding
- ✅ Check if the bot is online
- ✅ Verify slash commands were deployed (`npm run deploy`)
- ✅ Check bot permissions in server settings
- ✅ Ensure the bot is in the same server

### Music Not Playing
- ✅ Make sure you're in a voice channel
- ✅ Check internet connection
- ✅ Verify the song URL is accessible
- ✅ Check bot logs for errors

### Permission Errors
- ✅ Re-invite the bot with correct permissions
- ✅ Check server role hierarchy
- ✅ Ensure bot has necessary voice permissions

### Spotify Not Working
- ✅ Verify Spotify API credentials
- ✅ Check Spotify app settings
- ✅ Ensure credentials are in `.env` file

## 📚 Next Steps

Once your bot is working:

1. **Customize the bot** - Modify colors, responses, and features
2. **Add more commands** - Create custom commands for your server
3. **Deploy to a server** - Host your bot 24/7
4. **Monitor performance** - Check logs and optimize

## 🆘 Need Help?

If you're still having issues:

1. Check the [main README](README.md) for detailed documentation
2. Look at the [troubleshooting section](#-troubleshooting)
3. Check the logs in the `logs/` directory
4. Create an issue on GitHub with detailed information

---

**Happy coding! 🎵**
