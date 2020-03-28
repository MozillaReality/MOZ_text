import * as THREE from 'three';

import {GLTFLoader} from "./GLTFLoader.module.js";

var scene, camera, renderer, model;

window.onload = () => { init() };

function init(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 10);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.setAnimationLoop(renderLoop);

  const light = new THREE.PointLight();
  light.position.set(1, 4, 5);
  scene.add(light);

  model = new GLTFLoader().load('basic.gltf', gltf => {
    scene.add(gltf.scene);
    const t = gltf.scene.getObjectByName('Text');
    //t.position.z = 0.2;
    const origin = new THREE.SphereGeometry(0.03);
    t.add(new THREE.Mesh(origin));
  });

}

function renderLoop(t){
  renderer.render(scene, camera);
  ///camera.position.set(Math.sin(t * 0.001) * 10, 4, Math.cos(t * 0.001) * 10)
  camera.lookAt(0, 0, 0);
}
