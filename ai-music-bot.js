// ========================================
// AI-POWERED CONVERSATIONAL MUSIC BOT
// ========================================

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus, 
    entersState
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');
const play = require('play-dl');
const youtubeSearch = require('youtube-search-without-api-key');
const OpenAI = require('openai');
const { HfInference } = require('@huggingface/inference');
const { google } = require('googleapis');
const NodeCache = require('node-cache');
const express = require('express');
const winston = require('winston');
const moment = require('moment');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const config = require('./config');

// ========================================
// AI & API INITIALIZATION
// ========================================

// OpenAI Setup
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

// Hugging Face Setup
const hf = new HfInference(config.HF_API_KEY);

// Google Drive Setup
const googleCredentials = config.GOOGLE_DRIVE_CREDENTIALS;
const auth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
});
const drive = google.drive({ version: 'v3', auth });

// Logger Setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/ai-bot.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Cache for AI responses and music data
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// ========================================
// AI MUSIC BOT CLASS
// ========================================

class AIMusicBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences
            ]
        });

        this.musicQueues = new Map();
        this.conversationHistory = new Map();
        this.userPreferences = new Map();
        this.aiContext = new Map();
        
        this.setupEventHandlers();
    }

    // ========================================
    // AI CONVERSATION HANDLING
    // ========================================

    async processMessage(message) {
        try {
            const userId = message.author.id;
            const guildId = message.guild?.id;
            
            // Get conversation history
            const history = this.conversationHistory.get(userId) || [];
            
            // Analyze message with AI
            const analysis = await this.analyzeMessage(message.content, history);
            
            // Update conversation history
            history.push({
                role: 'user',
                content: message.content,
                timestamp: Date.now()
            });

            // Process based on analysis
            let response;
            if (analysis.intent === 'music_request') {
                response = await this.handleMusicRequest(message, analysis);
            } else if (analysis.intent === 'mood_based_request') {
                response = await this.handleMoodBasedRequest(message, analysis);
            } else if (analysis.intent === 'conversation') {
                response = await this.handleConversation(message, analysis);
            } else {
                response = await this.handleGeneralQuery(message, analysis);
            }

            // Update conversation history with AI response
            history.push({
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            });

            // Keep only last 10 messages
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }
            
            this.conversationHistory.set(userId, history);

            return response;
        } catch (error) {
            logger.error('Error processing message:', error);
            return {
                text: "Sorry, I encountered an error processing your request. Please try again!",
                type: 'error'
            };
        }
    }

    async analyzeMessage(message, history) {
        try {
            const prompt = `
            Analyze this Discord message for music bot interaction:
            
            Message: "${message}"
            Recent conversation: ${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}
            
            Determine:
            1. Intent: music_request, mood_based_request, conversation, general_query
            2. Mood/emotion: happy, sad, energetic, calm, nostalgic, etc.
            3. Music preferences: genre, artist, era, etc.
            4. Action needed: play, search, recommend, explain, etc.
            
            Respond in JSON format:
            {
                "intent": "music_request",
                "mood": "energetic",
                "preferences": ["rock", "pop"],
                "action": "play",
                "confidence": 0.9
            }
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 200
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            logger.error('Error analyzing message:', error);
            return {
                intent: 'general_query',
                mood: 'neutral',
                preferences: [],
                action: 'explain',
                confidence: 0.5
            };
        }
    }

    // ========================================
    // MUSIC REQUEST HANDLING
    // ========================================

    async handleMusicRequest(message, analysis) {
        try {
            const voiceChannel = message.member?.voice?.channel;
            if (!voiceChannel) {
                return {
                    text: "🎵 I'd love to play music for you! Please join a voice channel first.",
                    type: 'info'
                };
            }

            // Generate AI-powered search query
            const searchQuery = await this.generateSearchQuery(message.content, analysis);
            
            // Search for music
            const results = await this.searchMusic(searchQuery, analysis.preferences);
            
            if (results.length === 0) {
                return {
                    text: "🎵 I couldn't find any music matching your request. Try asking for a specific song or artist!",
                    type: 'info'
                };
            }

            // Play the music
            const song = results[0];
            await this.playMusic(message.guild.id, voiceChannel, song);

            // Generate AI response about the song
            const aiResponse = await this.generateSongResponse(song, analysis);

            return {
                text: aiResponse,
                type: 'music',
                song: song,
                embed: this.createMusicEmbed(song, analysis)
            };
        } catch (error) {
            logger.error('Error handling music request:', error);
            return {
                text: "🎵 Sorry, I had trouble playing that music. Please try again!",
                type: 'error'
            };
        }
    }

    async handleMoodBasedRequest(message, analysis) {
        try {
            // Use AI to generate mood-based playlist
            const moodPlaylist = await this.generateMoodPlaylist(analysis.mood, analysis.preferences);
            
            const voiceChannel = message.member?.voice?.channel;
            if (!voiceChannel) {
                return {
                    text: `🎭 I've created a ${analysis.mood} playlist for you! Join a voice channel and I'll start playing it.`,
                    type: 'info',
                    playlist: moodPlaylist
                };
            }

            // Play the first song from mood playlist
            if (moodPlaylist.length > 0) {
                await this.playMusic(message.guild.id, voiceChannel, moodPlaylist[0]);
                
                return {
                    text: `🎭 Perfect! I'm playing some ${analysis.mood} music to match your mood.`,
                    type: 'mood_music',
                    playlist: moodPlaylist
                };
            }

            return {
                text: "🎭 I understand your mood, but I couldn't find suitable music right now. Try being more specific!",
                type: 'info'
            };
        } catch (error) {
            logger.error('Error handling mood request:', error);
            return {
                text: "🎭 Sorry, I couldn't create a mood playlist right now. Please try again!",
                type: 'error'
            };
        }
    }

    async handleConversation(message, analysis) {
        try {
            const prompt = `
            You are a friendly AI music bot assistant. Respond naturally to this message:
            
            Message: "${message.content}"
            Context: User is chatting with a music bot
            Mood detected: ${analysis.mood}
            
            Be helpful, friendly, and music-focused. Keep responses concise and engaging.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 150
            });

            return {
                text: completion.choices[0].message.content,
                type: 'conversation'
            };
        } catch (error) {
            logger.error('Error handling conversation:', error);
            return {
                text: "Hey! I'm here to help with music. What would you like to listen to?",
                type: 'conversation'
            };
        }
    }

    async handleGeneralQuery(message, analysis) {
        try {
            // Use Hugging Face for sentiment analysis
            const sentiment = await hf.textClassification({
                model: "cardiffnlp/twitter-roberta-base-sentiment-latest",
                inputs: message.content
            });

            const prompt = `
            User asked: "${message.content}"
            Sentiment: ${sentiment[0].label} (${Math.round(sentiment[0].score * 100)}% confidence)
            Mood: ${analysis.mood}
            
            Provide a helpful response about music, recommendations, or general assistance.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.6,
                max_tokens: 200
            });

            return {
                text: completion.choices[0].message.content,
                type: 'general',
                sentiment: sentiment[0]
            };
        } catch (error) {
            logger.error('Error handling general query:', error);
            return {
                text: "I'm here to help with music! Ask me to play something, recommend songs, or just chat!",
                type: 'general'
            };
        }
    }

    // ========================================
    // AI-POWERED MUSIC FUNCTIONS
    // ========================================

    async generateSearchQuery(originalMessage, analysis) {
        try {
            const prompt = `
            Convert this music request into an optimized search query:
            
            Original: "${originalMessage}"
            Mood: ${analysis.mood}
            Preferences: ${analysis.preferences.join(', ')}
            
            Create a search query that will find the best music match.
            Examples:
            - "play some upbeat rock music" → "upbeat rock songs"
            - "I'm feeling sad" → "sad songs emotional music"
            - "play something from the 80s" → "80s music hits"
            
            Return only the search query, nothing else.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 50
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            logger.error('Error generating search query:', error);
            return originalMessage;
        }
    }

    async generateMoodPlaylist(mood, preferences) {
        try {
            const prompt = `
            Create a ${mood} music playlist. User preferences: ${preferences.join(', ')}
            
            Return 5 song suggestions in this format:
            Song Title - Artist Name
            
            Focus on songs that match the mood and preferences.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 300
            });

            const playlistText = completion.choices[0].message.content;
            const songs = playlistText.split('\n').filter(line => line.trim()).slice(0, 5);
            
            // Search for each song
            const playlist = [];
            for (const song of songs) {
                const results = await this.searchMusic(song, preferences);
                if (results.length > 0) {
                    playlist.push(results[0]);
                }
            }

            return playlist;
        } catch (error) {
            logger.error('Error generating mood playlist:', error);
            return [];
        }
    }

    async generateSongResponse(song, analysis) {
        try {
            const prompt = `
            Generate a friendly response about this song:
            
            Song: ${song.title}
            Artist: ${song.artist || 'Unknown'}
            Mood: ${analysis.mood}
            
            Create an engaging response that mentions the song and matches the user's mood.
            Keep it under 100 characters and include an emoji.
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 100
            });

            return completion.choices[0].message.content;
        } catch (error) {
            logger.error('Error generating song response:', error);
            return `🎵 Now playing: **${song.title}**`;
        }
    }

    // ========================================
    // MUSIC SEARCH & PLAYBACK
    // ========================================

    async searchMusic(query, preferences = []) {
        try {
            // Check cache first
            const cached = cache.get(`search_${query}`);
            if (cached) return cached;

            const results = await youtubeSearch.search(query, { limit: 5 });
            const musicResults = results.map(result => ({
                title: result.title,
                url: result.url,
                duration: result.duration,
                thumbnail: result.thumbnail,
                artist: this.extractArtist(result.title),
                source: 'youtube'
            }));

            // Cache results
            cache.set(`search_${query}`, musicResults, 300);
            return musicResults;
        } catch (error) {
            logger.error('Error searching music:', error);
            return [];
        }
    }

    extractArtist(title) {
        // Simple artist extraction from title
        const parts = title.split(' - ');
        return parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
    }

    async playMusic(guildId, voiceChannel, song) {
        try {
            // Initialize queue if needed
            if (!this.musicQueues.has(guildId)) {
                this.musicQueues.set(guildId, {
                    songs: [],
                    voiceChannel: null,
                    currentSong: null,
                    isPlaying: false
                });
            }

            const queue = this.musicQueues.get(guildId);
            queue.songs.push(song);
            queue.voiceChannel = voiceChannel;

            if (queue.songs.length === 1) {
                await this.startPlayback(guildId, voiceChannel, song);
            }
        } catch (error) {
            logger.error('Error playing music:', error);
            throw error;
        }
    }

    async startPlayback(guildId, voiceChannel, song) {
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            const player = createAudioPlayer();
            connection.subscribe(player);

            let stream;
            try {
                const info = await play.video_basic_info(song.url);
                stream = await play.stream(info, { seek: 0 });
            } catch (error) {
                stream = ytdl(song.url, { 
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                });
            }

            const resource = createAudioResource(stream, {
                inputType: stream.type || 'unknown'
            });

            player.play(resource);

            player.on(AudioPlayerStatus.Playing, () => {
                logger.info(`Now playing: ${song.title} in guild ${guildId}`);
            });

            player.on(AudioPlayerStatus.Idle, () => {
                this.playNext(guildId);
            });

            player.on('error', error => {
                logger.error('Audio player error:', error);
                this.playNext(guildId);
            });

        } catch (error) {
            logger.error('Error starting playback:', error);
            throw error;
        }
    }

    playNext(guildId) {
        const queue = this.musicQueues.get(guildId);
        if (!queue || queue.songs.length === 0) return;

        queue.songs.shift();
        if (queue.songs.length > 0) {
            this.startPlayback(guildId, queue.voiceChannel, queue.songs[0]);
        }
    }

    // ========================================
    // GOOGLE DRIVE INTEGRATION
    // ========================================

    async searchGoogleDriveMusic(query) {
        try {
            const response = await drive.files.list({
                q: `name contains '${query}' and mimeType contains 'audio'`,
                fields: 'files(id, name, webContentLink)',
                pageSize: 10
            });

            return response.data.files.map(file => ({
                title: file.name,
                url: file.webContentLink,
                source: 'google_drive',
                id: file.id
            }));
        } catch (error) {
            logger.error('Error searching Google Drive:', error);
            return [];
        }
    }

    // ========================================
    // UI COMPONENTS
    // ========================================

    createMusicEmbed(song, analysis) {
        const embed = new EmbedBuilder()
            .setColor(this.getMoodColor(analysis.mood))
            .setTitle(`🎵 ${song.title}`)
            .setDescription(`**Artist:** ${song.artist || 'Unknown'}\n**Mood:** ${analysis.mood}`)
            .setThumbnail(song.thumbnail || 'https://i.ytimg.com/vi/default/maxresdefault.jpg')
            .setTimestamp();

        if (song.url) {
            embed.setURL(song.url);
        }

        return embed;
    }

    getMoodColor(mood) {
        const colors = {
            happy: 0x00ff00,
            sad: 0x0099ff,
            energetic: 0xff0000,
            calm: 0x00ffff,
            nostalgic: 0xff9900,
            neutral: 0x666666
        };
        return colors[mood] || 0x666666;
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    setupEventHandlers() {
        this.client.on('ready', () => {
            console.log(gradient.rainbow(figlet.textSync('AI MUSIC BOT', { horizontalLayout: 'full' })));
            console.log(chalk.cyan('🤖 AI-Powered Music Bot is online!'));
            console.log(chalk.green(`Bot: ${this.client.user.tag}`));
            console.log(chalk.green(`Servers: ${this.client.guilds.cache.size}`));
            console.log(chalk.green(`Users: ${this.client.users.cache.size}`));
            
            this.client.user.setActivity('AI Music | Just chat with me!', { type: ActivityType.Listening });
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (!message.guild) return;

            // Check if bot is mentioned or message starts with bot prefix
            const botMention = `<@${this.client.user.id}>`;
            if (!message.content.includes(botMention) && !message.content.startsWith('!music')) return;

            try {
                const response = await this.processMessage(message);
                
                if (response.embed) {
                    await message.reply({ 
                        content: response.text, 
                        embeds: [response.embed] 
                    });
                } else {
                    await message.reply(response.text);
                }
            } catch (error) {
                logger.error('Error handling message:', error);
                await message.reply('Sorry, I encountered an error. Please try again!');
            }
        });
    }

    // ========================================
    // START BOT
    // ========================================

    async start() {
        if (!config.DISCORD_TOKEN) {
            logger.error('❌ DISCORD_TOKEN not set!');
            process.exit(1);
        }

        await this.client.login(config.DISCORD_TOKEN);
    }
}

// ========================================
// WEB DASHBOARD
// ========================================

function initializeWebDashboard() {
    const app = express();
    const port = config.PORT;

    app.use(express.json());

    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            bot: 'AI Music Bot',
            features: [
                'Natural language processing',
                'AI-powered music recommendations',
                'Mood-based playlists',
                'Google Drive integration',
                'Conversational interface'
            ]
        });
    });

    app.listen(port, () => {
        logger.info(`Web dashboard running on port ${port}`);
    });
}

// ========================================
// START APPLICATION
// ========================================

const bot = new AIMusicBot();
initializeWebDashboard();
bot.start().catch(console.error);
