import * as THREE from 'three';
import OrbitControls from 'three-orbitcontrols';
import { TYPE, DIR, TAG, Pose, data } from '../../src/data';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
// const gridHelper = new THREE.GridHelper(2, 2);
// scene.add(gridHelper);

const dirToRad = dir => {
  return dir * (-Math.PI / 2);
};

const colorSelector = block_tag => {
  switch (block_tag) {
    case 'free':
      return 0x1bb500;
    case 'red_right':
      return 0xbd0000;
    case 'red_left':
      return 0xff5959;
    case 'jump':
      return 0x0040ff;
    case 'concrete':
      return 0x59606e;

    default:
      return 0xffffff;
  }
};

const segmentsSelector = block_tag => {
  switch (block_tag) {
    case 'free':
      return 6;
    case 'red_right':
      return 12;
    case 'red_left':
      return 12;
    case 'jump':
      return 25;
    case 'concrete':
      return 12;

    default:
      return 12;
  }
};

let i = 0;

data.blocks.forEach(block => {
  // Inputs
  block.inputs.forEach(input => {
    const geometry = new THREE.ConeGeometry(0.5, 1, segmentsSelector(input.tag));
    const material = new THREE.MeshBasicMaterial({ color: colorSelector(input.tag), wireframe: true });
    const cone = new THREE.Mesh(geometry, material);
    geometry.rotateX(-Math.PI / 2);
    geometry.rotateY(dirToRad(input.pose.dir));
    geometry.translate(-input.pose.x + i, input.pose.y, -input.pose.z);
    scene.add(cone);
  });

  // Outputs
  block.outputs.forEach(output => {
    const geometry = new THREE.ConeGeometry(0.5, 1, segmentsSelector(output.tag));
    const material = new THREE.MeshBasicMaterial({ color: colorSelector(output.tag), wireframe: true });
    const cone = new THREE.Mesh(geometry, material);
    geometry.rotateX(-Math.PI / 2);
    geometry.rotateY(dirToRad(output.pose.dir));
    geometry.translate(-output.pose.x + i, output.pose.y, -output.pose.z);
    scene.add(cone);
  });

  i = i + 5;
});

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);

  controls.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
animate();

window.addEventListener('resize', onWindowResize, false);
