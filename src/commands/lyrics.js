import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import lyricsFinder from 'lyrics-finder';

export default {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the currently playing song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name to get lyrics for (optional)')
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        let songTitle = interaction.options.getString('query');
        
        // If no query provided, get current song
        if (!songTitle) {
            const guildId = interaction.guild.id;
            const queue = interaction.client.playerManager.getQueue(guildId);
            
            if (queue.length === 0) {
                return await interaction.editReply({
                    content: '❌ No song is currently playing and no song specified!',
                });
            }
            
            songTitle = queue[0].title;
        }

        try {
            const lyrics = await lyricsFinder(songTitle);
            
            if (!lyrics) {
                return await interaction.editReply({
                    content: `❌ No lyrics found for **${songTitle}**`,
                });
            }

            // Split lyrics if too long
            const maxLength = 4096;
            if (lyrics.length <= maxLength) {
                const embed = new EmbedBuilder()
                    .setColor('#e91e63')
                    .setTitle(`🎵 Lyrics for ${songTitle}`)
                    .setDescription(lyrics)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Split into multiple embeds
                const chunks = this.splitText(lyrics, maxLength - 100);
                
                for (let i = 0; i < chunks.length; i++) {
                    const embed = new EmbedBuilder()
                        .setColor('#e91e63')
                        .setTitle(`🎵 Lyrics for ${songTitle} (${i + 1}/${chunks.length})`)
                        .setDescription(chunks[i])
                        .setTimestamp();

                    if (i === 0) {
                        await interaction.editReply({ embeds: [embed] });
                    } else {
                        await interaction.followUp({ embeds: [embed] });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching lyrics!',
            });
        }
    },

    splitText(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        
        const lines = text.split('\n');
        
        for (const line of lines) {
            if (currentChunk.length + line.length + 1 <= maxLength) {
                currentChunk += (currentChunk ? '\n' : '') + line;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = line;
                } else {
                    // Line is too long, split it
                    chunks.push(line.substring(0, maxLength));
                    currentChunk = line.substring(maxLength);
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }
};
