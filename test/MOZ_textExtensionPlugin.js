import * as THREE from './three.min.js';
import {TextMesh} from 'troika-3d-text/dist/textmesh-standalone.esm.js';

const SDF_TEXT_MAGIC_SIZE_FACTOR = 1.4;
const SDF_TEXT_MAGIC_LINESPACING_FACTOR = 1.3;
const SDF_TEXT_MAGIC_LETTERSPACING_FACTOR = 0.66;

const TEXTURE_TEXT_MAGIC_SIZE_FACTOR = 0.62;
const TEXTURE_TEXT_SAFE_MARGIN = 2; // to avoid texture clipping

const GEOMETRY_TEXT_MAGIC_SIZE_FACTOR = 1.88;
const GEOMETRY_TEXT_MAGIC_BB_YMIN = 0;
const GEOMETRY_TEXT_MAGIC_BB_YMAX = 2000;
const GEOMETRY_TEXT_MAGIC_BEVEL_THICKNESS = 0.1;

export class MOZ_textExtensionPlugin{
  constructor(parser) {
    this.parser = parser;
    this.name = 'MOZ_text';
  }

  loadNode(nodeIdx) {
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIdx];
    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return null;
    }
    const extDef = nodeDef.extensions[this.name];

    let node;
    switch(extDef.type) {
      case 'sdf': node = this.createSDFText(extDef, nodeDef); break;
      case 'texture': node = this.createTextureText(extDef, nodeDef); break;
  //    case 'geometry': node = await this.createGeometryText(extDef, nodeDef); break;
    }
    return Promise.resolve(node);
  }

  createSDFText(text, nodeDef) {
    var anchor = [
      text.alignX == 'right' ? 1 : (text.alignX == 'center' ? 0.5 : 0),
      text.alignY == 'bottom' ? 1 : (text.alignY == 'center' ? 0.5 : 0),
    ];
    if (text.alignY == 'top_baseline') {
      const numLines = text.value.split('\n').length;
      anchor[1] = 1 / numLines;
    }
    const node = new TextMesh();
    node.orientation = '+x-z';
    node.text = text.value;
    if (text.fontFile !== '<builtin>') {
      node.font = text.fontFile;
    }
    node.fontSize = text.size / SDF_TEXT_MAGIC_SIZE_FACTOR;
    node.textAlign = text.alignX;
    node.lineHeight = text.lineSpacing * SDF_TEXT_MAGIC_LINESPACING_FACTOR;
    node.letterSpacing = text.letterSpacing * SDF_TEXT_MAGIC_LETTERSPACING_FACTOR;
    node.anchor = anchor;
    node.maxWidth = text.maxWidth === 0 ? Infinity : text.maxWidth;
    node.whiteSpace = node.maxWidth === Infinity ? 'nowrap' : 'normal';
    node.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(text.color[0], text.color[1], text.color[2]),
      transparent: text.color[3] < 1,
      opacity: text.color[3]
    });
    node.sync();
    return node;
  }

  createTextureText(text, nodeDef) {
    const scalex = nodeDef.scale && nodeDef.scale[0] || 1;
    const scaley = nodeDef.scale && nodeDef.scale[1] || 1;
    const width = text.dimensions[0] / scalex;
    const height = text.dimensions[1] / scaley;
    const sizeRatio = height / width;
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const canvas = document.createElement('canvas');

    /* // show canvas for debug
    canvas.style.position = "absolute";
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.background = '#000';
    canvas.zIndex = 9999999;
    document.body.appendChild(canvas)
    */

    canvas.width = 1024;
    canvas.height = 1024 * sizeRatio;
    const c = canvas.getContext('2d');
    c.font = Math.floor(canvas.width / width * text.size * TEXTURE_TEXT_MAGIC_SIZE_FACTOR) + "px " + text.fontName;
    const metrics = c.measureText(text.value);
    c.textAlign = text.alignX;
    const descent = metrics.actualBoundingBoxDescent;
    const ascent = metrics.actualBoundingBoxAscent;
    c.fillStyle = '#FFF';
    var tx = TEXTURE_TEXT_SAFE_MARGIN;
    switch(text.alignX) {
      case 'center': tx = canvas.width / 2; break;
      case 'right':  tx = canvas.width - TEXTURE_TEXT_SAFE_MARGIN; break;
    }

    const lines = text.value.split('\n');
    for (var i = 0; i < lines.length; i++) {
      c.fillText(
        lines[i],
        tx,
        ascent + i * ascent * text.lineSpacing * 2 + TEXTURE_TEXT_SAFE_MARGIN);
    }

    var ty = 0;
    switch (text.alignY){
      case 'bottom_baseline': ty = height / 2 - height * descent / canvas.height; break;
      case 'bottom': ty = height / 2; break;
      case 'top': ty = -height / 2; break;
      case 'top_baseline': ty = -height / 2 + ascent / canvas.height * height; break;
    }

    geometry.translate(0, ty, 0)
    geometry.rotateX(-Math.PI / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(text.color[0], text.color[1], text.color[2]),
      map: texture,
      transparent: true,
      opacity: text.color[3]
    });
    const node = new THREE.Mesh(geometry, material);
    return node;
  }


  async createGeometryText(text, nodeDef) {
    return new Promise(resolve => {

      if (text.fontFile == '<builtin>') {
        console.warn("GLTFLoader: geometry text does not have a font defined (\"" + text.value + "\")");
        resolve(new THREE.Object3D());
      }

      new THREE.FontLoader().load(
        text.fontFile.substring(0, text.fontFile.lastIndexOf('.')) + '.json',

        font => {
          //magic boundingBox change to better match Blender's look
          font.data.boundingBox.yMin = GEOMETRY_TEXT_MAGIC_BB_YMIN;
          font.data.boundingBox.yMax = GEOMETRY_TEXT_MAGIC_BB_YMAX * text.lineSpacing;
          const geometry = new THREE.TextBufferGeometry(
            text.value,
            {
              font: font,
              size: text.size / GEOMETRY_TEXT_MAGIC_SIZE_FACTOR,
              height: text.extrude * 2,
              curveSegments: text.extrudeResolution,
              bevelEnabled: text.bevel > 0,
              bevelThickness: GEOMETRY_TEXT_MAGIC_BEVEL_THICKNESS,
              bevelSize: text.bevel,
              bevelOffset: text.bevelOffset,
              bevelSegments: text.bevelResolution
            }
          );

          geometry.computeBoundingBox();
          const size = geometry.boundingBox.getSize();

          var dx;
          switch(text.alignX) {
            case 'left':   dx = 0; break;
            case 'right':  dx = -size.x; break;
            default:       dx = -size.x / 2; break;
          }

          var dy;
          switch(text.alignY) {
            case 'top': case 'top_baseline': dy = -size.y / 2; break;
            case 'bottom': case 'bottom_baseline': dy = size.y; break;
            default: dy = 0; break;
          }

          geometry.translate(dx, dy, -text.extrude);
          geometry.rotateX(-Math.PI / 2);

          const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(text.color[0], text.color[1], text.color[2]),
            transparent: text.color[3] < 1,
            opacity: text.color[3],
          });

          resolve(new THREE.Mesh(geometry, material));
        });
      }
    );
  }
}
