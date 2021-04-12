const fs = require('fs');
const { blocks_data } = require('../data/blocks_data');

blocks_data.forEach(block => {
  console.log(block);
  // Block frequency
  const newBlock = Object.assign({ frequency: 1 }, block);
  // inputs frequency
  newBlock.inputs.forEach((input, key) => {
    newBlock.inputs[key] = Object.assign({ frequency: 1 }, input);
  });
  // outputs frequency
  newBlock.outputs.forEach((output, key) => {
    newBlock.outputs[key] = Object.assign({ frequency: 1 }, output);
  });
  console.log(newBlock);
  // fs.writeFileSync(`../data/${bloc.keys.join('')}.json`, JSON.stringify(newBlock), 'utf8');
});
