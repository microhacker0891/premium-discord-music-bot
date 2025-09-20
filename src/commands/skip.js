import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the currently playing song'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const success = interaction.client.playerManager.skip(guildId);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ There is no song currently playing!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('⏭️ Skipped')
            .setDescription('Skipped the current song.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
