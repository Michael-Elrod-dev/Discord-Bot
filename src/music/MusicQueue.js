const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COOKIE_FILE = path.join(__dirname, '..', '..', 'www.youtube.com_cookies.txt');

class MusicQueue {
  constructor() {
    this.tracks = [];
    this.currentTrack = null;
    this.connection = null;
    this.player = createAudioPlayer();

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.currentTrack = null;
      this._playNext();
    });

    this.player.on('error', (error) => {
      console.error('[Player Error]', error.message);
      this._playNext();
    });
  }

  async join(voiceChannel) {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    } catch {
      this.connection.destroy();
      this.connection = null;
      throw new Error('Failed to join voice channel.');
    }

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.stop();
      }
    });
  }

  async add(track) {
    this.tracks.push(track);
    if (!this.currentTrack) {
      await this._playNext();
    }
  }

  async _playNext() {
    if (this.tracks.length === 0) {
      this.currentTrack = null;
      return;
    }

    this.currentTrack = this.tracks.shift();

    try {
      const ytdlArgs = [
        '--format', 'bestaudio/best',
        '--output', '-',
        '--no-playlist',
        '--quiet',
        '--no-warnings',
      ];
      if (fs.existsSync(COOKIE_FILE)) {
        ytdlArgs.push('--cookies', COOKIE_FILE);
      }
      ytdlArgs.push(this.currentTrack.url);

      const ytdl = spawn(
        process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
        ytdlArgs,
        { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
      );

      ytdl.on('error', (err) => console.error('[yt-dlp spawn]', err.message));
      ytdl.stderr.on('data', (data) => console.error('[yt-dlp stderr]', data.toString().trim()));
      ytdl.on('close', (code) => { if (code !== 0) console.error('[yt-dlp exit]', code); });

      const resource = createAudioResource(ytdl.stdout, {
        inputType: StreamType.Arbitrary,
      });
      this.player.play(resource);
    } catch (error) {
      console.error('[Stream Error]', error.message, '| URL was:', this.currentTrack?.url);
      await this._playNext();
    }
  }

  skip() {
    if (this.player.state.status === AudioPlayerStatus.Idle) return false;
    this.player.stop(true);
    return true;
  }

  stop() {
    this.tracks = [];
    this.currentTrack = null;
    this.player.stop(true);
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }

  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      return true;
    }
    return false;
  }

  clear() {
    this.tracks = [];
  }

  isPlaying() {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }

  isPaused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }
}

module.exports = MusicQueue;
