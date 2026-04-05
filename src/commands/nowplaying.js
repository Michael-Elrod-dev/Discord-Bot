module.exports = async function nowplayingCommand(message, queue) {
  if (!queue.currentTrack) {
    return message.reply('Nothing is playing right now.');
  }
  message.reply(`Now playing: **${queue.currentTrack.title}**`);
};
