// ========================================
// PREMIUM DISCORD MUSIC BOT v3.0.0
// ========================================

const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    REST, 
    Routes, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ComponentType,
    PermissionFlagsBits,
    ChannelType,
    ActivityType
} = require('discord.js');

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus, 
    entersState,
    getVoiceConnection,
    AudioPlayerState
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');
const play = require('play-dl');
const youtubeSearch = require('youtube-search-without-api-key');
const SpotifyWebApi = require('spotify-web-api-node');
const NodeCache = require('node-cache');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const moment = require('moment');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const boxen = require('boxen');
const ora = require('ora');

// ========================================
// CONFIGURATION & INITIALIZATION
// ========================================

// Logger Setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Cache Setup
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

// Bot Configuration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// Global Variables
const musicQueues = new Map();
const userPreferences = new Map();
const botStats = {
    totalSongsPlayed: 0,
    totalUptime: 0,
    totalServers: 0,
    totalUsers: 0,
    startTime: Date.now()
};

// ========================================
// PREMIUM COMMANDS
// ========================================

const premiumCommands = [
    // Music Commands
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play music from various sources')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or search term')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('source')
                .setDescription('Music source preference')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Spotify', value: 'spotify' },
                    { name: 'Auto-detect', value: 'auto' }
                )
        ),

    new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('📋 Playlist management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Playlist name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add song to playlist')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Playlist name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('Song name or URL')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Play entire playlist')
                .addStringOption(option =>
                    option.setName('playlist')
                        .setDescription('Playlist name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all playlists')
        ),

    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Advanced queue management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show current queue')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page number')
                        .setRequired(false)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shuffle')
                .setDescription('Shuffle the queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear the queue')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove song from queue')
                .addIntegerOption(option =>
                    option.setName('position')
                        .setDescription('Song position in queue')
                        .setRequired(true)
                        .setMinValue(1)
                )
        ),

    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip songs')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of songs to skip')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10)
        ),

    new SlashCommandBuilder()
        .setName('seek')
        .setDescription('⏰ Seek to position in song')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time (e.g., 1:30, 90s, 2m)')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Control volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(100)
        ),

    new SlashCommandBuilder()
        .setName('filter')
        .setDescription('🎛️ Apply audio filters')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    { name: 'Bass Boost', value: 'bassboost' },
                    { name: 'Nightcore', value: 'nightcore' },
                    { name: '8D Audio', value: '8d' },
                    { name: 'Vaporwave', value: 'vaporwave' },
                    { name: 'Clear', value: 'clear' }
                )
        ),

    new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('🎤 Get song lyrics')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name (optional)')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Show currently playing song')
        .addBooleanOption(option =>
            option.setName('detailed')
                .setDescription('Show detailed information')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop music and clear queue'),

    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause music playback'),

    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume music playback'),

    // Utility Commands
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Check bot latency and status'),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Show bot statistics'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('❓ Show help information')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Specific command to get help for')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    // Admin Commands
    new SlashCommandBuilder()
        .setName('admin')
        .setDescription('⚙️ Admin commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup bot for this server')
                .addChannelOption(option =>
                    option.setName('music_channel')
                        .setDescription('Channel for music commands')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configure bot settings')
                .addStringOption(option =>
                    option.setName('setting')
                        .setDescription('Setting to configure')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Default Volume', value: 'volume' },
                            { name: 'Auto-play', value: 'autoplay' },
                            { name: 'DJ Role', value: 'dj_role' }
                        )
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('New value')
                        .setRequired(true)
                )
        ),

    // Fun Commands
    new SlashCommandBuilder()
        .setName('radio')
        .setDescription('📻 Play radio stations')
        .addStringOption(option =>
            option.setName('station')
                .setDescription('Radio station')
                .setRequired(true)
                .addChoices(
                    { name: 'Lofi Hip Hop', value: 'lofi' },
                    { name: 'Chill Beats', value: 'chill' },
                    { name: 'Jazz', value: 'jazz' },
                    { name: 'Classical', value: 'classical' },
                    { name: 'Electronic', value: 'electronic' }
                )
        )
];

