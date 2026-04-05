const play = require('play-dl');

module.exports = async function playCommand(message, args, queue) {
  if (!args.length) {
    return message.reply('Usage: `!play <YouTube/Spotify URL or search query>`');
  }

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    return message.reply('You need to be in a voice channel first.');
  }

  const query = args.join(' ');
  const statusMsg = await message.reply('Searching...');

  try {
    const tracks = await resolveQuery(query);

    if (!tracks.length) {
      return statusMsg.edit('No results found.');
    }

    if (!queue.connection) {
      await queue.join(voiceChannel);
    }

    for (const track of tracks) {
      await queue.add(track);
    }

    if (tracks.length === 1) {
      statusMsg.edit(`Queued: **${tracks[0].title}**`);
    } else {
      statusMsg.edit(`Added **${tracks.length}** tracks to the queue.`);
    }
  } catch (error) {
    console.error('[play]', error);
    statusMsg.edit('Something went wrong. Check the console for details.');
  }
};

async function resolveQuery(query) {
  // Spotify URL
  const spType = await play.sp_validate(query);
  if (spType) {
    return resolveSpotify(query, spType);
  }

  // YouTube playlist
  const ytType = play.yt_validate(query);
  if (ytType === 'playlist') {
    try {
      const playlist = await play.playlist_info(query, { incomplete: true });
      const videos = await playlist.all_videos();
      return videos.slice(0, 50).map((v) => ({ title: v.title, url: v.url }));
    } catch {
      // play-dl playlist scraper breaks on some YouTube playlists — try playing just the video from the URL
      const videoId = query.match(/[?&]v=([^&]+)/)?.[1];
      if (videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await play.video_info(videoUrl);
        return [{ title: info.video_details.title, url: videoUrl }];
      }
      throw new Error('Could not load this YouTube playlist.');
    }
  }

  // YouTube video
  if (ytType === 'video') {
    const info = await play.video_info(query);
    const cleanUrl = `https://www.youtube.com/watch?v=${info.video_details.id}`;
    return [{ title: info.video_details.title, url: cleanUrl }];
  }

  // Plain search query
  const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
  if (!results.length) return [];
  return [{ title: results[0].title, url: results[0].url }];
}

async function resolveSpotify(url, type) {
  const tracks = [];
  const data = await play.spotify(url);

  if (type === 'track') {
    const yt = await play.search(`${data.name} ${data.artists[0].name}`, {
      limit: 1,
      source: { youtube: 'video' },
    });
    if (yt.length) tracks.push({ title: data.name, url: yt[0].url });

  } else if (type === 'playlist' || type === 'album') {
    const items = data.tracks.slice(0, 50);
    for (const item of items) {
      try {
        const yt = await play.search(`${item.name} ${item.artists[0].name}`, {
          limit: 1,
          source: { youtube: 'video' },
        });
        if (yt.length) tracks.push({ title: item.name, url: yt[0].url });
      } catch {
        // skip tracks that fail to resolve
      }
    }
  }

  return tracks;
}
