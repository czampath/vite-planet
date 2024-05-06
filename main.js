import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Constants & Vars

/** General constants */
const maxStarScatterDistance = 700
const exclusionZone = maxStarScatterDistance / 2

/** Animation constants */
var cameraMovement = -1;
const initialCamDist = 500;
const maxCamZoom = 20;
var zoomSpeed = 1.5
const zoomOffset = (zoomSpeed*2.9) //without the offset, camera zoom will freeze at zoomed-in position
const easeOutFactor = .5; // affects zoom 

//Setup Scene, Camera & Renderer
const scene = new THREE.Scene();
const camera =  new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(initialCamDist);
renderer.render(scene, camera);

//textures
const ringTexture = new THREE.TextureLoader().load('metal-texture.jpg')
const planetTexture = new THREE.TextureLoader().load('planet-texture.jpg')
const spaceTexture = new THREE.TextureLoader().load('space-dark-mq.jpg')

//Mesh Torus
const geometry  = new THREE.TorusGeometry(30, .5, 3, 500, Math.PI * 2);
const material = new THREE.MeshStandardMaterial({ map: ringTexture});
const torus = new THREE.Mesh(geometry,material)
torus.rotation.x = 1000
scene.add(torus);

//Mesh Sphere
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(7,100,100),
  new THREE.MeshStandardMaterial({
    map: planetTexture,
  })
)
scene.add(planet)

//Add sounds
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

//Lights
const pointLight = new THREE.PointLight(0xffee99,1200,700,1.1);
pointLight.position.set(100,40,100);
scene.add(pointLight)

const ambientLight = new THREE.AmbientLight(0xffffff,0.1);
scene.add(ambientLight)

//Helpers
const lightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(400,50);
// scene.add(lightHelper, gridHelper);

const controls = new OrbitControls(camera, renderer.domElement)

function calculateDistance(x, y, z) {
  return Math.sqrt(x*x + y*y + z*z);
}


function addStar(){
  const geometry = new THREE.SphereGeometry(THREE.MathUtils.randFloat(.3,.5), 1, 1);
  const material = new THREE.MeshStandardMaterial({color: 0xFFFFFF})
  const star = new THREE.Mesh(geometry, material);
  
  let [x,y,z] = Array(3).fill().map(() => THREE.MathUtils.randFloat(-1 * maxStarScatterDistance, maxStarScatterDistance));

  /** recalculate X,Y,Z untill a proper posistion is found */
  while(true){
    let distance = calculateDistance(x,y,z)
    let isBlockingEntrance = (x < maxStarScatterDistance  && y < maxStarScatterDistance  && z > exclusionZone * .7);
    /* recalculate position if position is, 
        1. in exclusion zone
        2. outside max space
        3. blocking the camera entrance  */
    if(distance < exclusionZone || distance > (maxStarScatterDistance * .75) || isBlockingEntrance){ 
      [x,y,z] = Array(3).fill().map(() => (THREE.MathUtils.randFloat(-1 * maxStarScatterDistance * 0.99999, maxStarScatterDistance * 0.99999) * 0.99999));
    }else 
    break;
  }

  star.position.set(x,y, z);
  scene.add(star)
}
Array(3000).fill().forEach(addStar)

//Sets Background
// scene.background = spaceTexture;

function animate(){
  requestAnimationFrame(animate);
  torus.rotation.x += 0.005;
  torus.rotation.y += 0.005;
  torus.rotation.z += .01;
  planet.rotation.y += 0.00035;

  if(cameraMovement==1){ // camera is zooming in
    camera.position.z += zoomSpeed * ((easeOutFactor * (camera.position.z - (maxCamZoom - zoomOffset)))  /99.9);
    if(zoomSpeed < 3) //maintain max zoom speed
      zoomSpeed += 0.001
  }else if(cameraMovement == -1){ // camera is zooming out
    camera.position.z -= zoomSpeed  * ((easeOutFactor * (camera.position.z - (maxCamZoom - zoomOffset))) /99.9 );
    if(zoomSpeed > 0.005) // maintain min zoom
      zoomSpeed -= 0.001
    else{
      cameraMovement=1  //min zoomSpeed reached, time to zoom out
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