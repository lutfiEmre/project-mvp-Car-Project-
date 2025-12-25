'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CarModelProps {
  buyingPower?: number;
  apr?: number;
  isInteracting?: boolean;
}

// Loading component with progress
function LoadingProgress() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-sm font-medium text-slate-600">
          Loading 3D Model... {Math.round(progress)}%
        </div>
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

function Model({ buyingPower = 25000, apr = 7.5, isInteracting = false }: CarModelProps) {
  const { scene } = useGLTF('/chevrolet_colorado_zr2.glb');
  const modelRef = useRef<THREE.Group>(null);
  
  // Slow continuous rotation (pauses when user interacts)
  useFrame((state, delta) => {
    if (modelRef.current && !isInteracting) {
      modelRef.current.rotation.y += delta * 0.15; // Slower rotation
    }
  });

  // Dynamic scale based on buying power
  const getScale = () => {
    if (buyingPower > 50000) return 125;
    if (buyingPower > 35000) return 120;
    return 115;
  };

  return (
    <group ref={modelRef} position={[0, 0.5, 0]} scale={getScale()}>
      <primitive 
        object={scene} 
      />
    </group>
  );
}

function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-sm font-medium text-slate-600">
          Loading 3D Model...
        </div>
      </div>
    </div>
  );
}

interface CarViewerProps {
  buyingPower?: number;
  apr?: number;
}

export function CarViewer({ buyingPower = 25000, apr = 7.5 }: CarViewerProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div 
      className="relative h-full w-full min-h-[400px] cursor-grab active:cursor-grabbing"
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
    >
      <Suspense fallback={<Loader />}>
        <Canvas
          camera={{ position: [4, 2, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
          dpr={[1, 1.5]} // Lower DPR for better performance
        >
          <ambientLight intensity={0.6} />
          <spotLight 
            position={[10, 10, 10]} 
            angle={0.15} 
            penumbra={1} 
            intensity={1.2} 
            castShadow={false} // Disable shadow for performance
          />
          <pointLight position={[-10, 5, -10]} intensity={0.4} />
          <pointLight position={[10, 5, 10]} intensity={0.4} />
          
          <Suspense fallback={<LoadingProgress />}>
            <Model buyingPower={buyingPower} apr={apr} isInteracting={isInteracting} />
          </Suspense>
          
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.5}
            scale={15}
            blur={2.5}
            far={4}
          />
          
          <Environment preset="city" />
          
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>
      
      {/* Interaction hint */}
      <div className="absolute bottom-4 left-1/2  -translate-x-1/2 text-xs text-black/50 pointer-events-none">
        Drag to rotate
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload('/chevrolet_colorado_zr2.glb');

