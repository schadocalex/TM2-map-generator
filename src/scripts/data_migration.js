const fs = require('fs');
const { oldData } = require('../data');

oldData.blocs.forEach(bloc => {
  console.log(bloc);
  fs.writeFileSync(`../data/${bloc.keys.join('')}.json`, JSON.stringify(bloc), 'utf8');
});
