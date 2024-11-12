// components/DiceRoller.vue
<template>
  <div class="content">
    <canvas ref="canvas"></canvas>
    <div class="ui-controls">
      <div class="score">Score: <span ref="scoreResult"></span></div>
      <button ref="rollBtn" class="roll-btn">Throw the dice</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

const canvas = ref(null)
const scoreResult = ref(null)
const rollBtn = ref(null)

let renderer, scene, camera, diceMesh, physicsWorld
const diceArray = []
let isInitialized = false

const params = {
  numberOfDice: 2,
  segments: 40,
  edgeRadius: 0.07,
  notchRadius: 0.12,
  notchDepth: 0.1,
}

// Initialize physics world
const initPhysics = () => {
  physicsWorld = new CANNON.World({
    allowSleep: true,
    gravity: new CANNON.Vec3(0, -50, 0),
  })
  physicsWorld.defaultContactMaterial.restitution = 0.3
}

// Create floor
const createFloor = () => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.ShadowMaterial({
      opacity: 0.15  // Match the floor opacity from initScene
    })
  )
  floor.receiveShadow = true
  floor.position.y = -7
  floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5)
  scene.add(floor)

  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  })
  floorBody.position.copy(floor.position)
  floorBody.quaternion.copy(floor.quaternion)
  physicsWorld.addBody(floorBody)
}

// Create inner geometry
const createInnerGeometry = async () => {
  const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js')
  
  const baseGeometry = new THREE.PlaneGeometry(
    1 - 2 * params.edgeRadius,
    1 - 2 * params.edgeRadius
  )
  const offset = 0.48
  
  const geometries = [
    baseGeometry.clone().translate(0, 0, offset),
    baseGeometry.clone().translate(0, 0, -offset),
    baseGeometry.clone().rotateX(0.5 * Math.PI).translate(0, -offset, 0),
    baseGeometry.clone().rotateX(0.5 * Math.PI).translate(0, offset, 0),
    baseGeometry.clone().rotateY(0.5 * Math.PI).translate(-offset, 0, 0),
    baseGeometry.clone().rotateY(0.5 * Math.PI).translate(offset, 0, 0),
  ]
  
  return mergeGeometries(geometries, false)
}

// Create box geometry
const createBoxGeometry = async () => {
  const { mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js')
  
  let boxGeometry = new THREE.BoxGeometry(1, 1, 1, params.segments, params.segments, params.segments)
  const positionAttr = boxGeometry.attributes.position
  const subCubeHalfSize = 0.5 - params.edgeRadius

  for (let i = 0; i < positionAttr.count; i++) {
    let position = new THREE.Vector3().fromBufferAttribute(positionAttr, i)
    const subCube = new THREE.Vector3(
      Math.sign(position.x),
      Math.sign(position.y),
      Math.sign(position.z)
    ).multiplyScalar(subCubeHalfSize)
    const addition = new THREE.Vector3().subVectors(position, subCube)

    if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.normalize().multiplyScalar(params.edgeRadius)
      position = subCube.add(addition)
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize
    ) {
      addition.z = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.x = subCube.x + addition.x
      position.y = subCube.y + addition.y
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.y = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.x = subCube.x + addition.x
      position.z = subCube.z + addition.z
    } else if (
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.x = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.y = subCube.y + addition.y
      position.z = subCube.z + addition.z
    }

    const notchWave = (v) => {
      v = (1 / params.notchRadius) * v
      v = Math.PI * Math.max(-1, Math.min(1, v))
      return params.notchDepth * (Math.cos(v) + 1)
    }
    const notch = (pos) => notchWave(pos[0]) * notchWave(pos[1])

    const offset = 0.23

    if (position.y === 0.5) {
      position.y -= notch([position.x, position.z])
    } else if (position.x === 0.5) {
      position.x -= notch([position.y + offset, position.z + offset])
      position.x -= notch([position.y - offset, position.z - offset])
    } else if (position.z === 0.5) {
      position.z -= notch([position.x - offset, position.y + offset])
      position.z -= notch([position.x, position.y])
      position.z -= notch([position.x + offset, position.y - offset])
    } else if (position.z === -0.5) {
      position.z += notch([position.x + offset, position.y + offset])
      position.z += notch([position.x + offset, position.y - offset])
      position.z += notch([position.x - offset, position.y + offset])
      position.z += notch([position.x - offset, position.y - offset])
    } else if (position.x === -0.5) {
      position.x += notch([position.y + offset, position.z + offset])
      position.x += notch([position.y + offset, position.z - offset])
      position.x += notch([position.y, position.z])
      position.x += notch([position.y - offset, position.z + offset])
      position.x += notch([position.y - offset, position.z - offset])
    } else if (position.y === -0.5) {
      position.y += notch([position.x + offset, position.z + offset])
      position.y += notch([position.x + offset, position.z])
      position.y += notch([position.x + offset, position.z - offset])
      position.y += notch([position.x - offset, position.z + offset])
      position.y += notch([position.x - offset, position.z])
      position.y += notch([position.x - offset, position.z - offset])
    }

    positionAttr.setXYZ(i, position.x, position.y, position.z)
  }

  boxGeometry.deleteAttribute('normal')
  boxGeometry.deleteAttribute('uv')
  boxGeometry = mergeVertices(boxGeometry)
  boxGeometry.computeVertexNormals()

  return boxGeometry
}