// ========================================
// PREMIUM MUSIC FUNCTIONS
// ========================================

class PremiumMusicManager {
    constructor() {
        this.players = new Map();
        this.connections = new Map();
        this.filters = new Map();
    }

    async playMusic(guildId, voiceChannel, song, options = {}) {
        try {
            const connection = this.getOrCreateConnection(guildId, voiceChannel);
            const player = this.getOrCreatePlayer(guildId);

            // Apply filters if any
            const stream = await this.createStream(song, options);
            const resource = createAudioResource(stream, {
                inputType: stream.type || 'unknown',
                inlineVolume: true
            });

            // Set volume
            if (options.volume) {
                resource.volume.setVolume(options.volume / 100);
            }

            player.play(resource);

            // Set up event listeners
            this.setupPlayerEvents(guildId, player);

            return { success: true, player, connection };
        } catch (error) {
            logger.error('Play music error:', error);
            return { success: false, error: error.message };
        }
    }

    async createStream(song, options = {}) {
        try {
            // Try play-dl first (more reliable)
            if (song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
                const info = await play.video_basic_info(song.url);
                return await play.stream(info, { seek: 0 });
            }
            
            // Fallback to ytdl-core
            return ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });
        } catch (error) {
            logger.error('Stream creation error:', error);
            throw error;
        }
    }

    getOrCreateConnection(guildId, voiceChannel) {
        let connection = this.connections.get(guildId);
        
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            
            this.connections.set(guildId, connection);
        }
        
        return connection;
    }

    getOrCreatePlayer(guildId) {
        let player = this.players.get(guildId);
        
        if (!player) {
            player = createAudioPlayer();
            this.players.set(guildId, player);
        }
        
        return player;
    }

    setupPlayerEvents(guildId, player) {
        player.on(AudioPlayerStatus.Playing, () => {
            logger.info(`Music started playing in guild ${guildId}`);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            this.playNext(guildId);
        });

        player.on('error', error => {
            logger.error(`Audio player error in guild ${guildId}:`, error);
            this.playNext(guildId);
        });
    }

    playNext(guildId) {
        const queue = musicQueues.get(guildId);
        if (!queue || queue.songs.length === 0) return;

        queue.songs.shift();
        if (queue.songs.length > 0) {
            const nextSong = queue.songs[0];
            this.playMusic(guildId, queue.voiceChannel, nextSong);
        }
    }

    async searchSong(query, source = 'auto') {
        try {
            // Check cache first
            const cached = cache.get(`search_${query}`);
            if (cached) return cached;

            let results = [];

            switch (source) {
                case 'youtube':
                    results = await this.searchYouTube(query);
                    break;
                case 'spotify':
                    results = await this.searchSpotify(query);
                    break;
                default:
                    // Try YouTube first, then Spotify
                    results = await this.searchYouTube(query);
                    if (results.length === 0) {
                        results = await this.searchSpotify(query);
                    }
            }

            // Cache results for 5 minutes
            cache.set(`search_${query}`, results, 300);
            return results;
        } catch (error) {
            logger.error('Search error:', error);
            return [];
        }
    }

    async searchYouTube(query) {
        try {
            const results = await youtubeSearch.search(query, { limit: 10 });
            return results.map(result => ({
                title: result.title,
                url: result.url,
                duration: result.duration,
                thumbnail: result.thumbnail,
                source: 'youtube'
            }));
        } catch (error) {
            logger.error('YouTube search error:', error);
            return [];
        }
    }

    async searchSpotify(query) {
        // Placeholder for Spotify search
        // Would require Spotify API setup
        return [];
    }
}

// ========================================
// PREMIUM UI COMPONENTS
// ========================================

