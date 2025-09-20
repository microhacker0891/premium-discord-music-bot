import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const success = interaction.client.playerManager.stop(guildId);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ There is no music currently playing!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('⏹️ Stopped')
            .setDescription('The music has been stopped and the queue has been cleared.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
