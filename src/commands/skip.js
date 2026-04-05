module.exports = async function skipCommand(message, queue) {
  if (!queue.currentTrack) {
    return message.reply('Nothing is playing right now.');
  }
  const title = queue.currentTrack.title;
  queue.skip();
  message.reply(`Skipped **${title}**.`);
};
