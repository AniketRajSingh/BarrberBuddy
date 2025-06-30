import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// simulate self for GLTFLoader
globalThis.self = globalThis;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filepath = path.join(__dirname, 'hairstyle.glb');
const buffer = await fs.readFile(filepath); // <== read as binary

const loader = new GLTFLoader();
const manager = new THREE.LoadingManager();

loader.parse(
  buffer.buffer, // must be ArrayBuffer
  '',            // no external path needed for .glb
  (gltf) => {
    const mesh = gltf.scene.children.find(obj => obj.isMesh);
    if (!mesh) return console.error('❌ No mesh found in GLB');

    const geometryJson = mesh.geometry.toJSON();
    const outPath = path.join(__dirname, 'hairstyle.json');
    fs.writeFile(outPath, JSON.stringify(geometryJson, null, 2)).then(() =>
      console.log(`✅ Exported to ${outPath}`)
    );
  },
  (err) => {
    console.error('❌ GLB parse error:', err);
  }
);
