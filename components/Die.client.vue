<!-- components/Die.client.vue -->
<template>
    <TresGroup :position="position" ref="dieRef">
      <!-- Base cube -->
      <TresMesh :cast-shadow="true">
        <TresBoxGeometry :args="[1, 1, 1]" />
        <TresMeshStandardMaterial :color="FACE_COLORS.default" />
      </TresMesh>
  
      <!-- Dice face dots -->
      <TresGroup v-for="(dots, index) in allDots" 
                :key="index"
                :rotation="faceRotations[index]">
        <TresMesh v-for="(pos, dotIndex) in dots" 
                  :key="dotIndex"
                  :position="[pos[0], pos[1], 0.51]">
          <TresCylinderGeometry :args="[0.08, 0.08, 0.1, 16]" />
          <TresMeshStandardMaterial :color="FACE_COLORS.dots" />
        </TresMesh>
      </TresGroup>
    </TresGroup>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue'
  import { useSpring } from '@vueuse/core'
  
  const props = defineProps({
    position: {
      type: Array,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    isRolling: {
      type: Boolean,
      required: true
    }
  })
  
  const dieRef = ref(null)
  
  // Colors configuration
  const FACE_COLORS = {
    default: '#1e293b', // slate-800
    active: '#7c3aed', // violet-600
    dots: '#ffffff'    // white
  }
  
  // Face rotations for each side
  const faceRotations = [
    [0, 0, 0],           // Face 1
    [0, Math.PI, 0],     // Face 6
    [0, Math.PI/2, 0],   // Face 3
    [0, -Math.PI/2, 0],  // Face 4
    [Math.PI/2, 0, 0],   // Face 5
    [-Math.PI/2, 0, 0]   // Face 2
  ]
  
  // Dot positions for each face
  const dotPositions = {
    1: [[0, 0]],
    2: [[-0.3, -0.3], [0.3, 0.3]],
    3: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
    4: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]],
    5: [[-0.3, -0.3], [0.3, -0.3], [0, 0], [-0.3, 0.3], [0.3, 0.3]],
    6: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0], [0.3, 0], [-0.3, 0.3], [0.3, 0.3]]
  }
  
  // Calculate all dots for the die
  const allDots = computed(() => [
    dotPositions[1],  // Front
    dotPositions[6],  // Back
    dotPositions[3],  // Right
    dotPositions[4],  // Left
    dotPositions[5],  // Top
    dotPositions[2]   // Bottom
  ])
  
  // Animation spring
  const rotation = useSpring({
    x: 0,
    y: 0,
    z: 0,
    stiffness: 0.1,
    damping: 0.15
  })
  
  // Watch for rolling state changes
  watch(() => props.isRolling, (isRolling) => {
    if (isRolling) {
      // Random rotation while rolling
      rotation.x.value = Math.random() * 20
      rotation.y.value = Math.random() * 20
      rotation.z.value = Math.random() * 20
    } else {
      // Set final rotation based on value
      const finalRotation = getDiceRotation(props.value)
      rotation.x.value = finalRotation[0]
      rotation.y.value = finalRotation[1]
      rotation.z.value = finalRotation[2]
    }
  })
  
  // Get final rotation for specific dice value
  const getDiceRotation = (value) => {
    const rotations = {
      1: [0, 0, 0],
      2: [0, 0, Math.PI],
      3: [0, -Math.PI/2, 0],
      4: [0, Math.PI/2, 0],
      5: [-Math.PI/2, 0, 0],
      6: [Math.PI/2, 0, 0]
    }
    return rotations[value] || [0, 0, 0]
  }
  </script>