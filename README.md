# 🎵 Premium Discord Music Bot

A feature-rich Discord music bot built with Discord.js v14, supporting YouTube, Spotify, and more music sources. This bot provides high-quality music streaming with advanced queue management and audio controls.

> **Note**: This repository also contains AI-powered music bot variants with natural language processing capabilities. See the individual bot files for different implementations.

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
=======
# 🤖 AI-Powered Discord Music Bot

> **Revolutionary Discord music bot with natural language processing and AI-powered recommendations**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14.14.1-blue.svg)](https://discord.js.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green.svg)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

### 🧠 **AI-Powered Natural Language Processing**
- **No slash commands needed** - Just chat naturally!
- **OpenAI GPT-4 integration** - Understands conversational requests
- **Hugging Face sentiment analysis** - Detects mood and plays appropriate music
- **Smart recommendations** - Learns your preferences over time

### 🎵 **Advanced Music Features**
- **YouTube integration** - Search and play any song
- **Google Drive streaming** - Stream your personal music collection
- **Mood-based playlists** - AI creates playlists based on your mood
- **Voice channel support** - High-quality audio streaming
- **Queue management** - Smart queue with auto-play

### 🔐 **Security & Performance**
- **Environment variable configuration** - No hardcoded secrets
- **Railway deployment ready** - One-click deployment
- **Lightweight and efficient** - Optimized for performance
- **Auto-restart capabilities** - 24/7 uptime

## 🚀 Quick Start

### 1. **Deploy on Railway**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### 2. **Set Environment Variables**
```bash
DISCORD_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
HF_API_KEY=your_hugging_face_api_key
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...}
```

### 3. **Invite Bot to Discord**
Create an invite with these permissions:
>>>>>>> 837ecd347083efa14341b480264ec90eab08abd2
- Send Messages
- Use Slash Commands
- Connect to Voice
- Speak in Voice
<<<<<<< HEAD
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
=======
- Read Message History

## 💬 How to Use

### **Natural Language Commands**
```
@PegasusBot play some energetic music for my workout
@PegasusBot I'm feeling sad, play something comforting
@PegasusBot create a playlist for studying
@PegasusBot I want to dance, play some electronic music
```

### **Prefix Commands**
```
!music play some jazz music
!music I'm nostalgic, play 80s hits
!music I need something calm and relaxing
```

## 🧠 AI Capabilities

### **Mood Detection**
- **Happy** → Energetic, uplifting music
- **Sad** → Comforting, emotional songs
- **Energetic** → High-energy playlists
- **Calm** → Relaxing, peaceful music
- **Nostalgic** → Songs from specific eras

### **Smart Features**
- **Context awareness** - Understands your situation
- **Learning system** - Adapts to your preferences
- **Conversational** - Feels like talking to a music expert
- **Intelligent search** - Finds perfect music for any mood

## 📁 Repository Structure

```
premium-discord-music-bot/
├── ai-music-bot.js      # 🤖 Main AI-powered bot
├── config.js            # ⚙️ Secure configuration
├── package.json         # 📦 Dependencies
├── package-lock.json    # 🔒 Dependency lock file
├── Procfile             # 🚀 Railway deployment config
├── README.md            # 📖 Documentation
└── .gitignore           # 🚫 Git ignore rules
```

## 🔧 Configuration

### **Required API Keys**
1. **Discord Bot Token** - [Discord Developer Portal](https://discord.com/developers/applications)
2. **OpenAI API Key** - [OpenAI Platform](https://platform.openai.com)
3. **Hugging Face API Key** - [Hugging Face](https://huggingface.co)
4. **Google Drive Credentials** - [Google Cloud Console](https://console.cloud.google.com)

### **Environment Variables**
```bash
# Discord
DISCORD_TOKEN=your_discord_bot_token

# AI Services
OPENAI_API_KEY=your_openai_api_key
HF_API_KEY=your_hugging_face_api_key

# Google Drive (JSON string)
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...}
```

## 🚀 Deployment

### **Railway (Recommended)**
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### **Manual Deployment**
```bash
# Clone repository
git clone https://github.com/microhacker0891/premium-discord-music-bot.git

# Install dependencies
npm install

# Set environment variables
cp config.example.js .env

# Start bot
npm start
```
>>>>>>> 837ecd347083efa14341b480264ec90eab08abd2

## 🤝 Contributing

1. Fork the repository
<<<<<<< HEAD
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
=======
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License
>>>>>>> 837ecd347083efa14341b480264ec90eab08abd2

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
<<<<<<< HEAD
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
=======
- [OpenAI](https://openai.com/) - AI language processing
- [Hugging Face](https://huggingface.co/) - Sentiment analysis
- [Railway](https://railway.app/) - Hosting platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/microhacker0891/premium-discord-music-bot/issues)
- **Discord**: [Join our server](https://discord.gg/your-server)

---

**⭐ Star this repository if you found it helpful!**

*This is the future of Discord music bots - AI-powered, conversational, and intelligent!* 🎵🤖✨
>>>>>>> 837ecd347083efa14341b480264ec90eab08abd2
