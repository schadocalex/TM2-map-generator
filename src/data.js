const _ = require('lodash');
const { blocks_data } = require('./data/blocks_data');

const DIR = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

const TAG = {
  FREE: 'free',
  RED_RIGHT: 'red_right',
  RED_LEFT: 'red_left',
  JUMP: 'jump',
  CONCRETE: 'concrete'
};
const OFFICIALS_TAGS = {
  [TAG.RED_RIGHT]: { invert: TAG.RED_LEFT },
  [TAG.RED_LEFT]: { invert: TAG.RED_RIGHT }
};

const TYPE = {
  ROAD: 'road',
  START: 'start',
  FINISH: 'finish',
  CHECKPOINT: 'checkpoint'
};

class Pose {
  constructor(x, y, z, dir = DIR.NORTH) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.dir = dir;
  }

  copy() {
    return new Pose(this.x, this.y, this.z, this.dir);
  }

  add(pose) {
    const pose_rot = pose.rot(this.dir);

    return new Pose(this.x + pose_rot.x, this.y + pose_rot.y, this.z + pose_rot.z, pose_rot.dir);
  }

  neg_pos() {
    return new Pose(-this.x, -this.y, -this.z, this.dir);
  }

  rot(dir_rot) {
    const cosa = Math.cos((-dir_rot * Math.PI) / 2);
    const sina = Math.sin((-dir_rot * Math.PI) / 2);

    const z = Math.round(cosa * this.z - sina * this.x);
    const x = Math.round(sina * this.z + cosa * this.x);
    const y = this.y;
    const dir = (this.dir + dir_rot) % 4;

    return new Pose(x, y, z, dir);
  }
}

const data = {
  blocks: []
};

blocks_data.forEach(bloc_data => {
  const new_data = {};
  // size
  new_data.size = new Pose(bloc_data.size.x, bloc_data.size.y, bloc_data.size.z, bloc_data.size.dir);
  // inputs
  new_data.inputs = bloc_data.inputs.map(input => {
    return {
      pose: new Pose(input.pose.x, input.pose.y, input.pose.z, input.pose.dir),
      tag: input.tag,
      output: input.output || false
    };
  });
  // outputs
  new_data.outputs = bloc_data.outputs.map(output => {
    return {
      pose: new Pose(output.pose.x, output.pose.y, output.pose.z, output.pose.dir),
      tag: output.tag,
      collisions: output.collisions || []
    };
  });
  // tag and key
  new_data.tag = bloc_data.tag;
  new_data.keys = bloc_data.keys;
  new_data.type = bloc_data.type;
  // TODO: collisions
  data.blocks.push(new_data);
});

_.each(data.blocks, block => {
  // generate official outputs automatically
  const official_inputs = _.filter(block.inputs, { output: true });
  if (official_inputs.length === 2) {
    official_inputs[0].group = 1;
    official_inputs[1].group = 2;
    block.outputs.push({
      pose: official_inputs[0].pose.add(new Pose(0, 0, -1, DIR.SOUTH)),
      tag: OFFICIALS_TAGS[official_inputs[0].tag].invert,
      group: official_inputs[1].group
    });
    block.outputs.push({
      pose: official_inputs[1].pose.add(new Pose(0, 0, -1, DIR.SOUTH)),
      tag: OFFICIALS_TAGS[official_inputs[1].tag].invert,
      group: official_inputs[0].group
    });
  }

  // generate ids
  block.id = block.keys.join('.');
  _.each(block.inputs, (input, i) => (input.id = block.id + ':i' + i));
  _.each(block.outputs, (output, i) => (output.id = block.id + ':o' + i));
});

module.exports = { data, DIR, TAG, OFFICIALS_TAGS, TYPE, Pose };
