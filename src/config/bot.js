export const botConfig = {
    // Bot settings
    prefix: process.env.PREFIX || '!',
    ownerId: process.env.OWNER_ID,
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE) || 100,
    defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50,
    
    // Music settings
    music: {
        maxDuration: 10 * 60 * 1000, // 10 minutes
        searchResults: 5,
        defaultSearchEngine: 'youtube'
    },
    
    // Embed colors
    colors: {
        success: '#00ff00',
        error: '#ff0000',
        warning: '#ffaa00',
        info: '#0099ff',
        music: '#9b59b6'
    },
    
    // Emojis
    emojis: {
        play: '▶️',
        pause: '⏸️',
        stop: '⏹️',
        skip: '⏭️',
        shuffle: '🔀',
        queue: '📋',
        music: '🎵',
        volume: '🔊',
        lyrics: '🎤'
    }
};
