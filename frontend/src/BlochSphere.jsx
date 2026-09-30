import React from 'react';
import { QuantumText } from './QuantumMath';
import { Canvas } from '@react-three/fiber';
import { Sphere, Line, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const StateVectorArrow = ({ x, y, z }) => {
  // Map quantum (x,y,z) to Three.js coordinates
  // QM Z (up/down) -> Three Y
  // QM X (front/back) -> Three Z
  // QM Y (left/right) -> Three X
  const dir = new THREE.Vector3(y, z, x);
  const length = dir.length();
  
  if (length < 0.001) return null; // Fully mixed state (center of sphere)
  
  return (
    <arrowHelper 
      args={[dir.normalize(), new THREE.Vector3(0,0,0), length, 0xb75d29, 0.2, 0.1]} 
    />
  );
};

export default function BlochSphere({ qubit, x, y, z }) {
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="font-serif text-[#71717A] mb-2 text-sm">
        <QuantumText>{qubit}</QuantumText>
      </div>
      <div className="w-full aspect-square rounded-full border border-[#E4E4E7] shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] bg-[#FAFAFA] overflow-hidden cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [1.8, 1.2, 1.8], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          <OrbitControls enableZoom={false} enablePan={false} />
          
          {/* Sphere Outer Shell */}
          <Sphere args={[1, 32, 32]}>
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.15} roughness={0.1} />
          </Sphere>
          
          {/* Equator and Meridians */}
          <Sphere args={[1, 16, 16]}>
             <meshBasicMaterial color="#D4D4D8" wireframe transparent opacity={0.3} />
          </Sphere>

          {/* Axes */}
          <Line points={[[0, -1, 0], [0, 1, 0]]} color="#A1A1AA" lineWidth={1} /> {/* Z-axis */}
          <Line points={[[-1, 0, 0], [1, 0, 0]]} color="#D4D4D8" lineWidth={1} /> {/* Y-axis */}
          <Line points={[[0, 0, -1], [0, 0, 1]]} color="#D4D4D8" lineWidth={1} /> {/* X-axis */}
          
          {/* Axis Labels */}
          <Text position={[0, 1.15, 0]} color="#2A2A2A" fontSize={0.15} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">|0⟩</Text>
          <Text position={[0, -1.15, 0]} color="#2A2A2A" fontSize={0.15} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">|1⟩</Text>
          <Text position={[0, 0, 1.15]} color="#71717A" fontSize={0.12} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">+X</Text>
          <Text position={[1.15, 0, 0]} color="#71717A" fontSize={0.12} font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">+Y</Text>
          
          {/* State Vector */}
          <StateVectorArrow x={x} y={y} z={z} />
        </Canvas>
      </div>
      <div className="mt-2 text-[10px] text-[#71717A] font-mono">
        (x: {x.toFixed(2)}, y: {y.toFixed(2)}, z: {z.toFixed(2)})
      </div>
    </div>
  );
}