// Create dice mesh
const createDiceMesh = async () => {
  // Red rubber-like material for outer dice
  const boxMaterialOuter = new THREE.MeshStandardMaterial({
    color: 0xff0000,  // Red color
    roughness: 0.8,   // More rough for rubber look
    metalness: 0.1,   // Less metallic
  })
  
  // White material for the numbers
  const boxMaterialInner = new THREE.MeshStandardMaterial({
    color: 0xffffff,  // White color
    roughness: 0.3,   // Slightly glossy
    metalness: 0.1,   // Low metallic
    side: THREE.DoubleSide
  })

  const diceMesh = new THREE.Group()
  const innerMesh = new THREE.Mesh(await createInnerGeometry(), boxMaterialInner)
  const outerMesh = new THREE.Mesh(await createBoxGeometry(), boxMaterialOuter)
  outerMesh.castShadow = true
  diceMesh.add(innerMesh, outerMesh)

  return diceMesh
}

// Create dice
const createDice = () => {
  const mesh = diceMesh.clone()
  scene.add(mesh)

  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    sleepTimeLimit: 0.1
  })
  physicsWorld.addBody(body)

  return { mesh, body }
}

// Add dice events
const addDiceEvents = (dice) => {
  dice.body.addEventListener('sleep', (e) => {
    dice.body.allowSleep = false

    const euler = new CANNON.Vec3()
    e.target.quaternion.toEuler(euler)

    const eps = 0.1
    const isZero = (angle) => Math.abs(angle) < eps
    const isHalfPi = (angle) => Math.abs(angle - 0.5 * Math.PI) < eps
    const isMinusHalfPi = (angle) => Math.abs(0.5 * Math.PI + angle) < eps
    const isPiOrMinusPi = (angle) =>
      Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps

    if (isZero(euler.z)) {
      if (isZero(euler.x)) {
        showRollResults(1)
      } else if (isHalfPi(euler.x)) {
        showRollResults(4)
      } else if (isMinusHalfPi(euler.x)) {
        showRollResults(3)
      } else if (isPiOrMinusPi(euler.x)) {
        showRollResults(6)
      } else {
        dice.body.allowSleep = true
      }
    } else if (isHalfPi(euler.z)) {
      showRollResults(2)
    } else if (isMinusHalfPi(euler.z)) {
      showRollResults(5)
    } else {
      dice.body.allowSleep = true
    }
  })
}

// Show roll results
const showRollResults = (score) => {
  if (scoreResult.value.innerHTML === '') {
    scoreResult.value.innerHTML = score
  } else {
    scoreResult.value.innerHTML += '+' + score
  }
}

