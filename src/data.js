// Convention : reset rotation. bloc de départ comme référence
// Z vers le nord
// X vers l'ouest
// Y vers le haut/

const _ = require('lodash');

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
  JUMP: 'jump'
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

const block_111 = keys => {
  return {
    keys,
    type: TYPE.ROAD,
    size: new Pose(1, 1, 1),
    inputs: [
      {
        pose: new Pose(0, 0, 0, DIR.EAST),
        tag: TAG.RED_LEFT,
        group: '1'
      },
      {
        pose: new Pose(0, 0, 0, DIR.WEST),
        tag: TAG.RED_RIGHT,
        group: '2'
      },
      {
        pose: new Pose(0, 0, 0, DIR.NORTH),
        tag: TAG.JUMP
      }
    ],
    outputs: [
      {
        pose: new Pose(-1, 0, 0, DIR.EAST),
        tag: TAG.RED_LEFT,
        group: '1'
      },
      {
        pose: new Pose(1, 0, 0, DIR.WEST),
        tag: TAG.RED_RIGHT,
        group: '2'
      }
    ]
  };
};

const macro_output_3_pos = output => {
  output.pose.add(new Pose(2, 0, 1));
};

const Pos_LEFT = new Pose(1, 0, 0, DIR.WEST);
const p1 = new Pose(-1, 0, 0, DIR.EAST);
const p2 = p1.add(new Pose(1, 0, 0, DIR.WEST));
// console.log(p1, p2);

const macro_output_all_rot = output => {
  return _.map(DIR, dir => {
    const res = { ...output };
    res.pose = res.pose.copy();
    res.pose.dir = dir;
    return res;
  });
};

