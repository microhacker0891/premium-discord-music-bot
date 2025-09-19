const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    SlashCommandBuilder
} = require('discord.js');

console.log('🔍 DIAGNOSTIC BOT - Starting...');
console.log('Environment check:');
console.log('- DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.DISCORD_TOKEN) {
    console.log('❌ DISCORD_TOKEN not found!');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
});

client.once('ready', async () => {
    console.log('✅ Bot is ready!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds and ${client.users.cache.size} users`);
    
    // Test command registration
    try {
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const testCommand = new SlashCommandBuilder()
            .setName('test')
            .setDescription('Test command for diagnostics');

        console.log('🔄 Registering test command...');
        
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [testCommand.toJSON()] }
        );

        console.log('✅ Test command registered successfully!');
    } catch (error) {
        console.error('❌ Error registering test command:', error.message);
        console.error('Full error:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log(`📝 Received command: ${interaction.commandName}`);

    if (interaction.commandName === 'test') {
        const embed = new EmbedBuilder()
            .setTitle('🧪 Diagnostic Test')
            .setDescription('Bot is working correctly!')
            .setColor(0x00ff00)
            .addFields(
                { name: 'Bot Status', value: '✅ Online', inline: true },
                { name: 'Command', value: interaction.commandName, inline: true },
                { name: 'User', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

client.on('error', (error) => {
    console.error('❌ Client error:', error.message);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});

// Keep the process alive
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
