require('lodash.product');
const _ = require('lodash');

const { data, DIR, TAG, OFFICIALS_TAGS, TYPE, Pose } = require('./data');

const starts = _.filter(data.blocks, { type: TYPE.START });
const roads = _.filter(data.blocks, { type: TYPE.ROAD });
const checkpoints = _.filter(data.blocks, { type: TYPE.CHECKPOINT });
const finishes = _.filter(data.blocks, { type: TYPE.FINISH });

const rand = array => array[_.random(array.length - 1)];

const match_poses = (p1, p2) => {
  const rot_dir = 4 - p2.dir;
  const p3 = p1.add(p2.rot(rot_dir).neg_pos());
  p3.dir = (p3.dir + rot_dir) % 4;

  return p3;
};

const getCandidate = (last, blocks, collisions) => {
  const candidates = [];

  const outputs = _.filter(
    last.block.outputs,
    output => !last.input.group || !output.group || output.group === last.input.group
  );
  _.each(outputs, output => {
    const next_pose = last.pose.add(output.pose);
    _.each(blocks, block => {
      _.each(block.inputs, input => {
        if (output.tag !== TAG.FREE && input.tag !== output.tag) {
          return;
        }
        const new_pose = match_poses(next_pose, input.pose);
        const candidate = {
          pose: new_pose,
          block,
          input,
          hash: output.id + '_' + input.id
        };
        if (!last.try_set.has(candidate.hash) && collisions_safe(collisions, candidate)) {
          candidates.push(candidate);
        }
      });
    });
  });

  if (candidates.length === 0) {
    return null;
  }

  return rand(candidates);
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

const iterate_over_coords = (step, add_official_outputs) => {
  const size = step.block.size;
  const result = _.map(
    _.product(_.range(0, size.x), _.range(0, size.y), _.range(0, size.z)),
    ([x, y, z]) => new Pose(x, y, z)
  );

  // if (add_official_outputs) {
  //   _.each(step.block.outputs, output => {
  //     if (OFFICIALS_TAGS[output.tag]) {
  //       result.push(output.pose);
  //     }
  //   });
  // }

  return _.map(result, pose => step.pose.add(pose));
};

const update_collisions = (collisions, step, value = true) => {
  _.each(iterate_over_coords(step, false), pose => {
    _.setWith(collisions, [pose.x, pose.y, pose.z], value, Object);
  });
};

const collisions_safe = (collisions, step) => {
  return !_.some(iterate_over_coords(step, true), pose => {
    if (pose.x < 0 || pose.y < 0 || pose.z < 0 || pose.x > 31 || pose.y > 24 || pose.z > 31) {
      return true;
    }
    if (_.get(collisions, [pose.x, pose.y, pose.z], false)) {
      return true;
    }
  });
};

const gen_map = params => {
  // generate block types order in path
  const path_block_choice = [starts];
  const nb_checkpoints = _.random(...params.nb_checkpoints);
  _.each(_.range(nb_checkpoints + 1), i => {
    _.each(_.range(_.random(...params.blocks_between_checkpoints)), () => path_block_choice.push(roads));
    if (i < nb_checkpoints) {
      path_block_choice.push(checkpoints);
    }
  });
  path_block_choice.push(finishes);
  console.log(path_block_choice.length + ' blocs dans la map');

  const collisions = {};

  const path = [];

  // start bloc
  path.push({
    pose: new Pose(
      _.random(...params.start_pos_x),
      _.random(...params.start_pos_y),
      _.random(...params.start_pos_z),
      _.random(0, 3)
    ),
    block: rand(path_block_choice[0]),
    input: {
      pose: new Pose(0, 0, 0)
    },
    hash: 'start',
    try_set: new Set()
  });
  update_collisions(collisions, _.last(path));

  const pop_path = (collisions, path) => {
    if (path.length > 1) {
      update_collisions(collisions, path.pop(), false);
      return true;
    } else {
      console.error('Impossible de générer une map de cette longueur. Réessayez ou diminuez le nombre de blocs.');
      return false;
    }
  };

  // loop with blocs_count
  const TRY_MAX_PER_STEP = 10;
  let cpt = 0;
  while (path.length < path_block_choice.length) {
    if (path.length > cpt) {
      cpt = path.length;
      console.log(cpt);
    }

    const last = _.last(path);
    if (last.try_set.size >= TRY_MAX_PER_STEP) {
      if (pop_path(collisions, path)) {
        continue;
      } else {
        break;
      }
    }

    const candidate = getCandidate(last, path_block_choice[path.length], collisions);
    if (candidate) {
      candidate.nb_try = 0;
      candidate.try_set = new Set();
      last.try_set.add(candidate.hash);
      path.push(candidate);
      update_collisions(collisions, candidate, true);
    } else {
      if (pop_path(collisions, path)) {
        continue;
      } else {
        break;
      }
    }
  }

  // Correct poses in path to match editor pose (not the same rotation)
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
//   blocks_between_checkpoints: [2, 4],
//   nb_checkpoints: [3, 4],
//   start_pos_x: [6, 10],
//   start_pos_y: [0, 10],
//   start_pos_z: [6, 10]
// });
// console.log(map, map.length);

module.exports = { gen_map, DIR };
