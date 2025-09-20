import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to display')
                .setMinValue(1)
        ),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const queue = interaction.client.playerManager.getQueue(guildId);
        const page = interaction.options.getInteger('page') || 1;
        const itemsPerPage = 10;
        
        if (queue.length === 0) {
            return await interaction.reply({
                content: '📭 The queue is empty!',
                ephemeral: true
            });
        }

        const totalPages = Math.ceil(queue.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const queuePage = queue.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Music Queue')
            .setDescription(queuePage.map((song, index) => 
                `**${startIndex + index + 1}.** ${song.title} \`${this.formatDuration(song.duration)}\``
            ).join('\n'))
            .setFooter({ text: `Page ${page} of ${totalPages} • ${queue.length} songs in queue` })
            .setTimestamp();

        if (queuePage[0]?.thumbnail) {
            embed.setThumbnail(queuePage[0].thumbnail);
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
