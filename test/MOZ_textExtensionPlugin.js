import * as THREE from './three.min.js';

export class MOZ_textExtensionPlugin{
  constructor(parser) {
    this.parser = parser;
    this.name = 'MOZ_text';
  }

  loadMesh(meshIdx) {
    const parser = this.parser;
    const json = parser.json;
    console.log('text', meshIdx);
    const nodeDef = json.nodes[meshIdx];
    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      console.log(nodeDef);
      return null;
    }
    const extDef = nodeDef.extensions[this.name];
    console.log(extDef);
    // create mesh
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(extDef.size * 0.6, 32, 32),
      new THREE.MeshLambertMaterial({color: extDef.color}));
    return Promise.resolve(mesh);
  }
}
