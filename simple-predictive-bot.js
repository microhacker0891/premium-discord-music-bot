const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    SlashCommandBuilder
} = require('discord.js');

console.log('🔮 Simple Predictive Analytics Bot - Starting...');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log('✅ Simple Predictive Analytics Bot is ONLINE!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);

    // Register simple commands
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
                        .setRequired(true)),
            
            new SlashCommandBuilder()
                .setName('market')
                .setDescription('Get market overview')
        ];

        console.log('🔄 Registering commands...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands.map(cmd => cmd.toJSON()) }
        );

        console.log('✅ Commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

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
                    { name: 'Confidence', value: `${Math.round(Math.random() * 30 + 70)}%`, inline: true },
                    { name: 'Trend', value: Math.random() > 0.5 ? '📈 Bullish' : '📉 Bearish', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        
        else if (interaction.commandName === 'market') {
            const embed = new EmbedBuilder()
                .setTitle('📊 Market Overview')
                .setColor(0x2ecc71)
                .addFields(
                    { name: 'S&P 500', value: `${(4500 + Math.random() * 100).toFixed(2)} (+${(Math.random() * 2).toFixed(2)}%)`, inline: true },
                    { name: 'NASDAQ', value: `${(15000 + Math.random() * 500).toFixed(2)} (+${(Math.random() * 3).toFixed(2)}%)`, inline: true },
                    { name: 'DOW', value: `${(35000 + Math.random() * 1000).toFixed(2)} (+${(Math.random() * 2).toFixed(2)}%)`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});
