const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

console.log('🚀 ULTRA SIMPLE BOT - No complex features...');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log('✅ BOT IS READY!');
    console.log(`Logged in as ${client.user.tag}`);
    
    // Force register commands with explicit guild registration
    try {
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const commands = [
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Ping the bot')
        ];

        // Register for each guild individually (faster)
        for (const guild of client.guilds.cache.values()) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: commands.map(cmd => cmd.toJSON()) }
                );
                console.log(`✅ Commands registered for ${guild.name}`);
            } catch (error) {
                console.error(`❌ Failed for ${guild.name}:`, error.message);
            }
        }
        
        console.log('✅ All commands registered!');
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'ping') {
        await interaction.reply('🏓 Pong! Bot is working!');
    }
});

client.login(process.env.DISCORD_TOKEN);
