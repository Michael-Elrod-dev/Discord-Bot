module.exports = async function clearCommand(message, queue) {
  if (!queue.tracks.length) {
    return message.reply('The queue is already empty.');
  }
  const count = queue.tracks.length;
  queue.clear();
  message.reply(`Cleared **${count}** track(s) from the queue.`);
};
