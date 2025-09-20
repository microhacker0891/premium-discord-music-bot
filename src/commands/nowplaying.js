import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const playerData = interaction.client.playerManager.players.get(guildId);
        
        if (!playerData || playerData.player.state.status === 'idle') {
            return await interaction.reply({
                content: '❌ No song is currently playing!',
                ephemeral: true
            });
        }

        const queue = interaction.client.playerManager.getQueue(guildId);
        if (queue.length === 0) {
            return await interaction.reply({
                content: '❌ No song is currently playing!',
                ephemeral: true
            });
        }

        // Get the currently playing song (first in queue)
        const currentSong = queue[0];
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎵 Now Playing')
            .setDescription(`**${currentSong.title}**`)
            .addFields(
                { name: 'Duration', value: this.formatDuration(currentSong.duration), inline: true },
                { name: 'Status', value: playerData.player.state.status === 'playing' ? '▶️ Playing' : '⏸️ Paused', inline: true },
                { name: 'Queue', value: `${queue.length} songs`, inline: true }
            )
            .setTimestamp();

        if (currentSong.thumbnail) {
            embed.setThumbnail(currentSong.thumbnail);
        }

        if (currentSong.url) {
            embed.setURL(currentSong.url);
        }

        await interaction.reply({ embeds: [embed] });
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
};
