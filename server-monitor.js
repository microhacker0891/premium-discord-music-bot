const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('🏥 SERVER MONITOR - Starting health monitoring...');

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
        pid: process.pid
    };
    
    res.status(200).json(health);
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        message: 'Self-Healing Discord Bot Server',
        status: 'running',
        features: [
            'Auto-error fixing',
            'Command auto-registration',
            'Memory management',
            'Health monitoring',
            'Self-restart capability'
        ]
    });
});

// Error monitoring
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`🏥 Health monitor running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📈 Status: http://localhost:${port}/status`);
});

// Keep process alive
setInterval(() => {
    console.log('💓 Server monitor heartbeat');
}, 60000);
