# 🎵 Premium Discord Music Bot

A feature-rich Discord music bot built with Discord.js v14, supporting YouTube, Spotify, and more music sources. This bot provides high-quality music streaming with advanced queue management and audio controls.

## ✨ Features

### 🎵 Music Controls
- **Play** - Play songs from YouTube, Spotify, and other sources
- **Pause/Resume** - Control playback with simple commands
- **Skip** - Skip to the next song in queue
- **Stop** - Stop music and clear the queue
- **Now Playing** - Display current song information

### 📋 Queue Management
- **Queue Display** - View all songs in the queue with pagination
- **Shuffle** - Randomize the order of songs in queue
- **Clear** - Clear the entire queue
- **Smart Queue** - Automatic queue management

### 🎛️ Audio Controls
- **Volume Control** - Adjust bot volume (0-100%)
- **Lyrics** - Get lyrics for any song
- **High Quality Audio** - Supports various audio formats

### 🔧 Advanced Features
- **Multi-Server Support** - Works across multiple Discord servers
- **Auto-Disconnect** - Automatically leaves when voice channel is empty
- **Error Handling** - Robust error handling and recovery
- **Logging** - Comprehensive logging system
- **Slash Commands** - Modern Discord slash command interface

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord application and bot token
- (Optional) Spotify API credentials for Spotify support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd premium-discord-music-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   PREFIX=!
   OWNER_ID=your_discord_user_id_here
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## 🔧 Discord Bot Setup

### Creating a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the bot token and paste it in your `.env` file
6. Under "Privileged Gateway Intents", enable:
   - Server Members Intent
   - Message Content Intent

### Bot Permissions

The bot needs the following permissions:
- Send Messages
- Use Slash Commands
- Connect to Voice
- Speak in Voice
- Use Voice Activity
- Read Message History

### Invite the Bot

1. Go to OAuth2 > URL Generator
2. Select scopes: `bot` and `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`, `Connect`, `Speak`, `Use Voice Activity`
4. Copy the generated URL and use it to invite the bot

## 📖 Commands

### Music Controls
| Command | Description | Usage |
|---------|-------------|-------|
| `/play` | Play a song | `/play query: Never Gonna Give You Up` |
| `/pause` | Pause current song | `/pause` |
| `/resume` | Resume paused song | `/resume` |
| `/skip` | Skip current song | `/skip` |
| `/stop` | Stop music and clear queue | `/stop` |
| `/nowplaying` | Show current song | `/nowplaying` |

### Queue Management
| Command | Description | Usage |
|---------|-------------|-------|
| `/queue` | Show music queue | `/queue page:1` |
| `/shuffle` | Shuffle the queue | `/shuffle` |
| `/clear` | Clear the queue | `/clear` |

### Audio Controls
| Command | Description | Usage |
|---------|-------------|-------|
| `/volume` | Set bot volume | `/volume level:75` |
| `/lyrics` | Get song lyrics | `/lyrics query: Song Name` |

### Utility
| Command | Description | Usage |
|---------|-------------|-------|
| `/help` | Show all commands | `/help` |

## 🎵 Supported Sources

- **YouTube** - Full support for YouTube videos and playlists
- **Spotify** - Play songs and playlists from Spotify (requires API setup)
- **SoundCloud** - Support for SoundCloud tracks
- **Direct URLs** - Support for direct audio file URLs

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Discord bot token | Required |
| `DISCORD_CLIENT_ID` | Discord application client ID | Required |
| `SPOTIFY_CLIENT_ID` | Spotify API client ID | Optional |
| `SPOTIFY_CLIENT_SECRET` | Spotify API client secret | Optional |
| `PREFIX` | Bot command prefix | `!` |
| `OWNER_ID` | Bot owner Discord user ID | Optional |
| `MAX_QUEUE_SIZE` | Maximum songs in queue | `100` |
| `DEFAULT_VOLUME` | Default bot volume | `50` |
| `LOG_LEVEL` | Logging level | `info` |

### Bot Configuration

Edit `src/config/bot.js` to customize:
- Default volume levels
- Maximum song duration
- Search result limits
- Embed colors and emojis

## 🏗️ Project Structure

```
src/
├── commands/           # Slash command files
│   ├── play.js
│   ├── pause.js
│   ├── queue.js
│   └── ...
├── music/             # Music-related modules
│   └── PlayerManager.js
├── utils/             # Utility functions
│   └── logger.js
├── config/            # Configuration files
│   └── bot.js
├── deploy-commands.js # Command deployment script
└── index.js          # Main bot file
```

## 🐛 Troubleshooting

### Common Issues

**Bot doesn't respond to commands:**
- Make sure you've deployed slash commands with `npm run deploy`
- Check that the bot has the correct permissions
- Verify the bot is online and in the server

**Music doesn't play:**
- Ensure the bot is in a voice channel
- Check that you have a stable internet connection
- Verify the song URL is valid and accessible

**Spotify integration not working:**
- Make sure you've set up Spotify API credentials
- Check that the Spotify app has the correct permissions
- Verify the credentials are correct in your `.env` file

### Logs

Check the `logs/` directory for detailed error logs:
- `error.log` - Error-level logs
- `combined.log` - All logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [@discordjs/voice](https://github.com/discordjs/voice) - Voice connection library
- [play-dl](https://github.com/play-dl/play-dl) - Music source library
- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube downloader

## 📞 Support

If you encounter any issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub Issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information

---

Made with ❤️ for the Discord community