const data = {
  blocks: [
    block_111([1, 1, 1]),
    block_111([1, 1, 2]),
    block_111([1, 1, 3]),
    block_111([1, 1, 4]),
    {
      keys: [1, 1, 5],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '2'
        },
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.JUMP
        }
      ],
      outputs: [
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(1, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '2'
        },
        {
          pose: new Pose(0, 0, -1, DIR.SOUTH),
          tag: TAG.JUMP,
          collisions: [new Pose(0, 1, 0), new Pose(0, 2, 0)]
        }
        // ...macro_output_all_rot({
        //   pose: new Pose(-1, -1, 0, DIR.EAST),
        //   tag: TAG.JUMP,
        //   group: '1',
        //   freq: 1
        // }),
        // ...macro_output_all_rot({
        //   pose: new Pose(1, -1, 0, DIR.WEST),
        //   tag: TAG.JUMP,
        //   group: '2',
        //   freq: 1
        // })
      ]
    },
    {
      keys: [1, 1, 6],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(1, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '1'
        },
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ]
    },
    {
      keys: [1, 1, 7],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.EAST),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(1, 0, 0, DIR.WEST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '2'
        }
      ]
    },
    {
      keys: [1, 3, 3],
      type: TYPE.START,
      size: new Pose(1, 1, 1),
      inputs: [],
      outputs: [
        {
          pose: new Pose(0, 0, 1, DIR.NORTH),
          tag: TAG.RED_RIGHT
        }
      ]
    },
    {
      keys: [1, 3, 4],
      type: TYPE.START,
      size: new Pose(1, 1, 1),
      inputs: [],
      outputs: [
        {
          pose: new Pose(0, 0, 1, DIR.NORTH),
          tag: TAG.RED_LEFT
        }
      ]
    },
    {
      keys: [1, 3, 5],
      type: TYPE.FINISH,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.RED_RIGHT
        },
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.JUMP
        }
      ],
      outputs: []
    },
    {
      keys: [1, 3, 6],
      type: TYPE.FINISH,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.RED_LEFT
        },
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.JUMP
        }
      ],
      outputs: []
    },
    {
      keys: [1, 2, 1],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.x),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, -1, DIR.SOUTH),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ]
    },
    {
      keys: [1, 2, 2],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, -1, DIR.SOUTH),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ]
    },
    {
      keys: [1, 2, 3],
      type: TYPE.ROAD,
      size: new Pose(1, 1, 1),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, 0, DIR.SOUTH),
          tag: TAG.RED_LEFT,
          group: '2'
        },
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.JUMP
        },
        {
          pose: new Pose(0, 0, 0, DIR.EAST),
          tag: TAG.JUMP
        }
      ],
      outputs: [
        {
          pose: new Pose(-1, 0, 0, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '2'
        },
        {
          pose: new Pose(0, 0, 1, DIR.NORTH),
          tag: TAG.RED_RIGHT,
          group: '1'
        }
      ]
    },
    // {
    //   keys: [1, 2, 4], // QA //
    //   type: TYPE.ROAD,
    //   size: new Pose(2, 1, 2),
    //   inputs: [
    //     {
    //       pose: new Pose(0, 0, 0, DIR.NORTH),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 0, 1, DIR.EAST),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ],
    //   outputs: [
    //     {
    //       pose: new Pose(2, 0, 1, DIR.WEST),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(0, 0, -1, DIR.SOUTH),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ]
    // },
    // {
    //   keys: [1, 2, 5], // QA //
    //   type: TYPE.ROAD,
    //   size: new Pose(2, 1, 2),
    //   inputs: [
    //     {
    //       pose: new Pose(0, 0, 0, DIR.WEST),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 0, 1, DIR.SOUTH),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ],
    //   outputs: [
    //     {
    //       pose: new Pose(-1, 0, 0, DIR.EAST),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 0, 2, DIR.NORTH),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ]
    // },
    {
      keys: [1, 2, 6],
      type: TYPE.ROAD,
      size: new Pose(2, 2, 2),
      inputs: [
        {
          pose: new Pose(0, 0, 0, DIR.NORTH),
          tag: TAG.RED_RIGHT,
          group: '1'
        },
        {
          pose: new Pose(1, 1, 1, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(2, 1, 1, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '1'
        },
        {
          pose: new Pose(0, 0, -1, DIR.SOUTH),
          tag: TAG.RED_LEFT,
          group: '2'
        }
      ]
    },
    {
      keys: [1, 2, 7],
      type: TYPE.ROAD,
      size: new Pose(2, 2, 2),
      inputs: [
        {
          pose: new Pose(1, 0, 0, DIR.NORTH),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(0, 1, 1, DIR.WEST),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ],
      outputs: [
        {
          pose: new Pose(-1, 1, 1, DIR.EAST),
          tag: TAG.RED_LEFT,
          group: '1'
        },
        {
          pose: new Pose(1, 0, -1, DIR.SOUTH),
          tag: TAG.RED_RIGHT,
          group: '2'
        }
      ]
    }
    // {
    //   keys: [1, 2, 8], // WIP //
    //   type: TYPE.ROAD,
    //   size: new Pose(2, 2, 2),
    //   inputs: [
    //     {
    //       pose: new Pose(0, 0, 0, DIR.WEST),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 1, 1, DIR.SOUTH),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ],
    //   outputs: [
    //     {
    //       pose: new Pose(-1, 0, 0, DIR.EAST),
    //       tag: TAG.RED_RIGHT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 1, 2, DIR.NORTH),
    //       tag: TAG.RED_LEFT,
    //       group: '2'
    //     }
    //   ]
    // },
    // {
    //   keys: [1, 2, 9], // WIP //
    //   type: TYPE.ROAD,
    //   size: new Pose(2, 2, 2),
    //   inputs: [
    //     {
    //       pose: new Pose(1, 1, 0, DIR.NORTH),
    //       tag: TAG.RED_LEFT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(0, 0, 1, DIR.WEST),
    //       tag: TAG.RED_RIGHT,
    //       group: '2'
    //     }
    //   ],
    //   outputs: [
    //     {
    //       pose: new Pose(-1, 0, 1, DIR.EAST),
    //       tag: TAG.RED_LEFT,
    //       group: '1'
    //     },
    //     {
    //       pose: new Pose(1, 1, -1, DIR.SOUTH),
    //       tag: TAG.RED_RIGHT,
    //       group: '2'
    //     }
    //   ]
    // }
  ]
};

_.each(data.blocks, block => {
  block.id = block.keys.join(',');
});

module.exports = { data, DIR, TAG, TYPE, Pose };
