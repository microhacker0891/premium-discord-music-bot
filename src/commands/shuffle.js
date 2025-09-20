import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const success = interaction.client.playerManager.shuffleQueue(guildId);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ The queue is empty or has only one song!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle('🔀 Shuffled')
            .setDescription('The queue has been shuffled!')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
