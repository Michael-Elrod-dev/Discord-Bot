require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const play = require('play-dl');
const MusicQueue = require('./music/MusicQueue');
const commands = require('./commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const queue = new MusicQueue();
const PREFIX = process.env.PREFIX || '!';

client.once('clientReady', async () => {
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      await play.setToken({
        spotify: {
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          refresh_token: '',
          market: 'US',
        },
      });
      console.log('Spotify integration ready.');
    } catch (err) {
      console.warn('Spotify init failed — Spotify links will not work.', err.message);
    }
  }
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'play':
    case 'p':
      await commands.play(message, args, queue);
      break;
    case 'skip':
    case 's':
      await commands.skip(message, queue);
      break;
    case 'stop':
      await commands.stop(message, queue);
      break;
    case 'queue':
    case 'q':
      await commands.queue(message, queue);
      break;
    case 'pause':
      await commands.pause(message, queue);
      break;
    case 'resume':
    case 'r':
      await commands.resume(message, queue);
      break;
    case 'nowplaying':
    case 'np':
      await commands.nowplaying(message, queue);
      break;
    case 'clear':
      await commands.clear(message, queue);
      break;
    case 'help':
    case 'h':
      await commands.help(message, PREFIX);
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);
