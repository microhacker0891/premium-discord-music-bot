import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import play from 'play-dl';
import ytdl from 'ytdl-core';
import logger from '../utils/logger.js';

const pipelineAsync = promisify(pipeline);

export class PlayerManager {
    constructor(client) {
        this.client = client;
        this.players = new Map();
        this.queues = new Map();
        this.setupPlayDl();
    }

    async setupPlayDl() {
        try {
            await play.setToken({
                spotify: {
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
                    refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
                    market: 'US'
                }
            });
            logger.info('Play-dl configured successfully');
        } catch (error) {
            logger.warn('Spotify configuration failed, continuing without Spotify support:', error.message);
        }
    }

    async joinChannel(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return { success: false, message: 'You need to be in a voice channel to use this command!' };
        }

        const guildId = interaction.guild.id;
        const existingPlayer = this.players.get(guildId);

        if (existingPlayer) {
            return { success: true, player: existingPlayer };
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const subscription = connection.subscribe(player);

            if (subscription) {
                this.players.set(guildId, { connection, player, subscription });
                this.queues.set(guildId, []);

                player.on(AudioPlayerStatus.Idle, () => {
                    this.playNext(guildId);
                });

                player.on('error', error => {
                    logger.error(`Audio player error in guild ${guildId}:`, error);
                });

                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    this.cleanup(guildId);
                });

                logger.info(`Joined voice channel in guild ${guildId}`);
                return { success: true, player: { connection, player, subscription } };
            }
        } catch (error) {
            logger.error(`Failed to join voice channel in guild ${guildId}:`, error);
            return { success: false, message: 'Failed to join the voice channel!' };
        }
    }

    async play(interaction, query) {
        const guildId = interaction.guild.id;
        const joinResult = await this.joinChannel(interaction);
        
        if (!joinResult.success) {
            return joinResult;
        }

        try {
            const songInfo = await this.getSongInfo(query);
            if (!songInfo) {
                return { success: false, message: 'Could not find any results for that query!' };
            }

            const queue = this.queues.get(guildId);
            queue.push(songInfo);

            const playerData = this.players.get(guildId);
            const { player } = playerData;

            if (player.state.status === AudioPlayerStatus.Idle) {
                await this.playSong(guildId, songInfo);
            }

            return { 
                success: true, 
                message: `Added to queue: **${songInfo.title}**`,
                song: songInfo
            };
        } catch (error) {
            logger.error(`Error playing song in guild ${guildId}:`, error);
            return { success: false, message: 'An error occurred while playing the song!' };
        }
    }

    async getSongInfo(query) {
        try {
            // Check if it's a YouTube URL
            if (ytdl.validateURL(query)) {
                const info = await ytdl.getInfo(query);
                return {
                    title: info.videoDetails.title,
                    url: query,
                    duration: parseInt(info.videoDetails.lengthSeconds) * 1000,
                    thumbnail: info.videoDetails.thumbnails[0]?.url,
                    requester: null
                };
            }

            // Search for the song
            const searchResults = await play.search(query, { limit: 1 });
            if (searchResults.length === 0) return null;

            const video = searchResults[0];
            return {
                title: video.title,
                url: video.url,
                duration: video.durationInSec * 1000,
                thumbnail: video.thumbnails[0]?.url,
                requester: null
            };
        } catch (error) {
            logger.error('Error getting song info:', error);
            return null;
        }
    }

    async playSong(guildId, song) {
        try {
            const playerData = this.players.get(guildId);
            if (!playerData) return;

            const { player } = playerData;
            const stream = await play.stream(song.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);
            logger.info(`Now playing: ${song.title} in guild ${guildId}`);
        } catch (error) {
            logger.error(`Error playing song in guild ${guildId}:`, error);
            this.playNext(guildId);
        }
    }

    playNext(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || queue.length === 0) return;

        const nextSong = queue.shift();
        this.playSong(guildId, nextSong);
    }

    pause(guildId) {
        const playerData = this.players.get(guildId);
        if (!playerData) return false;

        const { player } = playerData;
        if (player.state.status === AudioPlayerStatus.Playing) {
            player.pause();
            return true;
        }
        return false;
    }

    resume(guildId) {
        const playerData = this.players.get(guildId);
        if (!playerData) return false;

        const { player } = playerData;
        if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            return true;
        }
        return false;
    }

    stop(guildId) {
        const playerData = this.players.get(guildId);
        if (!playerData) return false;

        const { player } = playerData;
        player.stop();
        this.queues.set(guildId, []);
        return true;
    }

    skip(guildId) {
        const playerData = this.players.get(guildId);
        if (!playerData) return false;

        const { player } = playerData;
        player.stop();
        return true;
    }

    getQueue(guildId) {
        return this.queues.get(guildId) || [];
    }

    shuffleQueue(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || queue.length <= 1) return false;

        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        return true;
    }

    setVolume(guildId, volume) {
        const playerData = this.players.get(guildId);
        if (!playerData) return false;

        const { player } = playerData;
        const resource = player.state.resource;
        if (resource && resource.volume) {
            resource.volume.setVolume(volume / 100);
            return true;
        }
        return false;
    }

    cleanup(guildId) {
        this.players.delete(guildId);
        this.queues.delete(guildId);
        logger.info(`Cleaned up player for guild ${guildId}`);
    }

    handleVoiceStateUpdate(oldState, newState) {
        const guildId = newState.guild.id;
        const playerData = this.players.get(guildId);
        
        if (!playerData) return;

        // Check if bot was disconnected
        if (oldState.member.id === this.client.user.id && !newState.channelId) {
            this.cleanup(guildId);
        }

        // Check if everyone left the voice channel
        const voiceChannel = oldState.channel;
        if (voiceChannel && voiceChannel.members.size === 1 && voiceChannel.members.has(this.client.user.id)) {
            this.cleanup(guildId);
        }
    }
}