class PremiumUI {
    static createNowPlayingEmbed(song, queue, position = 0) {
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🎵 Now Playing')
            .setDescription(`**${song.title}**`)
            .addFields(
                { name: 'Duration', value: this.formatDuration(song.duration), inline: true },
                { name: 'Position', value: `${position + 1}/${queue.songs.length}`, inline: true },
                { name: 'Source', value: song.source || 'YouTube', inline: true }
            )
            .setThumbnail(song.thumbnail || 'https://i.ytimg.com/vi/default/maxresdefault.jpg')
            .setTimestamp();

        if (song.url) {
            embed.setURL(song.url);
        }

        return embed;
    }

    static createQueueEmbed(queue, page = 1) {
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const songs = queue.songs.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('📋 Music Queue')
            .setDescription(songs.map((song, index) => 
                `${startIndex + index + 1}. **${song.title}** (${this.formatDuration(song.duration)})`
            ).join('\n') || 'Queue is empty')
            .setFooter({ text: `Page ${page} of ${Math.ceil(queue.songs.length / itemsPerPage)}` })
            .setTimestamp();

        return embed;
    }

    static createControlButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pause_resume')
                    .setLabel('⏸️ Pause')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('⏭️ Skip')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('stop')
                    .setLabel('⏹️ Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('queue')
                    .setLabel('📋 Queue')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('volume')
                    .setLabel('🔊 Volume')
                    .setStyle(ButtonStyle.Secondary)
            );
    }

    static formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// ========================================
// PREMIUM ANALYTICS
// ========================================

class PremiumAnalytics {
    constructor() {
        this.stats = {
            totalSongsPlayed: 0,
            totalUptime: 0,
            totalServers: 0,
            totalUsers: 0,
            popularSongs: new Map(),
            serverStats: new Map(),
            userStats: new Map()
        };
    }

    trackSongPlay(guildId, userId, song) {
        this.stats.totalSongsPlayed++;
        
        // Track popular songs
        const songKey = `${song.title}_${song.url}`;
        this.stats.popularSongs.set(songKey, (this.stats.popularSongs.get(songKey) || 0) + 1);
        
        // Track server stats
        const serverStats = this.stats.serverStats.get(guildId) || { songsPlayed: 0, uniqueUsers: new Set() };
        serverStats.songsPlayed++;
        serverStats.uniqueUsers.add(userId);
        this.stats.serverStats.set(guildId, serverStats);
        
        // Track user stats
        const userStats = this.stats.userStats.get(userId) || { songsPlayed: 0, favoriteSongs: new Map() };
        userStats.songsPlayed++;
        userStats.favoriteSongs.set(songKey, (userStats.favoriteSongs.get(songKey) || 0) + 1);
        this.stats.userStats.set(userId, userStats);
    }

    getStats() {
        return {
            ...this.stats,
            totalUptime: Date.now() - botStats.startTime,
            totalServers: client.guilds.cache.size,
            totalUsers: client.users.cache.size
        };
    }
}

// ========================================
// PREMIUM WEB DASHBOARD
// ========================================

function initializeWebDashboard() {
    const app = express();
    const port = process.env.PORT || 3000;

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(morgan('combined'));
    app.use(express.json());

    // Routes
    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            bot: {
                name: client.user?.tag || 'Premium Music Bot',
                servers: client.guilds.cache.size,
                users: client.users.cache.size,
                uptime: process.uptime()
            },
            stats: analytics.getStats()
        });
    });

    app.get('/stats', (req, res) => {
        res.json(analytics.getStats());
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    app.listen(port, () => {
        logger.info(`Web dashboard running on port ${port}`);
    });
}

// ========================================
// INITIALIZATION
// ========================================

const musicManager = new PremiumMusicManager();
const analytics = new PremiumAnalytics();

// Register commands
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        logger.info('Registering premium commands...');
        
        await rest.put(Routes.applicationCommands(client.user.id), {
            body: premiumCommands.map(command => command.toJSON())
        });
        
        logger.info('✅ Premium commands registered successfully!');
    } catch (error) {
        logger.error('❌ Command registration failed:', error);
    }
}

// ========================================
// EVENT HANDLERS
// ========================================

