const _ = require('lodash');
const autoit = require('autoit');

const { DIR } = require('./data');
const { gen_map } = require('./gen_map');

let lastBlocPose = { x: 0, y: 0, z: 0, dir: DIR.NORTH }; // Default bloc pose

const getBlocOrientationStr = blocDir => {
  return '{NUMPADDIV}' + '{RCTRL}'.repeat(blocDir);
};

const getBlocCoordStr = blocPose => {
  const x = () => {
    const diff = blocPose.x - lastBlocPose.x;
    return (diff >= 0 ? '{LEFT}' : '{RIGHT}').repeat(Math.abs(diff));
  };
  const y = () => {
    const diff = blocPose.y - lastBlocPose.y;
    return (diff >= 0 ? '{PGUP}' : '{PGDN}').repeat(Math.abs(diff));
  };
  const z = () => {
    const diff = blocPose.z - lastBlocPose.z;
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

  // Set editor mode bloc
  map.forEach(map => {
    // Reset bloc select
    autoit.Send('²²211');
    // Set bloc orientation
    autoit.Send(`${getBlocOrientationStr(map.pose.dir)}`);
    // Set bloc pose
    autoit.Send(`${getBlocCoordStr(map.pose)}`);
    // Select bloc
    autoit.Send('²²' + map.block.keys.join(''));

    autoit.Send('{SPACE}');

    // Store last bloc pose
    lastBlocPose = map.pose;
  });
};

module.exports = { startBot };
