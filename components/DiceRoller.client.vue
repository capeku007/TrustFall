<!-- components/DiceRoller.client.vue -->
<template>
    <div class="relative w-full h-64">
      <canvas ref="canvas" class="w-full h-full rounded-lg bg-gray-900/50"></canvas>
      <div v-if="showResults" class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div class="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p class="text-white text-lg font-bold">
            {{ diceResults[0] }} + {{ diceResults[1] }} = {{ diceResults[0] + diceResults[1] }}
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>

import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  isRolling: Boolean,
  diceResults: Array
})

const canvas = ref(null)
const showResults = ref(false)

let scene, camera, renderer
let dice = []
let animationFrame
let rollStartTime = 0
const ROLL_DURATION = 2000 // 2 seconds

// Create dice materials with numbers
const createDiceMaterials = () => {
  const materials = []
  
  for (let i = 1; i <= 6; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, 128, 128)

    context.fillStyle = '#000000'
    context.font = '64px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(i.toString(), 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    materials.push(new THREE.MeshStandardMaterial({ map: texture }))
  }

  return materials
}

const init = () => {
  if (!canvas.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1e293b)

  camera = new THREE.PerspectiveCamera(
    45,
    canvas.value.clientWidth / canvas.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true
  })
  renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight)
  renderer.shadowMap.enabled = true

  // Enhanced lighting
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(0, 5, 10)
  light.castShadow = true
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  // Create dice
  dice = []
  for (let i = 0; i < 2; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const materials = createDiceMaterials()
    const mesh = new THREE.Mesh(geometry, materials)
    mesh.castShadow = true
    // Start position - behind and higher
    mesh.position.set(i === 0 ? -2 : 2, 3, -5)
    // Store initial positions for reuse
    mesh.userData.startPosition = new THREE.Vector3(i === 0 ? -2 : 2, 3, -5)
    mesh.userData.endPosition = new THREE.Vector3(i === 0 ? -2 : 2, 0.5, 0)
    // Store velocities and rotations
    mesh.userData.velocity = new THREE.Vector3()
    mesh.userData.angularVelocity = new THREE.Vector3()
    dice.push(mesh)
    scene.add(mesh)
  }

  // Add ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1e293b,
    transparent: true,
    opacity: 0.5
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0
  ground.receiveShadow = true
  scene.add(ground)

  animate()
}

const startRoll = () => {
  rollStartTime = Date.now()
  showResults.value = false

  // Reset dice positions and set initial velocities
  dice.forEach(die => {
    die.position.copy(die.userData.startPosition)
    // Forward and upward velocity
    die.userData.velocity.set(
      (Math.random() - 0.5) * 2,  // Random X spread
      4,                          // Up
      8                           // Forward
    )
    // Random rotation speed
    die.userData.angularVelocity.set(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    )
  })
}

const animate = () => {
  animationFrame = requestAnimationFrame(animate)

  if (props.isRolling) {
    const elapsed = Date.now() - rollStartTime
    const progress = Math.min(elapsed / ROLL_DURATION, 1)

    dice.forEach((die, index) => {
      if (progress < 1) {
        // Update position
        die.position.x += die.userData.velocity.x * 0.016
        die.position.y += die.userData.velocity.y * 0.016
        die.position.z += die.userData.velocity.z * 0.016

        // Apply gravity
        die.userData.velocity.y -= 9.8 * 0.016

        // Bounce off ground
        if (die.position.y < 0.5) {
          die.position.y = 0.5
          die.userData.velocity.y = Math.abs(die.userData.velocity.y) * 0.6
          die.userData.velocity.x *= 0.8
          die.userData.velocity.z *= 0.8
        }

        // Update rotation
        die.rotation.x += die.userData.angularVelocity.x * 0.016
        die.rotation.y += die.userData.angularVelocity.y * 0.016
        die.rotation.z += die.userData.angularVelocity.z * 0.016

        // Slow down rotation
        die.userData.angularVelocity.multiplyScalar(0.98)
        
      } else {
        // Smoothly move to final position
        die.position.lerp(die.userData.endPosition, 0.1)

        // Set final rotation based on result
        if (props.diceResults?.[index]) {
          const targetRotation = new THREE.Euler()
          const result = props.diceResults[index]
          
          switch(result) {
            case 1: targetRotation.set(Math.PI, 0, 0); break;
            case 2: targetRotation.set(0, 0, Math.PI/2); break;
            case 3: targetRotation.set(-Math.PI/2, 0, 0); break;
            case 4: targetRotation.set(Math.PI/2, 0, 0); break;
            case 5: targetRotation.set(0, 0, -Math.PI/2); break;
            case 6: targetRotation.set(0, 0, 0); break;
          }

          // Smoothly interpolate to final rotation
          die.rotation.x = THREE.MathUtils.lerp(die.rotation.x, targetRotation.x, 0.1)
          die.rotation.y = THREE.MathUtils.lerp(die.rotation.y, targetRotation.y, 0.1)
          die.rotation.z = THREE.MathUtils.lerp(die.rotation.z, targetRotation.z, 0.1)
        }
      }
    })

    if (progress === 1) {
      showResults.value = true
    }
  }

  renderer.render(scene, camera)
}

watch(() => props.isRolling, (newVal) => {
  if (newVal) {
    startRoll()
  }
})

// Handle window resize
const handleResize = () => {
  if (!camera || !renderer || !canvas.value) return
  
  camera.aspect = canvas.value.clientWidth / canvas.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight)
}

onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
  }
})

  </script>