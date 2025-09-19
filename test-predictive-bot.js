// Test script for Predictive Analytics Bot
require('dotenv').config();

console.log('🔮 Testing Predictive Analytics Bot...');
console.log('Environment check:');
console.log('- DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.DISCORD_TOKEN) {
    console.log('❌ DISCORD_TOKEN not found!');
    console.log('Please set your Discord bot token:');
    console.log('set DISCORD_TOKEN=your_bot_token_here');
    process.exit(1);
}

console.log('✅ Environment variables look good!');
console.log('🚀 Starting bot...');

// Import and start the bot
const PredictiveAnalyticsBot = require('./predictive-analytics-bot');
const bot = new PredictiveAnalyticsBot();

bot.start().catch(error => {
    console.error('❌ Error starting bot:', error.message);
    process.exit(1);
});
