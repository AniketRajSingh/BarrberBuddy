// some globalz:
let THREECAMERA = null;
let hairOBJ3D = null;
let hairMesh = null;


// callback: launched if a face is detected or lost
function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED');
  } else {
    console.log('INFO in detect_callback(): LOST');
  }
}

// build the 3D. called once when Jeeliz Face Filter is OK:
function init_threeScene(spec) {
  const threeStuffs = JeelizThreeHelper.init(spec, detect_callback);
  hairOBJ3D = new THREE.Object3D();

  // CREATE THE MASK
  const maskLoader = new THREE.BufferGeometryLoader();
  maskLoader.load('./models/face/faceLowPolyEyesEarsFill2.json', function (maskBufferGeometry) {
    const vertexShaderSource = 'uniform mat2 videoTransformMat2;\n\n    varying vec2 vUVvideo;\n\n    varying float vY, vNormalDotZ;\n\n    const float THETAHEAD = 0.25;\n\n    \n\n    void main() {\n\n      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);\n\n      vec4 projectedPosition = projectionMatrix * mvPosition;\n\n      gl_Position = projectedPosition;\n\n      \n\n      // compute UV coordinates on the video texture:\n\n      vec4 mvPosition0 = modelViewMatrix * vec4( position, 1.0 );\n\n      vec4 projectedPosition0 = projectionMatrix * mvPosition0;\n\n      vUVvideo = vec2(0.5,0.5) + videoTransformMat2 * projectedPosition0.xy/projectedPosition0.w;\n\n      vY = position.y*cos(THETAHEAD)-position.z*sin(THETAHEAD);\n\n      vec3 normalView = vec3(modelViewMatrix * vec4(normal,0.));\n\n      vNormalDotZ = pow(abs(normalView.z), 1.5);\n\n    }';

     const fragmentShaderSource = "precision lowp float;\n\n    uniform sampler2D samplerVideo;\n\n    varying vec2 vUVvideo;\n\n    varying float vY, vNormalDotZ;\n\n    void main() {\n\n      vec3 videoColor = texture2D(samplerVideo, vUVvideo).rgb;\n\n      float darkenCoeff = smoothstep(-0.15, 0.05, vY);\n\n      float borderCoeff = smoothstep(0.0, 0.55, vNormalDotZ);\n\n      gl_FragColor = vec4(videoColor * (1.-darkenCoeff), borderCoeff );\n\n    }";

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      flatShading: false,
      uniforms: {
        samplerVideo:{ value: JeelizThreeHelper.get_threeVideoTexture() },
        videoTransformMat2: {value: spec.videoTransformMat2}
      },
      transparent: true
    });
    maskBufferGeometry.computeVertexNormals();
    const faceMesh = new THREE.Mesh(maskBufferGeometry, mat);
    faceMesh.renderOrder = -10000;
    faceMesh.frustumCulled = false;
    faceMesh.scale.multiplyScalar(1.1);
    faceMesh.position.set(0, 0.5, -0.45);
    threeStuffs.faceObject.add(faceMesh);
  })

  addDragEventListener(hairOBJ3D);
  threeStuffs.faceObject.add(hairOBJ3D);


  // CREATE THE VIDEO BACKGROUND
  function create_mat2d(threeTexture, isTransparent){
    return new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: isTransparent,
      vertexShader: "attribute vec2 position;\n\n        varying vec2 vUV;\n\n        void main(void){\n\n          gl_Position = vec4(position, 0., 1.);\n\n          vUV = 0.5+0.5*position;\n\n        }",
      fragmentShader: "precision lowp float;\n\n        uniform sampler2D samplerVideo;\n\n        varying vec2 vUV;\n\n        void main(void){\n\n          gl_FragColor = texture2D(samplerVideo, vUV);\n\n        }",
       uniforms:{
        samplerVideo: { value: threeTexture }
       }
    });
  }

  // MT216: create the frame. We reuse the geometry of the video
  const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry,  create_mat2d(new THREE.TextureLoader().load('./images/frame_rupy.png'), true));
  calqueMesh.renderOrder = 999; // render last
  calqueMesh.frustumCulled = false;
  threeStuffs.scene.add(calqueMesh);

  // CREATE THE CAMERA:
  THREECAMERA = JeelizThreeHelper.create_camera();

  // CREATE THE LIGHTS:
  const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
  threeStuffs.scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( 100, 1000, 100 );
  threeStuffs.scene.add(dirLight);
} // end init_threeScene()


// Entry point:
function main(){
  fetch('./models.json')
    .then(response => response.json())
    .then(data => {
      new HairstyleSwitcher(data.hairstyles);
    });

  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    callback: function(isError, bestVideoSettings){
      init_faceFilter(bestVideoSettings);
    }
  })
}


function init_faceFilter(videoSettings){
  JEELIZFACEFILTER.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCPath: './neuralNets/NN_DEFAULT.json', // root of NN_DEFAULT.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO: JEELIZFACEFILTER IS READY');
      init_threeScene(spec);
    },

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      JeelizThreeHelper.render(detectState, THREECAMERA);
    }
  }); // end JEELIZFACEFILTER.init call
}


window.addEventListener('load', main);

class HairstyleSwitcher {
  constructor(hairstyles) {
    this.hairstyles = hairstyles;
    this.currentHairstyleIndex = 0;
    this.initialize();
  }

  initialize() {
    this.createButtons();
    this.loadHairstyle(this.hairstyles[this.currentHairstyleIndex]);
  }

  createButtons() {
    const container = document.createElement('div');
    container.classList.add('hairstyle-switcher');

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('hairstyle-buttons');
    container.appendChild(buttonContainer);

    this.hairstyles.forEach((hairstyle, index) => {
      const button = document.createElement('button');
      button.textContent = hairstyle.name;
      button.addEventListener('click', () => this.switchHairstyle(index));
      buttonContainer.appendChild(button);
    });

    document.body.appendChild(container);
  }

  switchHairstyle(index) {
    this.currentHairstyleIndex = index;
    this.loadHairstyle(this.hairstyles[index]);
  }

  loadHairstyle(hairstyle) {
    // Remove the previous hairstyle
    if (hairMesh) {
      hairOBJ3D.remove(hairMesh);
    }

    // Load the new hairstyle
    const hairLoader = new THREE.BufferGeometryLoader();
    hairLoader.load(hairstyle.model, (geometry) => {
      const material = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(hairstyle.texture),
        reflectionRatio: 1,
        shininess: 50
      });

      hairMesh = new THREE.Mesh(geometry, material);
      hairMesh.scale.fromArray(hairstyle.scale);
      hairMesh.position.fromArray(hairstyle.position);
      hairMesh.rotation.fromArray(hairstyle.rotation);

      const bbox = new THREE.Box3().setFromObject(hairMesh);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      hairMesh.position.y -= center.y;
      hairMesh.position.y += 0.5;

      hairOBJ3D.add(hairMesh);
    });
  }
}