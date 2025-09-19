#!/usr/bin/env node

console.log('🚀 SERVER STARTUP SCRIPT - Initializing...');

// Clean up any existing processes
console.log('🧹 Cleaning up existing processes...');
try {
    const { exec } = require('child_process');
    exec('pkill -f "node.*bot"', (error) => {
        if (error) {
            console.log('ℹ️ No existing bot processes to clean');
        } else {
            console.log('✅ Cleaned up existing processes');
        }
    });
} catch (error) {
    console.log('ℹ️ Process cleanup not available on this platform');
}

// Set production environment
process.env.NODE_ENV = 'production';

// Memory management
process.env.NODE_OPTIONS = '--max-old-space-size=512';

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.log('🔄 Restarting in 5 seconds...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    console.log('🔄 Restarting in 5 seconds...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

// Start the self-healing bot
console.log('🔧 Starting Self-Healing Bot...');
require('./self-healing-bot.js');
