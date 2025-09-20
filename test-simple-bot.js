const { Client, GatewayIntentBits } = require('discord.js');

console.log('🔧 Testing simple bot connection...');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing');

if (!process.env.DISCORD_TOKEN) {
    console.log('❌ DISCORD_TOKEN not found!');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
    console.log('✅ Bot is ready!');
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} guilds`);
    process.exit(0);
});

client.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
    process.exit(1);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});
