module.exports = async function queueCommand(message, queue) {
  const current = queue.currentTrack;
  const tracks = queue.tracks;

  if (!current && !tracks.length) {
    return message.reply('The queue is empty.');
  }

  const lines = [];
  if (current) {
    lines.push(`**Now Playing:** ${current.title}`);
  }
  if (tracks.length) {
    lines.push('**Up Next:**');
    tracks.slice(0, 10).forEach((t, i) => lines.push(`${i + 1}. ${t.title}`));
    if (tracks.length > 10) {
      lines.push(`...and ${tracks.length - 10} more`);
    }
  }

  message.reply(lines.join('\n'));
};
