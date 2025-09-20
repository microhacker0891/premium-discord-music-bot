import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const success = interaction.client.playerManager.resume(guildId);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ There is no paused song to resume!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('▶️ Resumed')
            .setDescription('The music has been resumed.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
