module.exports = async function resumeCommand(message, queue) {
  if (queue.resume()) {
    message.reply('Resumed.');
  } else {
    message.reply('Nothing is paused right now.');
  }
};
