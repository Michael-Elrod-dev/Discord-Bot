const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const play = require('play-dl');

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
      const url = this.currentTrack.url;
      console.log('[Debug] URL:', JSON.stringify(url), '| validate:', play.yt_validate(url));
      const info = await play.video_info(url);
      const stream = await play.stream_from_info(info);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });
      this.player.play(resource);
    } catch (error) {
      console.error('[Stream Error]', error.message, error.stack?.split('\n')[1]);
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