// Render loop
const render = () => {
  if (!isInitialized) return
  
  physicsWorld.fixedStep()

  for (const dice of diceArray) {
    dice.mesh.position.copy(dice.body.position)
    dice.mesh.quaternion.copy(dice.body.quaternion)
  }

  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

// Update scene size
const updateSceneSize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

// Throw dice
const throwDice = () => {
  if (!isInitialized) return
  
  scoreResult.value.innerHTML = ''

  diceArray.forEach((d, dIdx) => {
    d.body.velocity.setZero()
    d.body.angularVelocity.setZero()

    d.body.position = new CANNON.Vec3(6, dIdx * 1.5, 0)
    d.mesh.position.copy(d.body.position)

    d.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random())
    d.body.quaternion.copy(d.mesh.quaternion)

    const force = 3 + 5 * Math.random()
    d.body.applyImpulse(
      new CANNON.Vec3(-force, force, 0),
      new CANNON.Vec3(0, 0, 0.2)
    )

    d.body.allowSleep = true
  })
}

// Initialize scene
// Initialize scene
const initScene = async () => {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas.value
  })
  renderer.shadowMap.enabled = true
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)  // Light gray background

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  )
  camera.position.set(0, 0.5, 4).multiplyScalar(7)

  updateSceneSize()

  // Brighter ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  // Main direct light from top
  const topLight = new THREE.DirectionalLight(0xffffff, 1)
  topLight.position.set(10, 15, 0)
  topLight.castShadow = true
  topLight.shadow.mapSize.width = 2048
  topLight.shadow.mapSize.height = 2048
  topLight.shadow.camera.near = 5
  topLight.shadow.camera.far = 400
  topLight.shadow.camera.left = -10
  topLight.shadow.camera.right = 10
  topLight.shadow.camera.top = 10
  topLight.shadow.camera.bottom = -10
  scene.add(topLight)

  // Add fill light from front
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
  fillLight.position.set(0, 5, 15)
  scene.add(fillLight)

  // Add rim light from back
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
  rimLight.position.set(0, 5, -15)
  scene.add(rimLight)

  // Add a soft light from the left
  const leftLight = new THREE.DirectionalLight(0xffffff, 0.4)
  leftLight.position.set(-15, 5, 0)
  scene.add(leftLight)

  // Add a soft light from the right
  const rightLight = new THREE.DirectionalLight(0xffffff, 0.4)
  rightLight.position.set(15, 5, 0)
  scene.add(rightLight)

  // Create floor with better shadow material
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.ShadowMaterial({
      opacity: 0.15
    })
  )
  floor.receiveShadow = true
  floor.position.y = -7
  floor.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5)
  scene.add(floor)

  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  })
  floorBody.position.copy(floor.position)
  floorBody.quaternion.copy(floor.quaternion)
  physicsWorld.addBody(floorBody)

  diceMesh = await createDiceMesh()
  
  for (let i = 0; i < params.numberOfDice; i++) {
    diceArray.push(createDice())
    addDiceEvents(diceArray[i])
  }

  throwDice()
  isInitialized = true
  render()
}

// Lifecycle hooks
onMounted(async () => {
  if (process.client) {
    try {
      initPhysics()
      await initScene()
      
      window.addEventListener('resize', updateSceneSize)
      window.addEventListener('dblclick', throwDice)
      rollBtn.value?.addEventListener('click', throwDice)
    } catch (error) {
      console.error('Error initializing dice roller:', error)
    }
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    isInitialized = false
    window.removeEventListener('resize', updateSceneSize)
    window.removeEventListener('dblclick', throwDice)
    rollBtn.value?.removeEventListener('click', throwDice)
  }
})
</script>

<style scoped>
.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.ui-controls {
  position: relative;
  width: 100%;
  max-width: 500px;
  font-family: inherit;
  user-select: none;
  line-height: 1.5;
  padding: 10px;
  pointer-events: none;
}

.score {
  font-weight: bold;
}

.ui-controls :deep(#score-result) {
  display: inline-block;
  min-width: 1.8em;
  color: #d45f2e;
}

.ui-controls :deep(#score-result):after {
  content: "\200b";
}

.roll-btn {
  background-color: #273e9a;
  font-weight: bold;
  color: #ffffff;
  border: none;
  padding: 1em 1.5em;
  border-radius: 1.5em;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  margin: 2em 0 0 0;
  transition: background-color 0.2s, transform 0.1s;
  pointer-events: auto;
}

.roll-btn:active {
  transform: translateY(2px);
}

.roll-btn:hover {
  background-color: #3737af;
}
</style>