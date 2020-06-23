import * as THREE from './three.min.js';
import {OrbitControls} from './node_modules/three/examples/jsm/controls/OrbitControls.js'

import {GLTFLoader} from "./GLTFLoader.module.js";
import {MOZ_textExtensionPlugin} from "./MOZ_textExtensionPlugin.js";
import * as dat from 'dat.gui';

const CAMERA_DISTANCE = 30;
var gui, scene, camera, camera1, camera2, renderer, model, controls1, controls2, controls;

window.onload = () => { init() };

function init() {
  scene = new THREE.Scene();
  camera1 = new THREE.OrthographicCamera(
    window.innerWidth / - 100,
    window.innerWidth / 100,
    window.innerHeight / 100,
    window.innerHeight / - 100,
    1, 1000 );
  camera2 = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera1.position.set(0, 0, CAMERA_DISTANCE);
  camera2.position.set(0, 0, CAMERA_DISTANCE);
  camera = camera1;
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(new THREE.Color(0.3, 0.3, 0.3), 1.0);
  renderer.setAnimationLoop(renderLoop);

  const light = new THREE.PointLight();
  light.position.set(10, 40, 50);
  scene.add(light);

  controls1 = new OrbitControls(camera1, renderer.domElement);
  controls2 = new OrbitControls(camera2, renderer.domElement);
  controls = controls1

  var ControlsData = function() {
    this.ortho = true;
    this.scene = 'basic';
    this.SCENES = [
      'align',
      'letterspacing',
      'materials',
      'sizes',
      'basic',
      'lineheight',
      'overflow',
      'types',
      'lorem ipsun'
    ];
    this.ResetCamera = () => {
      camera1.position.set(0, 0, CAMERA_DISTANCE);
      camera2.position.set(0, 0, CAMERA_DISTANCE);
    }
  };

  var controlsData = new ControlsData();
  gui = new dat.GUI();
  gui.add(controlsData, 'scene', controlsData.SCENES).listen().onChange(val => {
    //location.hash = val;
    loadScene(val);
  });
  gui.add(controlsData, 'ortho').onChange(val => {
    camera = val ? camera1 : camera2;
    controls = val ? controls1 : controls2;
  });
  gui.add(controlsData, 'ResetCamera');

  const file = location.hash ? location.hash.substr(1) : 'basic';
  controlsData.scene = file;
  loadScene(file);
}

function loadScene(file) {
  if (model) {
    scene.remove(model);
  }
  new GLTFLoader()
    .register(parser => new MOZ_textExtensionPlugin(parser))
    .load(`models/${file}.gltf`, gltf => {
    model = gltf.scene;
    scene.add(model);
    for (var i = 0; i < model.children.length; i++){
      var t = model.children[i];

      const origin = new THREE.SphereGeometry(0.03);
      t.add(new THREE.Mesh(origin));
    }
  });
}

function renderLoop(t) {
  controls.update();
  renderer.render(scene, camera);
  //camera.lookAt(0, 0, 0);
}
