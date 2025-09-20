import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, artist, or URL to play')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const query = interaction.options.getString('query');
        const result = await interaction.client.playerManager.play(interaction, query);
        
        if (!result.success) {
            return await interaction.editReply(result.message);
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎵 Added to Queue')
            .setDescription(result.message)
            .setThumbnail(result.song.thumbnail)
            .addFields(
                { name: 'Duration', value: this.formatDuration(result.song.duration), inline: true },
                { name: 'Requested by', value: interaction.user.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
};
