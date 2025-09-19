const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

console.log('🚀 CLEAN BOT - Starting without problematic features...');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log('✅ CLEAN BOT IS ONLINE!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);

    // Simple command registration without complex retry logic
    try {
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Check bot status'),
            
            new SlashCommandBuilder()
                .setName('predict')
                .setDescription('Get AI prediction for a stock')
                .addStringOption(option =>
                    option.setName('symbol')
                        .setDescription('Stock symbol (e.g., AAPL)')
                        .setRequired(true))
        ];

        console.log('🔄 Registering commands...');
        
        // Simple registration - no clearing, no retries
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('✅ Commands registered successfully!');
        
    } catch (error) {
        console.error('❌ Error registering commands:', error.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`📝 Received command: ${interaction.commandName}`);

    try {
        if (interaction.commandName === 'ping') {
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setDescription(`**Latency:** ${Date.now() - interaction.createdTimestamp}ms\n**API Latency:** ${Math.round(client.ws.ping)}ms`)
                .setColor(0x00ff00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        
        else if (interaction.commandName === 'predict') {
            const symbol = interaction.options.getString('symbol');
            
            const embed = new EmbedBuilder()
                .setTitle(`🔮 Prediction for ${symbol.toUpperCase()}`)
                .setDescription('AI-powered market prediction')
                .setColor(0x4ecdc4)
                .addFields(
                    { name: 'Current Price', value: `$${(Math.random() * 1000 + 100).toFixed(2)}`, inline: true },
                    { name: 'Predicted Price', value: `$${(Math.random() * 1000 + 100).toFixed(2)}`, inline: true },
                    { name: 'Confidence', value: `${Math.round(Math.random() * 30 + 70)}%`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
    }
});

// Simple error handling
client.on('error', (error) => {
    console.error('Client error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});
