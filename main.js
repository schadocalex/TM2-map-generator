const { startBot } = require('./src/bot');

startBot({
  blocks_between_checkpoints: [6, 12],
  nb_checkpoints: [2, 4],
  start_pos_x: [6, 10],
  start_pos_y: [0, 10],
  start_pos_z: [6, 10]
});
