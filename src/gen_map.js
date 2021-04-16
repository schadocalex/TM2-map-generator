require('lodash.product');
const _ = require('lodash');

const { data, DIR, TAG, OFFICIALS_TAGS, TYPE, Pose } = require('./data');

const starts = _.filter(data.blocks, { type: TYPE.START });
const roads = _.filter(data.blocks, { type: TYPE.ROAD });
const checkpoints = _.filter(data.blocks, { type: TYPE.CHECKPOINT });
const finishes = _.filter(data.blocks, { type: TYPE.FINISH });

const rand = array => array[_.random(array.length - 1)];

const rand_with_weight = (array, prop) => {
  const sum_p = _.sumBy(array, prop);
  if (sum_p <= 0) {
    throw new RangeError('sum of ' + prop + ' in data must be positive');
  }

  const number = _.random(sum_p, true);
  let accumulator = 0.0;
  return _.find(array, el => {
    const p = el[prop];
    if (p > 0) {
      accumulator += p;
      return accumulator >= number;
    } else if (p < 0) {
      throw new RangeError(prop + ' in data must be positive');
    }
  });
};

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
        // If the tag doesn't match, not valid
        if (output.tag !== TAG.FREE && input.tag !== output.tag) {
          return;
        }

        const new_pose = match_poses(next_pose, input.pose);
        const candidate = {
          pose: new_pose,
          block,
          input,
          hash: output.id + '_' + input.id,
          p: _.get(output, 'p', 1) * _.get(block, 'p', 1) * _.get(input, 'p', 1)
        };

        // If it has already been used, not valid
        if (last.try_set.has(candidate.hash)) {
          return;
        }

        // If the official output collide, not valid
        // too complicated with fallback
        // for (const candidate_output in block.outputs) {
        //   if (!OFFICIALS_TAGS[candidate_output.tag]) {
        //     continue;
        //   }

        //   const candidate_output_absolute_pose = new_pose.add(candidate_output.pose);
        //   const block_id = collision_at_pose(collisions, candidate_output_absolute_pose);
        //   if (block_id !== last.block.id) {
        //     return;
        //   }
        // }

        // If the block collides, not valid
        if (!collisions_safe(collisions, candidate)) {
          return;
        }

        // It has passed all the validation. Add it to valid candidates list
        candidates.push(candidate);
      });
    });
  });

  if (candidates.length === 0) {
    return null;
  }

  return rand_with_weight(candidates, 'p');
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
  const size = step.block.size;
  return _.map(_.product(_.range(0, size.x), _.range(0, size.y), _.range(0, size.z)), ([x, y, z]) =>
    step.pose.add(new Pose(x, y, z))
  );
};

const update_collisions = (collisions, step, value = true) => {
  _.each(iterate_over_coords(step), pose => {
    _.setWith(collisions, [pose.x, pose.y, pose.z], value, Object);
  });
};

const collisions_safe = (collisions, step) => {
  return !_.some(iterate_over_coords(step), pose => {
    // 1 de marge sur x et z pour éviter les problèmes de collisions avec les sorties de blocks
    if (pose.x < 1 || pose.y < 0 || pose.z < 1 || pose.x > 30 || pose.y > 24 || pose.z > 30) {
      return true;
    }
    if (_.get(collisions, [pose.x, pose.y, pose.z], false)) {
      return true;
    }
  });
};

// const collision_at_pose = (collisions, pose) => {
//   return _.get(collisions, [pose.x, pose.y, pose.z], false);
// };

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

// _.each(_.range(20), () => console.log(rand_with_weight([{ p: 1 }, { p: 10 }, { p: 2 }], 'p')));

// const map = gen_map({
//   blocks_between_checkpoints: [2, 4],
//   nb_checkpoints: [3, 4],
//   start_pos_x: [6, 10],
//   start_pos_y: [0, 10],
//   start_pos_z: [6, 10]
// });
// console.log(map, map.length);

module.exports = { gen_map, DIR };