client.on('ready', async () => {
    // Display startup banner
    console.log(gradient.rainbow(figlet.textSync('PREMIUM BOT', { horizontalLayout: 'full' })));
    console.log(boxen(
        gradient.rainbow('🚀 PREMIUM DISCORD MUSIC BOT v3.0.0 ONLINE! 🚀\n') +
        chalk.white(`Bot: ${client.user.tag}\n`) +
        chalk.white(`Servers: ${client.guilds.cache.size}\n`) +
        chalk.white(`Users: ${client.users.cache.size}\n`) +
        chalk.white(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`) +
        chalk.white(`Uptime: 24/7 Premium Hosting`),
        { 
            padding: 1, 
            margin: 1, 
            borderStyle: 'double',
            borderColor: 'cyan'
        }
    ));

    // Set bot activity
    client.user.setActivity('Premium Music | /help', { type: ActivityType.Listening });

    // Initialize systems
    await registerCommands();
    initializeWebDashboard();

    logger.info('Premium bot is ready!');
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction);
    } else if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
    }
});

// ========================================
// COMMAND HANDLERS
// ========================================

async function handleSlashCommand(interaction) {
    const { commandName, guild, member } = interaction;

    try {
        switch (commandName) {
            case 'play':
                await handlePlayCommand(interaction);
                break;
            case 'playlist':
                await handlePlaylistCommand(interaction);
                break;
            case 'queue':
                await handleQueueCommand(interaction);
                break;
            case 'skip':
                await handleSkipCommand(interaction);
                break;
            case 'seek':
                await handleSeekCommand(interaction);
                break;
            case 'volume':
                await handleVolumeCommand(interaction);
                break;
            case 'filter':
                await handleFilterCommand(interaction);
                break;
            case 'lyrics':
                await handleLyricsCommand(interaction);
                break;
            case 'nowplaying':
                await handleNowPlayingCommand(interaction);
                break;
            case 'stop':
                await handleStopCommand(interaction);
                break;
            case 'pause':
                await handlePauseCommand(interaction);
                break;
            case 'resume':
                await handleResumeCommand(interaction);
                break;
            case 'ping':
                await handlePingCommand(interaction);
                break;
            case 'stats':
                await handleStatsCommand(interaction);
                break;
            case 'help':
                await handleHelpCommand(interaction);
                break;
            case 'admin':
                await handleAdminCommand(interaction);
                break;
            case 'radio':
                await handleRadioCommand(interaction);
                break;
        }
    } catch (error) {
        logger.error(`Command error (${commandName}):`, error);
        await interaction.reply({ 
            content: '❌ An error occurred while processing your command!', 
            ephemeral: true 
        }).catch(() => {});
    }
}

async function handlePlayCommand(interaction) {
    await interaction.deferReply();
    
    const query = interaction.options.getString('query');
    const source = interaction.options.getString('source') || 'auto';
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
        await interaction.editReply('❌ You need to be in a voice channel!');
        return;
    }

    // Search for songs
    const results = await musicManager.searchSong(query, source);
    
    if (results.length === 0) {
        await interaction.editReply('❌ No songs found!');
        return;
    }

    // Initialize queue if needed
    if (!musicQueues.has(interaction.guild.id)) {
        musicQueues.set(interaction.guild.id, {
            songs: [],
            voiceChannel: null,
            currentSong: null,
            isPlaying: false,
            volume: 50
        });
    }

    const queue = musicQueues.get(interaction.guild.id);
    const song = results[0];
    
    queue.songs.push(song);
    queue.voiceChannel = voiceChannel;

    // Track analytics
    analytics.trackSongPlay(interaction.guild.id, interaction.user.id, song);

    if (queue.songs.length === 1) {
        const result = await musicManager.playMusic(interaction.guild.id, voiceChannel, song);
        
        if (result.success) {
            queue.isPlaying = true;
            queue.currentSong = song;
        }
    }

    const embed = PremiumUI.createNowPlayingEmbed(song, queue, 0);
    const buttons = PremiumUI.createControlButtons();

    await interaction.editReply({ 
        embeds: [embed], 
        components: [buttons] 
    });
}

async function handleQueueCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const queue = musicQueues.get(interaction.guild.id);

    if (!queue || queue.songs.length === 0) {
        await interaction.reply('📋 Queue is empty!');
        return;
    }

    switch (subcommand) {
        case 'show':
            const page = interaction.options.getInteger('page') || 1;
            const embed = PremiumUI.createQueueEmbed(queue, page);
            await interaction.reply({ embeds: [embed] });
            break;
        case 'shuffle':
            // Shuffle queue logic
            for (let i = queue.songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
            }
            await interaction.reply('🔀 Queue shuffled!');
            break;
        case 'clear':
            queue.songs = [];
            await interaction.reply('🗑️ Queue cleared!');
            break;
        case 'remove':
            const position = interaction.options.getInteger('position');
            if (position > queue.songs.length) {
                await interaction.reply('❌ Invalid position!');
                return;
            }
            const removed = queue.songs.splice(position - 1, 1)[0];
            await interaction.reply(`🗑️ Removed: **${removed.title}**`);
            break;
    }
}

async function handlePingCommand(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🏓 Bot Status')
        .addFields(
            { name: 'Latency', value: `${client.ws.ping}ms`, inline: true },
            { name: 'Uptime', value: `${Math.floor(process.uptime())}s`, inline: true },
            { name: 'Memory', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
            { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
            { name: 'Users', value: `${client.users.cache.size}`, inline: true },
            { name: 'Songs Played', value: `${analytics.getStats().totalSongsPlayed}`, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleStatsCommand(interaction) {
    const stats = analytics.getStats();
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📊 Bot Statistics')
        .addFields(
            { name: 'Total Songs Played', value: stats.totalSongsPlayed.toString(), inline: true },
            { name: 'Total Servers', value: stats.totalServers.toString(), inline: true },
            { name: 'Total Users', value: stats.totalUsers.toString(), inline: true },
            { name: 'Uptime', value: PremiumUI.formatDuration(Math.floor(stats.totalUptime / 1000)), inline: true },
            { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
            { name: 'Node.js Version', value: process.version, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Placeholder handlers for other commands
async function handlePlaylistCommand(interaction) {
    await interaction.reply('📋 Playlist feature coming soon!');
}

async function handleSkipCommand(interaction) {
    await interaction.reply('⏭️ Skip feature coming soon!');
}

async function handleSeekCommand(interaction) {
    await interaction.reply('⏰ Seek feature coming soon!');
}

async function handleVolumeCommand(interaction) {
    await interaction.reply('🔊 Volume control coming soon!');
}

async function handleFilterCommand(interaction) {
    await interaction.reply('🎛️ Audio filters coming soon!');
}

async function handleLyricsCommand(interaction) {
    await interaction.reply('🎤 Lyrics feature coming soon!');
}

async function handleNowPlayingCommand(interaction) {
    await interaction.reply('🎵 Now playing feature coming soon!');
}

async function handleStopCommand(interaction) {
    await interaction.reply('⏹️ Stop feature coming soon!');
}

async function handlePauseCommand(interaction) {
    await interaction.reply('⏸️ Pause feature coming soon!');
}

async function handleResumeCommand(interaction) {
    await interaction.reply('▶️ Resume feature coming soon!');
}

async function handleHelpCommand(interaction) {
    await interaction.reply('❓ Help feature coming soon!');
}

async function handleAdminCommand(interaction) {
    await interaction.reply('⚙️ Admin features coming soon!');
}

async function handleRadioCommand(interaction) {
    await interaction.reply('📻 Radio feature coming soon!');
}

async function handleButtonInteraction(interaction) {
    // Button interaction handlers
    await interaction.reply('Button interaction coming soon!');
}

async function handleSelectMenuInteraction(interaction) {
    // Select menu interaction handlers
    await interaction.reply('Select menu interaction coming soon!');
}

async function handleAutocomplete(interaction) {
    // Autocomplete handlers
    await interaction.respond([]);
}

// ========================================
// ERROR HANDLING
// ========================================

process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

// ========================================
// START BOT
// ========================================

if (!process.env.DISCORD_TOKEN) {
    logger.error('❌ DISCORD_TOKEN not set!');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
