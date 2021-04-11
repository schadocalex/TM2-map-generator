const fs = require('fs');
const { blocks_data } = require('../data/blocks_data');

blocks_data.forEach(block => {
  console.log(block);
  const newBlock = Object.assign({ frequency: 1 }, block);
  console.log(newBlock);
  // fs.writeFileSync(`../data/${bloc.keys.join('')}.json`, JSON.stringify(newBlock), 'utf8');
});
