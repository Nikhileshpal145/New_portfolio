import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Fix for Missing JSX types in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

// Helper for lerp to avoid dependency on THREE.MathUtils which might have type issues
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

interface GalaxyParticlesProps {
  active: boolean;
}

const GalaxyParticles: React.FC<GalaxyParticlesProps> = ({ active }) => {
  const ref = useRef<any>(null);

  // Generate a spiral galaxy shape
  const particles = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new (THREE as any).Color('#00f0ff'); // Cyan
    const color2 = new (THREE as any).Color('#7000ff'); // Purple
    const color3 = new (THREE as any).Color('#ffffff'); // White

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spiral logic
      const radius = Math.random() * Math.random() * 14; // Concentrate near center
      const spinAngle = radius * 0.8; 
      const branches = 3;
      const branchAngle = (i % branches) * ((2 * Math.PI) / branches);

      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;

      // Position
      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[i3 + 1] = randomY * 2; // Flatten vertical axis
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      // Color mixing based on radius
      const mixedColor = color1.clone().lerp(color2, Math.random()).lerp(color3, Math.random() > 0.8 ? 1 : 0);
      
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }
    
    return { positions, colors };
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      // Cosmic rotation - Speeds up when active
      const rotationSpeed = active ? 0.2 : 0.05;
      ref.current.rotation.y += delta * rotationSpeed; 
      
      // Mouse Parallax (Reduced when active for stability)
      const mx = state.mouse.x * (active ? 0.02 : 0.1);
      const my = state.mouse.y * (active ? 0.02 : 0.1);
      
      ref.current.rotation.x = lerp(ref.current.rotation.x, my, delta);
      ref.current.rotation.z = lerp(ref.current.rotation.z, mx, delta);
    }
  });

  return (
    <group rotation={[0.5, 0, 0]}>
      <Points ref={ref} positions={particles.positions} colors={particles.colors} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={(THREE as any).AdditiveBlending}
        />
      </Points>
    </group>
  );
};

const CameraAnimator = ({ active }: { active: boolean }) => {
  useFrame((state, delta) => {
    // Zoom in when active
    const targetZ = active ? 8 : 14;
    state.camera.position.z = lerp(state.camera.position.z, targetZ, delta * 1.5);
  });
  return null;
};

export const NeuralNetwork3D = ({ entered }: { entered: boolean }) => {
  return (
    <div className="absolute inset-0 z-0 bg-void">
      <Canvas camera={{ position: [0, 2, 14], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 5, 40]} />
        
        <CameraAnimator active={entered} />

        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#7000ff" distance={15} decay={2} />
        
        {/* Background Starfield */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0.5} fade speed={1} />
        
        {/* Foreground Spiral Galaxy */}
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.1}>
             <GalaxyParticles active={entered} />
        </Float>
      </Canvas>
    </div>
  );
};