import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing song'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const success = interaction.client.playerManager.pause(guildId);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ There is no song currently playing or already paused!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTitle('⏸️ Paused')
            .setDescription('The music has been paused.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
