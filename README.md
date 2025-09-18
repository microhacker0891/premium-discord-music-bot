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
- Send Messages
- Use Slash Commands
- Connect to Voice
- Speak in Voice
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [OpenAI](https://openai.com/) - AI language processing
- [Hugging Face](https://huggingface.co/) - Sentiment analysis
- [Railway](https://railway.app/) - Hosting platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/microhacker0891/premium-discord-music-bot/issues)
- **Discord**: [Join our server](https://discord.gg/your-server)

---

**⭐ Star this repository if you found it helpful!**

*This is the future of Discord music bots - AI-powered, conversational, and intelligent!* 🎵🤖✨