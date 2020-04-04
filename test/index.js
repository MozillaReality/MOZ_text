import * as THREE from 'three';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js'

import {GLTFLoader} from "./GLTFLoader.module.js";

var scene, camera, renderer, model, controls;

window.onload = () => { init() };

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 15);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.setAnimationLoop(renderLoop);

  const light = new THREE.PointLight();
  light.position.set(1, 4, 5);
  scene.add(light);

  model = new GLTFLoader().load('materials.gltf', gltf => {
    scene.add(gltf.scene);
    for (var i = 0; i < gltf.scene.children.length; i++){
      var t = gltf.scene.children[i];

      const origin = new THREE.SphereGeometry(0.03);
      t.add(new THREE.Mesh(origin));
    }

  });

  controls = new OrbitControls(camera, renderer.domElement);
}

function renderLoop(t){
  controls.update();
  renderer.render(scene, camera);
  camera.lookAt(0, 0, 0);
}
