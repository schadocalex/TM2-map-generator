require('lodash.product');
const _ = require('lodash');

const { data, DIR, TAG, TYPE, Pose } = require('./data');

const starts = _.filter(data.blocks, { type: TYPE.START });
const roads = _.filter(data.blocks, { type: TYPE.ROAD });
const finishes = _.filter(data.blocks, { type: TYPE.FINISH });

const rand = array => array[_.random(array.length - 1)];

const match_poses = (p1, p2) => {
  const rot_dir = 4 - p2.dir;
  const p3 = p1.add(p2.rot(rot_dir).neg_pos());
  p3.dir = (p3.dir + rot_dir) % 4;

  return p3;
};

const getCandidate = (last, blocks, collisions) => {
  const output = rand(
    _.filter(last.block.outputs, output => !last.input.group || !output.group || output.group === last.input.group)
  );
  const next_pose = last.pose.add(output.pose);

  const candidates = [];

  _.each(blocks, block => {
    _.each(block.inputs, input => {
      if (output.tag !== TAG.FREE && input.tag !== output.tag) {
        return;
      }
      const new_pose = match_poses(next_pose, input.pose);
      const candidate = {
        pose: new_pose,
        block,
        input
      };
      if (collisions_safe(collisions, candidate)) {
        candidates.push(candidate);
      }
    });
  });
  if (candidates.length === 0) {
    return null;
  }

  const candidate = rand(candidates);
  update_collisions(collisions, candidate);

  return candidate;
};

const correct_poses = path => {
  _.each(path, el => {
    switch (el.pose.dir) {
      case DIR.EAST:
        el.pose.x -= el.block.size.z - 1;
        break;
      case DIR.SOUTH:
        el.pose.x -= el.block.size.x - 1;
        el.pose.z -= el.block.size.z - 1;
        break;
      case DIR.WEST:
        el.pose.z -= el.block.size.x - 1;
        break;
    }
  });
};

const iterate_over_coords = step => {
  const size = step.block.size.rot(step.pose.dir);
  return _.product(_.range(0, size.x), _.range(0, size.y), _.range(0, size.z));
};

const update_collisions = (collisions, step, value = true) => {
  _.each(iterate_over_coords(step), ([x, y, z]) => {
    _.setWith(collisions, [step.pose.x + x, step.pose.y + y, step.pose.z + z], value, Object);
  });
};

const collisions_safe = (collisions, step) => {
  return !_.some(iterate_over_coords(step), ([px, py, pz]) => {
    const [x, y, z] = [step.pose.x + px, step.pose.y + py, step.pose.z + pz];
    if (x < 0 || y < 0 || z < 0 || x > 31 || y > 24 || z > 31) {
      return true;
    }
    if (_.get(collisions, [x, y, z], false)) {
      return true;
    }
  });
};

const gen_map = ({ blocks_between_checkpoints, start_pos_x, start_pos_y, start_pos_z }) => {
  const collisions = {};

  const path = [];
  const blocs_count = _.random(...blocks_between_checkpoints);

  // starts bloc
  path.push({
    pose: new Pose(_.random(...start_pos_x), _.random(...start_pos_y), _.random(...start_pos_z), _.random(0, 3)),
    block: rand(starts),
    input: {
      pose: new Pose(0, 0, 0)
    }
  });
  update_collisions(collisions, _.last(path));

  // loop with blocs_count
  let cpt = -1;
  while (path.length < blocs_count) {
    let j = -1;
    while (j++ < 1000) {
      const candidate = getCandidate(path[path.length - 1], roads, collisions);
      if (candidate) {
        path.push(candidate);
        break;
      } else if (path.length > 1) {
        update_collisions(collisions, path.pop(), false);
      }
    }
    if (cpt++ > 10000) {
      break;
    }
  }

  while (true) {
    const candidate = getCandidate(path[path.length - 1], finishes, collisions);
    if (candidate) {
      path.push(candidate);
      break;
    } else if (path.length > 2) {
      update_collisions(collisions, path.pop(), false);
    }
  }

  correct_poses(path);

  return path;
};

// const p1 = new Pose(0, 0, 2, DIR.WEST)
// const p2 = new Pose(0, 0, -2, DIR.NORTH)
// const p3 = match_poses(p1, p2)
// console.log(p1, p2, p3)

// const collisions = {};
// update_collisions(collisions, {
//   pose: new Pose(10, 0, 0, DIR.EAST),
//   block: {
//     size: new Pose(1, 1, 1)
//   }
// });
// console.log(collisions);
// console.log(
//   collisions_safe(collisions, {
//     pose: new Pose(-1, 0, 0, DIR.NORTH),
//     block: {
//       size: new Pose(1, 1, 1)
//     }
//   })
// );

// const map = gen_map({
//   blocks_between_checkpoints: [100, 100],
//   start_pos_x: [6, 10],
//   start_pos_y: [0, 10],
//   start_pos_z: [6, 10]
// });
// console.log(map, map.length);

module.exports = { gen_map, DIR };
