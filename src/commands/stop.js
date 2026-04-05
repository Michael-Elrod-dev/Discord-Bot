module.exports = async function stopCommand(message, queue) {
  if (!queue.connection && !queue.currentTrack) {
    return message.reply('Not currently playing anything.');
  }
  queue.stop();
  message.reply('Stopped and left the voice channel.');
};
