const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

console.log(' Pegasus Music Bot - Starting...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

const players = new Map();
const queues = new Map();

client.once('ready', async () => {
    console.log(' Pegasus Music Bot is ONLINE!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);

    // Register slash commands
    try {
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const commands = [
            new SlashCommandBuilder()
                .setName('play')
                .setDescription('Play a song from YouTube')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('Song name or YouTube URL')
                        .setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('pause')
                .setDescription('Pause the current song'),
            
            new SlashCommandBuilder()
                .setName('resume')
                .setDescription('Resume the paused song'),
            
            new SlashCommandBuilder()
                .setName('stop')
                .setDescription('Stop the music and clear queue'),
            
            new SlashCommandBuilder()
                .setName('skip')
                .setDescription('Skip the current song'),
            
            new SlashCommandBuilder()
                .setName('queue')
                .setDescription('Show the music queue'),
            
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Check bot status')
        ];

        console.log(' Registering commands...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );

        console.log(' Commands registered successfully!');
    } catch (error) {
        console.error(' Error registering commands:', error.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case 'ping':
                await handlePing(interaction);
                break;
            case 'play':
                await handlePlay(interaction);
                break;
            case 'pause':
                await handlePause(interaction);
                break;
            case 'resume':
                await handleResume(interaction);
                break;
            case 'stop':
                await handleStop(interaction);
                break;
            case 'skip':
                await handleSkip(interaction);
                break;
            case 'queue':
                await handleQueue(interaction);
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        await interaction.reply({ content: 'An error occurred!', ephemeral: true });
    }
});

async function handlePing(interaction) {
    const embed = new EmbedBuilder()
        .setTitle(' Pong!')
        .setDescription(`**Latency:** ${Date.now() - interaction.createdTimestamp}ms\n**API Latency:** ${Math.round(client.ws.ping)}ms`)
        .setColor(0x00ff00)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handlePlay(interaction) {
    const song = interaction.options.getString('song');
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return await interaction.reply({
            content: ' You need to be in a voice channel to use this command!',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Search for the song
        const searchResults = await play.search(song, { limit: 1 });
        if (searchResults.length === 0) {
            return await interaction.editReply(' No results found for that song!');
        }

        const video = searchResults[0];
        const songInfo = {
            title: video.title,
            url: video.url,
            duration: video.durationInSec,
            thumbnail: video.thumbnails[0]?.url
        };

        // Join voice channel
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const subscription = connection.subscribe(player);

        if (subscription) {
            players.set(interaction.guild.id, { connection, player, subscription });
            queues.set(interaction.guild.id, [songInfo]);

            player.on(AudioPlayerStatus.Idle, () => {
                playNext(interaction.guild.id);
            });

            // Play the song
            const stream = await play.stream(songInfo.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);

            const embed = new EmbedBuilder()
                .setTitle(' Now Playing')
                .setDescription(`**${songInfo.title}**`)
                .setThumbnail(songInfo.thumbnail)
                .setColor(0x00ff00)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error playing song:', error);
        await interaction.editReply(' An error occurred while playing the song!');
    }
}

async function handlePause(interaction) {
    const playerData = players.get(interaction.guild.id);
    if (!playerData) {
        return await interaction.reply({
            content: ' No music is currently playing!',
            ephemeral: true
        });
    }

    playerData.player.pause();
    await interaction.reply(' Music paused!');
}

async function handleResume(interaction) {
    const playerData = players.get(interaction.guild.id);
    if (!playerData) {
        return await interaction.reply({
            content: ' No music is currently playing!',
            ephemeral: true
        });
    }

    playerData.player.unpause();
    await interaction.reply(' Music resumed!');
}

async function handleStop(interaction) {
    const playerData = players.get(interaction.guild.id);
    if (!playerData) {
        return await interaction.reply({
            content: ' No music is currently playing!',
            ephemeral: true
        });
    }

    playerData.player.stop();
    playerData.connection.destroy();
    players.delete(interaction.guild.id);
    queues.delete(interaction.guild.id);

    await interaction.reply(' Music stopped and queue cleared!');
}

async function handleSkip(interaction) {
    const playerData = players.get(interaction.guild.id);
    if (!playerData) {
        return await interaction.reply({
            content: ' No music is currently playing!',
            ephemeral: true
        });
    }

    playerData.player.stop();
    await interaction.reply(' Skipped!');
}

async function handleQueue(interaction) {
    const queue = queues.get(interaction.guild.id);
    if (!queue || queue.length === 0) {
        return await interaction.reply({
            content: ' The queue is empty!',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(' Music Queue')
        .setDescription(queue.map((song, index) => 
            `**${index + 1}.** ${song.title} \`${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}\``
        ).join('\n'))
        .setColor(0x0099ff)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

function playNext(guildId) {
    const queue = queues.get(guildId);
    if (!queue || queue.length === 0) return;

    const nextSong = queue.shift();
    const playerData = players.get(guildId);
    if (!playerData) return;

    play.stream(nextSong.url).then(stream => {
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });
        playerData.player.play(resource);
    }).catch(console.error);
}

// Handle voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
    const guildId = newState.guild.id;
    const playerData = players.get(guildId);
    
    if (!playerData) return;

    // Check if bot was disconnected
    if (oldState.member.id === client.user.id && !newState.channelId) {
        players.delete(guildId);
        queues.delete(guildId);
    }

    // Check if everyone left the voice channel
    const voiceChannel = oldState.channel;
    if (voiceChannel && voiceChannel.members.size === 1 && voiceChannel.members.has(client.user.id)) {
        players.delete(guildId);
        queues.delete(guildId);
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
