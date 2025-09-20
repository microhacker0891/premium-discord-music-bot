import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the bot volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const volume = interaction.options.getInteger('level');
        const success = interaction.client.playerManager.setVolume(guildId, volume);
        
        if (!success) {
            return await interaction.reply({
                content: '❌ There is no music currently playing!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🔊 Volume Changed')
            .setDescription(`Volume set to **${volume}%**`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
