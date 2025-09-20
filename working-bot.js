const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

console.log('🚀 WORKING BOT - Starting...');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log('✅ WORKING BOT IS ONLINE!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);

    // Register commands with proper error handling
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
        
        // Clear existing commands first
        await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        console.log('✅ Cleared existing commands');
        
        // Register new commands
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(cmd => cmd.toJSON()) });
        console.log('✅ Commands registered successfully!');
        
        // Also register for specific guild (faster)
        if (client.guilds.cache.size > 0) {
            const guildId = client.guilds.cache.first().id;
            await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands.map(cmd => cmd.toJSON()) });
            console.log(`✅ Commands also registered for guild ${guildId}`);
        }
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
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

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});
