import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const scene = new THREE.Scene();

const camera =  new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight, 0.1, 3000);
var cameraMovement = -1;
const initialCamDist = 500;
const maxCamSlowDown = 98;
const maxCamZoom = 20;
var zoomSpeed = 1.5


const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(initialCamDist);

renderer.render(scene, camera);

const ringTexture = new THREE.TextureLoader().load('metal-texture.jpg')

const planetTexture = new THREE.TextureLoader().load('planet-texture.jpg')
// const planetNormalMap = new THREE.TextureLoader().load('planet-normal-uhd.jpg')

const geometry  = new THREE.TorusGeometry(30, .5, 3, 500, Math.PI * 2);
const material = new THREE.MeshStandardMaterial({ map: ringTexture});
const torus = new THREE.Mesh(geometry,material)
torus.rotation.x = 1000


const planet = new THREE.Mesh(
  new THREE.SphereGeometry(7,100,100),
  new THREE.MeshStandardMaterial({
    map: planetTexture,
    // normalMap: planetNormalMap
  })
)
scene.add(planet)

const listener = new THREE.AudioListener();

camera.add(listener);

const sound = new THREE.Audio(listener);

sound.autoplay = true;

const audioLoader = new THREE.AudioLoader();
audioLoader.load('alien.ogg', function(buffer){
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(1);
  sound.play();
  // audioLoader.autoplay(false)
})

scene.add(torus);

const pointLight = new THREE.PointLight(0xffee99,1200,700,1.1);
pointLight.position.set(100,40,100);
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xffffff,0.1);
scene.add(ambientLight)

const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(400,50);

// scene.add(lightHelper, gridHelper);

const controls = new OrbitControls(camera, renderer.domElement)

function calculateDistance(x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
}

const maxStarScatterDistance = 700
function addStar(){
  const geometry = new THREE.SphereGeometry(THREE.MathUtils.randFloat(.3,.5), 1, 1);
  const material = new THREE.MeshStandardMaterial({color: 0xFFFFFF})
  const star = new THREE.Mesh(geometry, material);
  
  let [x,y,z] = Array(3).fill().map(() => THREE.MathUtils.randFloat(-1 * maxStarScatterDistance, maxStarScatterDistance));

  const exclusionZone = maxStarScatterDistance / 2

  while(true){
    let distance = calculateDistance(x,y,z)
    if(distance < exclusionZone || distance > (maxStarScatterDistance * .75) || (x < maxStarScatterDistance  && y < maxStarScatterDistance  && z > exclusionZone * .7)){
      [x,y,z] = Array(3).fill().map(() => (THREE.MathUtils.randFloat(-1 * maxStarScatterDistance * 0.99999, maxStarScatterDistance * 0.99999) * 0.99999));
    }else 
    break;
  }

  star.position.set(x,y, z);
  scene.add(star)
}
Array(3000).fill().forEach(addStar)

const spaceTexture = new THREE.TextureLoader().load('space-dark-mq.jpg')
// scene.background = spaceTexture;



function animate(){
  requestAnimationFrame(animate);
  torus.rotation.x += 0.005;
  torus.rotation.y += 0.005;
  torus.rotation.z += .01;
  planet.rotation.y += 0.00035;


  if(cameraMovement==1){
    camera.position.z += zoomSpeed * (((100.0 / 200.0) * (camera.position.z - (maxCamZoom   - (zoomSpeed*2.9))))  /100.0);
    if(zoomSpeed < 3)
      zoomSpeed += 0.001
  }else if(cameraMovement == -1){
    camera.position.z -= zoomSpeed  * (((100.0 / 200.0) * (camera.position.z - (maxCamZoom  - (zoomSpeed*2.9)))) /100.0 );
    if(zoomSpeed > 0.005)
      zoomSpeed -= 0.001
    else{
      cameraMovement=1
    }
  }
  if(calculateDistance(camera.position.x, camera.position.y, camera.position.z)  >=initialCamDist){
    cameraMovement = -1
    
  }else if(calculateDistance(camera.position.x, camera.position.y, camera.position.z) <= maxCamZoom){
    cameraMovement = 1
    
  }
  controls.update();
  renderer.render(scene, camera);
}


animate()