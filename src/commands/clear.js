import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the music queue'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const queue = interaction.client.playerManager.getQueue(guildId);
        
        if (queue.length === 0) {
            return await interaction.reply({
                content: '📭 The queue is already empty!',
                ephemeral: true
            });
        }

        // Clear the queue (keep the first song if playing)
        const playerData = interaction.client.playerManager.players.get(guildId);
        const isPlaying = playerData && playerData.player.state.status === 'playing';
        
        if (isPlaying && queue.length > 1) {
            // Keep only the currently playing song
            const currentSong = queue[0];
            interaction.client.playerManager.queues.set(guildId, [currentSong]);
        } else {
            // Clear everything
            interaction.client.playerManager.queues.set(guildId, []);
        }

        const clearedCount = isPlaying ? queue.length - 1 : queue.length;

        const embed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Queue Cleared')
            .setDescription(`Cleared **${clearedCount}** songs from the queue.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
