// ========================================
// AI MUSIC BOT CONFIGURATION
// ========================================

module.exports = {
    // Discord Bot Token - Set via environment variable
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN_HERE',
    
    // OpenAI API Key - Set via environment variable
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
    
    // Hugging Face API Key - Set via environment variable
    HF_API_KEY: process.env.HF_API_KEY || 'YOUR_HUGGING_FACE_API_KEY_HERE',
    
    // Google Drive Credentials - Set via environment variable
    GOOGLE_DRIVE_CREDENTIALS: process.env.GOOGLE_DRIVE_CREDENTIALS ? 
        JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS) : 
        {
            "type": "service_account",
            "project_id": "your-project-id",
            "private_key_id": "your-private-key-id",
            "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
            "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
            "client_id": "your-client-id.apps.googleusercontent.com",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
        },
    
    // Bot Configuration
    NODE_ENV: 'production',
    PORT: 3000,
    
    // AI Configuration
    AI: {
        maxConversationHistory: 10,
        responseTemperature: 0.7,
        maxTokens: 200
    },
    
    // Music Configuration
    MUSIC: {
        maxQueueSize: 50,
        defaultVolume: 50,
        cacheTimeout: 300
    }
};