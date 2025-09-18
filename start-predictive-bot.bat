@echo off
title Predictive Analytics Bot
color 0A

echo.
echo  ██████╗ ██████╗ ███████╗██████╗ ██╗ ██████╗████████╗██╗██╗   ██╗███████╗
echo ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║██╔════╝╚══██╔══╝██║██║   ██║██╔════╝
echo ██████╔╝██████╔╝█████╗  ██║  ██║██║██║        ██║   ██║██║   ██║███████╗
echo ██╔═══╝ ██╔══██╗██╔══╝  ██║  ██║██║██║        ██║   ██║╚██╗ ██╔╝╚════██║
echo ██║     ██║  ██║███████╗██████╔╝██║╚██████╗   ██║   ██║ ╚████╔╝ ███████║
echo ╚═╝     ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═══╝  ╚══════╝
echo.
echo                    🔮 AI-POWERED PREDICTIVE ANALYTICS BOT 🔮
echo.

echo 🚀 Starting Predictive Analytics Bot...
echo.

REM Set environment variables
set DISCORD_TOKEN=your_discord_bot_token_here

echo ✅ Environment variables set
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install --package-lock-only
    npm install
    echo.
)

echo 🤖 Starting bot...
echo.

REM Start the bot
node predictive-analytics-bot.js

echo.
echo ❌ Bot stopped. Press any key to exit...
pause > nul
