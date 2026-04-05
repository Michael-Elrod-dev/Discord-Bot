module.exports = async function pauseCommand(message, queue) {
  if (queue.pause()) {
    message.reply('Paused.');
  } else {
    message.reply('Nothing is playing right now.');
  }
};
