<!-- components/DiceRoller.client.vue -->
<template>
    <div class="relative w-full h-64">
      <canvas ref="canvas" class="w-full h-full rounded-lg bg-gray-900/50" />
      
      <!-- Results Overlay -->
      <Transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="transform translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <div v-if="showResults" 
             class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div class="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            <p class="text-white text-lg font-bold">
              {{ diceResults[0] }} + {{ diceResults[1] }} = {{ diceResults[0] + diceResults[1] }}
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue'
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
  
  const props = defineProps({
    isRolling: Boolean,
    diceResults: Array
  })
  
  const canvas = ref(null)
  const showResults = ref(false)
  
  let scene, camera, renderer, dice1, dice2, controls, animationFrame
  
  // Colors
  const COLORS = {
    default: 0x1e293b,
    dots: 0xffffff
  }
  
  const createDie = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshPhongMaterial({ color: COLORS.default })
    const die = new THREE.Mesh(geometry, material)
    
    // Add dots for each face
    const dotGeometry = new THREE.CircleGeometry(0.1, 32)
    const dotMaterial = new THREE.MeshPhongMaterial({ color: COLORS.dots })
    
    // Add dots based on die face (simplified version)
    const addDot = (x, y, z) => {
      const dot = new THREE.Mesh(dotGeometry, dotMaterial)
      dot.position.set(x, y, z)
      dot.lookAt(x > 0 ? 1 : -1, y > 0 ? 1 : -1, z > 0 ? 1 : -1)
      die.add(dot)
    }
    
    // Add some basic dots (simplified)
    addDot(0, 0, 0.51) // Center dot for 1
    addDot(-0.3, 0.3, 0.51) // Corner dots
    addDot(0.3, -0.3, 0.51)
    
    return die
  }
  
  const init = () => {
    if (!canvas.value) return
    
    // Scene setup
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(
      75,
      canvas.value.clientWidth / canvas.value.clientHeight,
      0.1,
      1000
    )
    
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
      alpha: true
    })
    renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight)
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)
    
    // Create dice
    dice1 = createDie()
    dice2 = createDie()
    dice1.position.x = -1.5
    dice2.position.x = 1.5
    scene.add(dice1)
    scene.add(dice2)
    
    // Camera position
    camera.position.z = 5
    camera.position.y = 2
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    
    // Animation loop
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)
      
      if (props.isRolling) {
        dice1.rotation.x += 0.1
        dice1.rotation.y += 0.15
        dice2.rotation.x += 0.15
        dice2.rotation.y += 0.1
      }
      
      controls.update()
      renderer.render(scene, camera)
    }
    
    animate()
  }
  
  // Handle resize
  const handleResize = () => {
    if (!camera || !renderer || !canvas.value) return
    
    camera.aspect = canvas.value.clientWidth / canvas.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(canvas.value.clientWidth, canvas.value.clientHeight)
  }
  
  // Watch for changes
  watch(() => props.isRolling, (newVal) => {
    if (!newVal && props.diceResults[0] !== 0) {
      setTimeout(() => {
        showResults.value = true
      }, 1000)
    } else {
      showResults.value = false
    }
  })
  
  // Lifecycle hooks
  onMounted(() => {
    init()
    window.addEventListener('resize', handleResize)
  })
  
  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    window.removeEventListener('resize', handleResize)
    
    // Cleanup THREE.js resources
    if (renderer) {
      renderer.dispose()
    }
    if (controls) {
      controls.dispose()
    }
  })
  </script>