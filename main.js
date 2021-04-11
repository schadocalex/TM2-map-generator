const { startBot } = require('./src/bot');
const argv = require('minimist')(process.argv.slice(2));

startBot({
  blocks_between_checkpoints: [argv.min ? argv.min : 6, argv.max ? argv.max : 12],
  nb_checkpoints: [2, 4],
  start_pos_x: [6, 10],
  start_pos_y: [0, 10],
  start_pos_z: [6, 10]
});
