module.exports = async function helpCommand(message, prefix) {
  const lines = [
    '**Music Bot Commands**',
    `\`${prefix}play <url/search>\` — Play a song or add to queue (YouTube & Spotify)`,
    `\`${prefix}skip\` — Skip the current track`,
    `\`${prefix}stop\` — Stop playback and leave the channel`,
    `\`${prefix}queue\` — Show the current queue`,
    `\`${prefix}pause\` — Pause playback`,
    `\`${prefix}resume\` — Resume playback`,
    `\`${prefix}nowplaying\` — Show the current track`,
    `\`${prefix}clear\` — Clear the queue`,
    `\`${prefix}help\` — Show this message`,
    '',
    '**Shortcuts:** `!p`, `!s`, `!q`, `!r`, `!np`',
  ];
  message.reply(lines.join('\n'));
};
