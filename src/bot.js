const _ = require('lodash');
const autoit = require('autoit');

const { DIR } = require('./data');
const { gen_map } = require('./gen_map');

let lastBlockPose = { x: 0, y: 0, z: 0, dir: DIR.NORTH }; // Default block pose

const getBlockOrientationStr = blockDir => {
  return '{NUMPADDIV}' + '{RCTRL}'.repeat(blockDir);
};

const getBlockCoordStr = blockPose => {
  const x = () => {
    const diff = blockPose.x - lastBlockPose.x;
    return (diff >= 0 ? '{LEFT}' : '{RIGHT}').repeat(Math.abs(diff));
  };
  const y = () => {
    const diff = blockPose.y - lastBlockPose.y;
    return (diff >= 0 ? '{PGUP}' : '{PGDN}').repeat(Math.abs(diff));
  };
  const z = () => {
    const diff = blockPose.z - lastBlockPose.z;
    return (diff >= 0 ? '{UP}' : '{DOWN}').repeat(Math.abs(diff));
  };

  return x() + y() + z();
};

const startBot = opt => {
  const map = gen_map(opt); // Gen map cache
  console.log(map, map.length);

  // Set autoit option for mania planet editor compliance
  autoit.AutoItSetOption('SendKeyDelay', 15);
  autoit.AutoItSetOption('SendKeyDownDelay', 15);

  // Await ManiaPlanet focus
  const winName = _.find(['ManiaPlanet', 'Maniaplanet'], name => autoit.WinExists(name));
  if (!winName) {
    console.error('Impossible de trouver maniaplanet');
    return;
  }
  autoit.WinWaitActive(winName);
  const winPos = autoit.WinGetPos(winName);

  // Trick editor because grid magnetism
  autoit.MouseMove(winPos.right - 100, winPos.top + 100, 0);

  // Setup grid origin
  autoit.Send('{F1}{F2}{F2}²²211{NUMPADDIV}');
  autoit.Send('{DOWN}{RIGHT}'.repeat(32));

  // Set editor mode block
  map.forEach(map => {
    // Reset block select
    autoit.Send('²²211');
    // Set block orientation
    autoit.Send(`${getBlockOrientationStr(map.pose.dir)}`);
    // Set block pose
    autoit.Send(`${getBlockCoordStr(map.pose)}`);
    // Select block
    autoit.Send('²²' + map.block.keys.join(''));

    autoit.Send('{SPACE}');

    // Store last block pose
    lastBlockPose = map.pose;
  });
};

module.exports = { startBot };
