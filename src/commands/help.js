import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎵 Music Bot Commands')
            .setDescription('Here are all the available commands:')
            .addFields(
                {
                    name: '🎵 Music Controls',
                    value: [
                        '`/play <query>` - Play a song from YouTube or Spotify',
                        '`/pause` - Pause the currently playing song',
                        '`/resume` - Resume the paused song',
                        '`/skip` - Skip the current song',
                        '`/stop` - Stop music and clear queue',
                        '`/nowplaying` - Show currently playing song'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📋 Queue Management',
                    value: [
                        '`/queue [page]` - Show the music queue',
                        '`/shuffle` - Shuffle the queue',
                        '`/clear` - Clear the queue'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎛️ Audio Controls',
                    value: [
                        '`/volume <0-100>` - Set bot volume',
                        '`/lyrics [song]` - Get song lyrics'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'Made with ❤️ for music lovers' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
