import React, { useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky, PointerLockControls } from '@react-three/drei'
import { Physics, useBox } from '@react-three/cannon'

// ... (Player, Ground components remain the same) ...
// Player component with movement controls
function Player() {
    const [ref, api] = useBox(() => ({
      mass: 1,
      type: "Dynamic",
      position: [0, 2, 0],
    }))
    
    // Movement controls
    useEffect(() => {
      const handleKeyDown = (e) => {
        switch(e.code) {
          case 'KeyW':
            api.velocity.set(0, 0, -5)
            break
          case 'KeyS':
            api.velocity.set(0, 0, 5)
            break
          case 'KeyA':
            api.velocity.set(-5, 0, 0)
            break
          case 'KeyD':
            api.velocity.set(5, 0, 0)
            break
          case 'Space':
            api.velocity.set(0, 5, 0)
            break
        }
      }
      
      const handleKeyUp = () => {
        api.velocity.set(0, 0, 0)
      }
      
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
      }
    }, [api])
    
    return (
      <mesh ref={ref}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="red" opacity={0.5} transparent />
      </mesh>
    )
  }
  
// Voxel (block) component
function Cube({ position, color, onClick }) {
  const [hover, setHover] = useState(false)

  return (
    <mesh 
      position={position} 
      onClick={onClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry />
      <meshStandardMaterial 
        color={hover ? 'darkgrey' : color} 
        opacity={hover ? 0.7 : 1} 
        transparent
      />
    </mesh>
  )
}

// Main game component
function Game() {
  const [cubes, setCubes] = useState([])
  
  const addCube = useCallback((x, y, z) => {
    setCubes(prevCubes => [
      ...prevCubes,
      {
        position: [x, y, z],
        color: ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)]
      }
    ])
  }, [])
  
  const removeCube = useCallback((index) => {
    setCubes(prevCubes => prevCubes.filter((_, i) => i !== index))
  }, [])

  // Handle clicking on the ground or existing cubes
  const handleClick = (event) => {
    event.stopPropagation()
    
    const clickedPosition = event.point
    
    // If Alt key is pressed, we're in remove mode
    if (event.altKey) {
      // Find and remove the clicked cube
      const clickedIndex = cubes.findIndex(cube => 
        cube.position.every((coord, i) => Math.abs(coord - clickedPosition[i]) < 0.5)
      )
      if (clickedIndex !== -1) {
        removeCube(clickedIndex)
      }
    } else {
      // Calculate the new cube position
      // We need to offset the position based on the face that was clicked
      const normal = event.face.normal
      const x = Math.round(clickedPosition[0] + normal.x * 0.5)
      const y = Math.round(clickedPosition[1] + normal.y * 0.5)
      const z = Math.round(clickedPosition[2] + normal.z * 0.5)
      
      addCube(x, y, z)
    }
  }

  return (
    <Canvas camera={{ position: [0, 5, 12] }}>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <Physics>
        <Player />
        
        {/* Ground plane with click handler */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.5, 0]}
          onClick={handleClick}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="green" />
        </mesh>
        
        {cubes.map((cube, i) => (
          <Cube
            key={i}
            position={cube.position}
            color={cube.color}
            onClick={handleClick}
          />
        ))}
      </Physics>
      
      <PointerLockControls />
    </Canvas>
  )
}

export default Game