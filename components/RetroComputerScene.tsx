
import React, { useRef, useState, useMemo, useLayoutEffect, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Grid, MeshReflectorMaterial, useCursor, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

// Helper for lerp to avoid dependency on THREE.MathUtils which might have type issues
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

interface RetroComputerProps {
  entered: boolean;
  onEnter: () => void;
  scrollProgress?: number;
}

const auroraVertexShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Sine wave displacement for "curtain" effect
  float sineWave = sin(pos.x * 0.5 + uTime * 0.3);
  pos.z += sineWave * 2.0;
  pos.y += sin(pos.x * 1.0 + uTime * 0.2) * 1.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const auroraFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  // Soft edges top/bottom
  float alpha = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  
  // Moving vertical bands
  float bands = sin(vUv.x * 10.0 + uTime * 0.5) * 0.5 + 0.5;
  
  // Lighter Dual Shaded: Pastel Cyan to Pastel Magenta (Brightened)
  vec3 c1 = vec3(0.8, 0.98, 1.0); 
  vec3 c2 = vec3(0.98, 0.8, 0.98);
  
  // Smooth mix based on position and time
  vec3 color = mix(c1, c2, smoothstep(0.0, 1.0, vUv.x + sin(uTime * 0.1) * 0.5));
  
  // Reduced intensity to 0.06 for very light/airy look
  gl_FragColor = vec4(color, alpha * bands * 0.06);
}
`;

const NorthernLights = () => {
    const materialRef = useRef<any>(null);
    const materialRef2 = useRef<any>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
        if (materialRef2.current) {
            materialRef2.current.uniforms.uTime.value = state.clock.getElapsedTime() + 10;
        }
    });

    return (
        <group position={[0, 8, -25]} scale={[3, 1.5, 1]}>
            {/* Primary Curtain */}
            <mesh position={[0, 0, 0]} rotation={[0.2, 0, 0]}>
                <planeGeometry args={[40, 10, 64, 64]} />
                <shaderMaterial
                    ref={materialRef}
                    transparent
                    depthWrite={false}
                    side={(THREE as any).DoubleSide}
                    uniforms={{ uTime: { value: 0 } }}
                    vertexShader={auroraVertexShader}
                    fragmentShader={auroraFragmentShader}
                    blending={(THREE as any).AdditiveBlending}
                />
            </mesh>
            {/* Secondary Curtain for depth */}
            <mesh position={[0, -2, -5]} rotation={[0.3, 0, 0]}>
                <planeGeometry args={[50, 12, 64, 64]} />
                <shaderMaterial
                    ref={materialRef2}
                    transparent
                    depthWrite={false}
                    side={(THREE as any).DoubleSide}
                    uniforms={{ uTime: { value: 0 } }}
                    vertexShader={auroraVertexShader}
                    fragmentShader={auroraFragmentShader}
                    blending={(THREE as any).AdditiveBlending}
                />
            </mesh>
        </group>
    );
};

const RetroSun = () => (
  <group position={[0, 10, -50]}>
    {/* Sun Core */}
    <mesh>
      <circleGeometry args={[15, 64]} />
      <meshBasicMaterial color="#ff0055" toneMapped={false} />
    </mesh>
    {/* Glow */}
    <pointLight intensity={2} color="#ff0055" distance={100} decay={2} />
  </group>
);

const MovingStars = () => {
    const ref = useRef<any>(null);
    useFrame((state, delta) => {
        if(ref.current) {
            ref.current.rotation.y -= delta * 0.02; // Gentle rotation
            ref.current.rotation.z += delta * 0.005;
        }
    });
    return (
        <group ref={ref}>
             <Stars radius={300} depth={100} count={8000} factor={12} saturation={1} fade speed={2} />
        </group>
    )
}

const ShootingStars = () => {
  const mesh = useRef<any>(null);
  const data = useRef({
    nextSpawn: 2, 
    active: false,
    speed: 0
  });

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    
    // Spawn logic
    if (!data.current.active && t > data.current.nextSpawn) {
        data.current.active = true;
        data.current.speed = 40 + Math.random() * 20; // Very fast
        
        // Random start position in the sky
        const x = (Math.random() - 0.5) * 80;
        const y = 30 + Math.random() * 10;
        const z = -40 - Math.random() * 20;
        
        if (mesh.current) {
            mesh.current.position.set(x, y, z);
            // Aim downwards randomly
            const targetX = x + (Math.random() - 0.5) * 40;
            const targetY = -20;
            const targetZ = z + (Math.random() - 0.5) * 20;
            
            mesh.current.lookAt(targetX, targetY, targetZ);
            mesh.current.rotateX(Math.PI / 2); // Align cylinder geometry
            mesh.current.visible = true;
        }
    }

    // Move logic
    if (data.current.active && mesh.current) {
        mesh.current.translateY(data.current.speed * delta);
        
        // Reset if too low
        if (mesh.current.position.y < -20) {
            data.current.active = false;
            mesh.current.visible = false;
            data.current.nextSpawn = t + 5; // Exactly 5 seconds interval
        }
    }
  });

  return (
    <mesh ref={mesh} visible={false}>
      <cylinderGeometry args={[0.05, 0.02, 12, 8]} /> 
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
};

const FloatingData = ({ active }: { active: boolean }) => {
  const group = useRef<any>(null);
  const symbols = ['∑', '∫', '∂', '∇', 'λ', 'θ', 'ReLU', 'σ', 'α', 'β', '∞', 'f(x)', 'y=mx+b', 'P(A|B)'];

  // Create stable random positions
  const dataPoints = useMemo(() => {
    return new Array(30).fill(0).map(() => ({
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      position: [
        (Math.random() - 0.5) * 25, // Wide X spread
        (Math.random() - 0.5) * 15 + 2, // Height spread
        (Math.random() - 0.5) * 10 - 5 // Depth spread -10 to 0
      ] as [number, number, number],
      rotation: [Math.random() * 0.5, Math.random() * 0.5, 0] as [number, number, number],
      scale: 0.3 + Math.random() * 0.4,
      speed: 0.2 + Math.random() * 0.5
    }));
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
        // Slowly rotate the whole data cloud
        group.current.rotation.y += delta * 0.05;
    }
  });

  if (!active) return null;

  return (
    <group ref={group}>
      {dataPoints.map((data, i) => (
        <Float key={i} speed={data.speed} rotationIntensity={0.5} floatIntensity={1}>
            <Text
                position={data.position}
                rotation={data.rotation}
                scale={[data.scale, data.scale, data.scale]}
                color="#00f0ff" // Cyber cyan
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.4}
            >
                {data.symbol}
            </Text>
        </Float>
      ))}
    </group>
  );
};

const ScreenContent = ({ 
  bootStatus, 
  logs, 
  onTriggerBoot 
}: { 
  bootStatus: 'standby' | 'welcome' | 'booting' | 'ready', 
  logs: string[], 
  onTriggerBoot: () => void 
}) => {
  const [welcomeText, setWelcomeText] = useState('');
  
  // Typewriter effect for welcome message
  useEffect(() => {
    if (bootStatus === 'welcome') {
      setWelcomeText('');
      const text = "Welcome to Nikhilesh's Portfolio.....";
      let i = 0;
      const timer = setInterval(() => {
        setWelcomeText(text.substring(0, i + 1));
        i++;
        if (i === text.length) clearInterval(timer);
      }, 50);
      return () => clearInterval(timer);
    }
  }, [bootStatus]);

  // We use native 3D Text components which sit physically in the scene
  // This avoids scaling/resolution issues common with <Html> transform
  return (
    <group position={[0, 0, 1.06]}>
      
      {/* Black Background Plane to ensure high contrast */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.55, 1.85]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {bootStatus === 'standby' && (
        <group>
            <Text
                fontSize={0.25}
                color="#00ff00"
                anchorX="center"
                anchorY="bottom"
                position={[0, 0.1, 0]}
            >
                SYSTEM STANDBY
                <meshBasicMaterial color="#00ff00" toneMapped={false} />
            </Text>
            <Text
                fontSize={0.1}
                color="#00ff00"
                anchorX="center"
                anchorY="top"
                position={[0, -0.1, 0]}
            >
                WAITING FOR INPUT
                <meshBasicMaterial color="#00aa00" toneMapped={false} />
            </Text>
        </group>
      )}

      {bootStatus === 'welcome' && (
        <Text
            fontSize={0.18}
            maxWidth={2.2}
            textAlign="center"
            color="#39ff14"
            anchorX="center"
            anchorY="middle"
            lineHeight={1.4}
        >
            {welcomeText}
            {/* Adding the cursor */}
            {welcomeText.length > 0 && "_"}
            <meshBasicMaterial color="#39ff14" toneMapped={false} />
        </Text>
      )}

      {bootStatus === 'booting' && (
        <group position={[-1.1, 0.8, 0]}>
            {logs.slice(-14).map((log, i) => (
                <Text
                    key={i}
                    fontSize={0.08}
                    color={log.startsWith('>') ? "#ffff00" : "#00ff00"}
                    anchorX="left"
                    anchorY="top"
                    position={[0, -i * 0.12, 0]}
                >
                    {log}
                    <meshBasicMaterial 
                        color={log.startsWith('>') ? "#ffff00" : "#00ff00"} 
                        toneMapped={false} 
                    />
                </Text>
            ))}
        </group>
      )}
    </group>
  );
};

const InteractiveKeyboard = ({ playSound }: { playSound: () => void }) => {
    const keysRef = useRef<any>(null);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = () => {
            playSound();
            setIsPressed(true);
            setTimeout(() => setIsPressed(false), 100);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playSound]);

    useFrame((state, delta) => {
        if (keysRef.current) {
            // Subtle bounce animation on key press
            const targetY = isPressed ? 0.14 : 0.16;
            keysRef.current.position.y = lerp(keysRef.current.position.y, targetY, delta * 20);
        }
    });

    return (
      <group position={[0, -1.6, 2.4]} rotation={[0.15, 0, 0]}>
        <mesh>
            <boxGeometry args={[2.8, 0.3, 1.2]} />
            <meshStandardMaterial color="#EFEFE8" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Keys Area - interactive */}
        <group ref={keysRef} position={[0, 0.16, 0.05]}>
            <mesh>
                <boxGeometry args={[2.6, 0.1, 0.9]} />
                <meshStandardMaterial color="#222" roughness={0.8} />
            </mesh>
            {/* Simple simulated rows of keys texture detail */}
            {[0, 1, 2, 3].map((row) => (
                 <mesh key={row} position={[0, 0.051, -0.3 + row * 0.2]}>
                     <planeGeometry args={[2.5, 0.15]} />
                     <meshBasicMaterial color="#333" />
                 </mesh>
            ))}
        </group>
      </group>
    );
};

// --- 3D Components ---

const MonitorModel = ({ 
  bootStatus, 
  logs, 
  onTriggerBoot,
  playKeystroke
}: { 
  bootStatus: 'standby' | 'welcome' | 'booting' | 'ready', 
  logs: string[], 
  onTriggerBoot: () => void,
  playKeystroke: () => void
}) => {
  const group = useRef<any>(null);
  
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.getElapsedTime();
      group.current.rotation.y = Math.sin(t * 0.1) * 0.05; // Very subtle idle movement
    }
  });

  return (
    <group ref={group}>
      {/* --- Monitor Head Group --- */}
      <group position={[0, 0.7, 0]}>
         {/* Main CRT Housing - Off-White */}
         <mesh position={[0, 0, 0]}>
           <boxGeometry args={[3.2, 2.5, 2.0]} />
           <meshStandardMaterial color="#EFEFE8" roughness={0.6} metalness={0.1} />
         </mesh>

         {/* Rear Hump (CRT Tube) - Off-White */}
         <mesh position={[0, 0, -1]}>
           <boxGeometry args={[2.0, 1.5, 0.6]} />
           <meshStandardMaterial color="#EFEFE8" roughness={0.7} metalness={0.1} />
         </mesh>

         {/* Screen Backing (Simulated Bezel/Dark Area) */}
         <mesh position={[0, 0, 1.01]}>
           <planeGeometry args={[2.8, 2.1]} />
           <meshStandardMaterial color="#111" roughness={0.8} />
         </mesh>

         {/* The Actual Screen Surface */}
         <mesh position={[0, 0, 1.02]}>
           <planeGeometry args={[2.6, 1.9]} />
           <meshStandardMaterial color="#000000" />
         </mesh>

         {/* 3D Text Content Overlay */}
         <ScreenContent bootStatus={bootStatus} logs={logs} onTriggerBoot={onTriggerBoot} />

         {/* Power LED - Repositioned */}
         <mesh position={[1.3, -1.05, 1.02]}>
             <sphereGeometry args={[0.04]} />
             <meshStandardMaterial 
                color={bootStatus !== 'standby' ? "#00ff00" : "#330000"} 
                emissive={bootStatus !== 'standby' ? "#00ff00" : "#000000"} 
                emissiveIntensity={3} 
             />
         </mesh>
         
         {/* Badge - Repositioned */}
         <mesh position={[0, -1.05, 1.02]}>
             <boxGeometry args={[0.4, 0.08, 0.01]} />
             <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
         </mesh>
      </group>

      {/* --- Monitor Stand - Off-White --- */}
      <group position={[0, -0.8, 0]}>
         <mesh position={[0, 0, 0]}>
             <cylinderGeometry args={[0.4, 0.6, 0.6, 32]} />
             <meshStandardMaterial color="#EFEFE8" roughness={0.6} metalness={0.1} />
         </mesh>
      </group>

      {/* --- Desktop Case (Tower) - Off-White --- */}
      <group position={[0, -1.5, 0]}>
        {/* Main Box */}
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3.2, 0.8, 3.2]} />
            <meshStandardMaterial color="#EFEFE8" roughness={0.6} metalness={0.1} />
        </mesh>
        
        {/* Front Panel Detail */}
        <group position={[0, 0, 1.61]}>
             {/* Floppy Drive 1 */}
             <mesh position={[0.8, 0.15, 0]}>
                <boxGeometry args={[1.0, 0.05, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" />
             </mesh>
             {/* Floppy Drive 2 */}
             <mesh position={[0.8, -0.05, 0]}>
                <boxGeometry args={[1.0, 0.05, 0.05]} />
                <meshStandardMaterial color="#1a1a1a" />
             </mesh>

             {/* Air Vents */}
             {[-0.8, -0.9, -1.0, -1.1, -1.2].map((x, i) => (
                 <mesh key={i} position={[x, 0, 0]}>
                    <boxGeometry args={[0.05, 0.6, 0.02]} />
                    <meshStandardMaterial color="#a0a090" />
                 </mesh>
             ))}

             {/* Case Power Button */}
             <mesh position={[1.3, -0.2, 0.02]} rotation={[Math.PI/2, 0, 0]}>
                 <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
                 <meshStandardMaterial color="#555" />
             </mesh>
        </group>
      </group>

      {/* --- Interactive Keyboard - Off-White --- */}
      <InteractiveKeyboard playSound={playKeystroke} />
    </group>
  );
};

const RobotOperator = ({ 
    action, 
    playKeystroke,
    walkTarget
}: { 
    action: 'idle' | 'pressing' | 'typing', 
    playKeystroke: () => void,
    walkTarget: THREE.Vector3 | null
}) => {
    const headRef = useRef<any>(null);
    const leftEyeRef = useRef<any>(null);
    const rightEyeRef = useRef<any>(null);
    
    const leftArmGroup = useRef<any>(null);
    const leftForearmRef = useRef<any>(null);
    const leftHandRef = useRef<any>(null);
    
    const rightArmGroup = useRef<any>(null);
    const rightForearmRef = useRef<any>(null);
    const rightHandRef = useRef<any>(null);
    
    const torsoRef = useRef<any>(null);
    const robotGroup = useRef<any>(null);
    
    // Leg Refs
    const leftLegRef = useRef<any>(null);
    const rightLegRef = useRef<any>(null);

    const nextSoundTime = useRef(0);

    // Blinking State
    const blinkRef = useRef({
        nextBlink: 0,
        isBlinking: false
    });

    // Initial placement to avoid prop-reset issues during re-renders
    useLayoutEffect(() => {
        if (robotGroup.current) {
            robotGroup.current.position.set(-1.4, -1.5, 3);
            robotGroup.current.rotation.set(0, -0.4, 0);
        }
    }, []);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        
        // --- Blinking Logic ---
        if (t > blinkRef.current.nextBlink && !blinkRef.current.isBlinking) {
            blinkRef.current.isBlinking = true;
            setTimeout(() => {
                blinkRef.current.isBlinking = false;
                blinkRef.current.nextBlink = t + 2 + Math.random() * 4;
            }, 150);
            blinkRef.current.nextBlink = t + 10; 
        }

        const eyeScaleY = blinkRef.current.isBlinking ? 0.1 : 1;
        if (leftEyeRef.current) leftEyeRef.current.scale.y = lerp(leftEyeRef.current.scale.y, eyeScaleY, 0.4);
        if (rightEyeRef.current) rightEyeRef.current.scale.y = lerp(rightEyeRef.current.scale.y, eyeScaleY, 0.4);

        // --- Floating Head Bob ---
        if (headRef.current) {
            headRef.current.position.y = 1.2 + Math.sin(t * 1.5) * 0.02; 
        }

        if (action === 'idle') {
            const currentPos = robotGroup.current.position;
            const isMoving = walkTarget && currentPos.distanceTo(walkTarget) > 0.1;

            if (isMoving && walkTarget && robotGroup.current) {
                // --- Walk to Target ---
                // Move towards target
                const direction = new (THREE as any).Vector3().subVectors(walkTarget, currentPos).normalize();
                const speed = 2.0;
                robotGroup.current.position.add(direction.multiplyScalar(speed * delta));
                
                // Look at target
                const targetLook = new (THREE as any).Vector3(walkTarget.x, -1.5, walkTarget.z);
                robotGroup.current.lookAt(targetLook);

                // Walking Animation
                const walkCycle = t * 15;
                if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
                if (rightLegRef.current) rightLegRef.current.rotation.x = Math.cos(walkCycle) * 0.5;
                if (leftArmGroup.current) leftArmGroup.current.rotation.x = Math.cos(walkCycle) * 0.3;
                if (rightArmGroup.current) rightArmGroup.current.rotation.x = Math.sin(walkCycle) * 0.3;

                // Reset Torso/Head to neutral while walking
                if (torsoRef.current) torsoRef.current.rotation.set(0, 0, 0);
                if (headRef.current) headRef.current.rotation.set(0, 0, 0);

            } else {
                // --- Idle / Stop ---
                if (leftLegRef.current && rightLegRef.current) {
                    // Very subtle shifting weight
                    leftLegRef.current.rotation.x = Math.sin(t * 0.8) * 0.05;
                    rightLegRef.current.rotation.x = Math.cos(t * 0.8) * 0.05;
                }

                if (torsoRef.current) {
                    // Tracking torso rotation - POSITIVE LOGIC FOR NATURAL TRACKING
                    const mouseX = state.mouse.x;
                    const mouseY = state.mouse.y;
                    torsoRef.current.rotation.z = lerp(torsoRef.current.rotation.z, mouseX * 0.1, 0.05);
                    torsoRef.current.rotation.x = lerp(torsoRef.current.rotation.x, -mouseY * 0.1, 0.05);
                }

                if (headRef.current) {
                    // Tracking head rotation - POSITIVE LOGIC FOR NATURAL TRACKING
                    const mouseX = state.mouse.x;
                    const mouseY = state.mouse.y;
                    
                    const targetRotY = mouseX * 0.8; // Look TOWARDS mouse X
                    const targetRotX = -mouseY * 0.5; // Look TOWARDS mouse Y (Up is Up)

                    headRef.current.rotation.y = lerp(headRef.current.rotation.y, targetRotY, 0.1);
                    headRef.current.rotation.x = lerp(headRef.current.rotation.x, targetRotX, 0.1);
                }

                if (leftArmGroup.current) {
                    leftArmGroup.current.rotation.x = lerp(leftArmGroup.current.rotation.x, -0.5 + Math.sin(t*0.5)*0.05, 0.1);
                }
                if (rightArmGroup.current) {
                    rightArmGroup.current.rotation.x = lerp(rightArmGroup.current.rotation.x, -0.5 + Math.cos(t*0.5)*0.05, 0.1);
                    rightArmGroup.current.rotation.y = lerp(rightArmGroup.current.rotation.y, 0, 0.1);
                    rightArmGroup.current.rotation.z = lerp(rightArmGroup.current.rotation.z, 0, 0.1);
                }
            }

        } else if (action === 'pressing') {
            // --- Pressing Animation ---
            if (robotGroup.current) {
                robotGroup.current.position.lerp(new (THREE as any).Vector3(1.0, -1.5, 2.4), 0.05);
                robotGroup.current.rotation.y = lerp(robotGroup.current.rotation.y, -0.8, 0.05);
            }

            if (torsoRef.current) {
                torsoRef.current.rotation.x = lerp(torsoRef.current.rotation.x, 0.4, 0.05);
                torsoRef.current.rotation.z = lerp(torsoRef.current.rotation.z, -0.3, 0.05);
            }

            if (headRef.current) {
                headRef.current.rotation.y = lerp(headRef.current.rotation.y, -0.5, 0.1);
                headRef.current.rotation.x = lerp(headRef.current.rotation.x, 0.5, 0.1);
            }

            if (rightArmGroup.current) {
                rightArmGroup.current.rotation.x = lerp(rightArmGroup.current.rotation.x, -1.1, 0.05);
                rightArmGroup.current.rotation.y = lerp(rightArmGroup.current.rotation.y, 0.6, 0.05);
                rightArmGroup.current.rotation.z = lerp(rightArmGroup.current.rotation.z, 0.3, 0.05);
            }
            if (rightForearmRef.current) rightForearmRef.current.rotation.x = lerp(rightForearmRef.current.rotation.x, -0.1, 0.05);
            if (rightHandRef.current) rightHandRef.current.rotation.x = lerp(rightHandRef.current.rotation.x, 0.8, 0.1);
             if (leftArmGroup.current) leftArmGroup.current.rotation.x = lerp(leftArmGroup.current.rotation.x, -0.2, 0.05);
        
        } else if (action === 'typing') {
             // --- Typing Animation ---
             if (t > nextSoundTime.current) {
                 playKeystroke();
                 nextSoundTime.current = t + 0.05 + Math.random() * 0.1;
             }
             
             if (robotGroup.current) {
                robotGroup.current.position.lerp(new (THREE as any).Vector3(0, -1.5, 3.2), 0.05);
                robotGroup.current.rotation.y = lerp(robotGroup.current.rotation.y, -Math.PI, 0.05);
             }
             
             if (headRef.current) {
                 const scan = Math.sin(t * 3) * 0.25;
                 headRef.current.rotation.y = lerp(headRef.current.rotation.y, scan, 0.1);
                 const isCheckingKeyboard = Math.sin(t * 0.5) > 0.5;
                 const targetLook = isCheckingKeyboard ? 0.3 : -0.15;
                 headRef.current.rotation.x = lerp(headRef.current.rotation.x, targetLook, 0.1); 
             }

             if (torsoRef.current) {
                torsoRef.current.rotation.x = lerp(torsoRef.current.rotation.x, 0.3, 0.05);
                torsoRef.current.rotation.z = lerp(torsoRef.current.rotation.z, 0, 0.05);
            }

             const typeSpeed = 25;
             const typeChaosL = Math.sin(t * typeSpeed) * 0.1 + Math.cos(t * typeSpeed * 1.5) * 0.05;
             const typeChaosR = Math.cos(t * typeSpeed) * 0.1 + Math.sin(t * typeSpeed * 0.8) * 0.05;

             if (leftArmGroup.current) {
                 leftArmGroup.current.rotation.x = lerp(leftArmGroup.current.rotation.x, -0.9 + typeChaosL * 0.5, 0.2);
                 leftArmGroup.current.rotation.y = lerp(leftArmGroup.current.rotation.y, -0.3 + typeChaosL * 0.5, 0.2);
             }
             if (leftForearmRef.current) leftForearmRef.current.rotation.x = lerp(leftForearmRef.current.rotation.x, -0.5, 0.1);
             if (leftHandRef.current) leftHandRef.current.rotation.x = 0.5 + typeChaosL * 2;

             if (rightArmGroup.current) {
                 rightArmGroup.current.rotation.x = lerp(rightArmGroup.current.rotation.x, -0.9 + typeChaosR * 0.5, 0.2);
                 rightArmGroup.current.rotation.y = lerp(rightArmGroup.current.rotation.y, 0.3 + typeChaosR * 0.5, 0.2);
                 rightArmGroup.current.rotation.z = lerp(rightArmGroup.current.rotation.z, 0, 0.1);
             }
             if (rightForearmRef.current) rightForearmRef.current.rotation.x = lerp(rightForearmRef.current.rotation.x, -0.5, 0.1);
             if (rightHandRef.current) rightHandRef.current.rotation.x = 0.5 + typeChaosR * 2;
        }
    });

    return (
        <group ref={robotGroup} scale={[1.2, 1.2, 1.2]}>
            {/* --- Head Group --- */}
            <group ref={headRef} position={[0, 1.2, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.5, 0.45, 0.5]} />
                    <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
                </mesh>
                <mesh ref={leftEyeRef} position={[-0.12, 0.05, 0.26]}>
                    <sphereGeometry args={[0.06]} />
                    <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={3} />
                </mesh>
                <mesh ref={rightEyeRef} position={[0.12, 0.05, 0.26]}>
                    <sphereGeometry args={[0.06]} />
                    <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={3} />
                </mesh>
                <mesh position={[0, -0.12, 0.26]}>
                    <boxGeometry args={[0.3, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0.26, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} rotation={[0, 0, Math.PI/2]} />
                    <meshStandardMaterial color="#555" metalness={1} />
                </mesh>
                <mesh position={[-0.26, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} rotation={[0, 0, Math.PI/2]} />
                    <meshStandardMaterial color="#555" metalness={1} />
                </mesh>
            </group>

            {/* --- Torso Group (Articulated) --- */}
            <group ref={torsoRef} position={[0, 0.5, 0]}>
                 <mesh position={[0, 0.1, 0]}>
                    <boxGeometry args={[0.7, 0.9, 0.4]} />
                    <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
                 </mesh>
                 <mesh position={[0, 0.2, 0.21]}>
                     <circleGeometry args={[0.15, 32]} />
                     <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} />
                 </mesh>
                 
                 {/* Left Arm */}
                 <group ref={leftArmGroup} position={[-0.45, 0.4, 0]}>
                     <mesh>
                        <sphereGeometry args={[0.15]} />
                        <meshStandardMaterial color="#444444" />
                     </mesh>
                     <mesh position={[0, -0.3, 0]}>
                         <cylinderGeometry args={[0.08, 0.08, 0.6]} />
                         <meshStandardMaterial color="#888888" />
                     </mesh>
                     <group ref={leftForearmRef} position={[0, -0.6, 0]}>
                         <mesh>
                             <sphereGeometry args={[0.12]} />
                             <meshStandardMaterial color="#444444" />
                         </mesh>
                         <mesh position={[0, -0.25, 0]}>
                             <cylinderGeometry args={[0.07, 0.06, 0.5]} />
                             <meshStandardMaterial color="#888888" />
                         </mesh>
                         <group ref={leftHandRef} position={[0, -0.5, 0]}>
                             <mesh>
                                 <boxGeometry args={[0.1, 0.15, 0.15]} />
                                 <meshStandardMaterial color="#555555" />
                             </mesh>
                         </group>
                     </group>
                 </group>

                 {/* Right Arm */}
                 <group ref={rightArmGroup} position={[0.45, 0.4, 0]}>
                     <mesh>
                        <sphereGeometry args={[0.15]} />
                        <meshStandardMaterial color="#444444" />
                     </mesh>
                     <mesh position={[0, -0.3, 0]}>
                         <cylinderGeometry args={[0.08, 0.08, 0.6]} />
                         <meshStandardMaterial color="#888888" />
                     </mesh>
                     <group ref={rightForearmRef} position={[0, -0.6, 0]}>
                         <mesh>
                             <sphereGeometry args={[0.12]} />
                             <meshStandardMaterial color="#444444" />
                         </mesh>
                         <mesh position={[0, -0.25, 0]}>
                             <cylinderGeometry args={[0.07, 0.06, 0.5]} />
                             <meshStandardMaterial color="#888888" />
                         </mesh>
                          <group ref={rightHandRef} position={[0, -0.5, 0]}>
                             <mesh>
                                 <boxGeometry args={[0.1, 0.15, 0.15]} />
                                 <meshStandardMaterial color="#555555" />
                             </mesh>
                         </group>
                     </group>
                 </group>
            </group>

            {/* --- Legs Group (New) --- */}
            <group position={[0, 0, 0]}>
                {/* Pelvis */}
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.4, 0.15, 0.25]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>

                {/* Left Leg */}
                <group ref={leftLegRef} position={[-0.2, 0, 0]}>
                    {/* Thigh */}
                    <mesh position={[0, -0.1, 0]} rotation={[0.2, 0, 0]}>
                         <boxGeometry args={[0.1, 0.2, 0.12]} />
                         <meshStandardMaterial color="#666666" />
                    </mesh>
                    {/* Knee */}
                    <mesh position={[0, -0.2, 0.05]}>
                         <sphereGeometry args={[0.07]} />
                         <meshStandardMaterial color="#444444" />
                    </mesh>
                    {/* Shin */}
                    <mesh position={[0, -0.3, -0.05]} rotation={[-0.1, 0, 0]}>
                         <boxGeometry args={[0.09, 0.2, 0.1]} />
                         <meshStandardMaterial color="#666666" />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0, -0.44, 0.05]}>
                         <boxGeometry args={[0.12, 0.08, 0.25]} />
                         <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>

                {/* Right Leg */}
                <group ref={rightLegRef} position={[0.2, 0, 0]}>
                    {/* Thigh */}
                    <mesh position={[0, -0.1, 0]} rotation={[0.2, 0, 0]}>
                         <boxGeometry args={[0.1, 0.2, 0.12]} />
                         <meshStandardMaterial color="#666666" />
                    </mesh>
                    {/* Knee */}
                    <mesh position={[0, -0.2, 0.05]}>
                         <sphereGeometry args={[0.07]} />
                         <meshStandardMaterial color="#444444" />
                    </mesh>
                    {/* Shin */}
                    <mesh position={[0, -0.3, -0.05]} rotation={[-0.1, 0, 0]}>
                         <boxGeometry args={[0.09, 0.2, 0.1]} />
                         <meshStandardMaterial color="#666666" />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0, -0.44, 0.05]}>
                         <boxGeometry args={[0.12, 0.08, 0.25]} />
                         <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

const CameraHandler = ({ 
    active, 
    scrollProgress 
}: { 
    active: boolean, 
    scrollProgress: number 
}) => {
  const lookAtTarget = useRef(new (THREE as any).Vector3(0, 0, 0));

  useFrame((state, delta) => {
    // 1. Initial State (Active/Not Active)
    // Active: Fly past computer to -5 (The Void). Inactive: Room view at 9.5
    let targetZ = active ? -5 : 9.5; 
    
    // 2. Scroll Interaction (Only if active)
    // Minimal scroll effect when in the void to keep it stable
    if (active) {
        targetZ -= scrollProgress * 0.5; 
    }

    // Smoothly interpolate camera position
    state.camera.position.z = lerp(state.camera.position.z, targetZ, delta * 1.5);

    // Smoothly interpolate LookAt target
    // Inactive: Look at Computer (0,0,0)
    // Active: Look deep into the void (0,0,-100)
    const targetLookZ = active ? -100 : 0;
    lookAtTarget.current.z = lerp(lookAtTarget.current.z, targetLookZ, delta * 1.5);

    // Apply lookAt
    state.camera.lookAt(0, 0, lookAtTarget.current.z);
  });
  return null;
};

// Separate Power Button Component
const PowerButton = ({ onClick }: { onClick: () => void }) => {
    const [hovered, setHover] = useState(false);
    useCursor(hovered);
    
    return (
        <group position={[2.2, -1.6, 2.8]} rotation={[0.1, -0.2, 0]}>
            <mesh 
                onClick={onClick} 
                onPointerOver={() => setHover(true)} 
                onPointerOut={() => setHover(false)}
            >
                <cylinderGeometry args={[0.2, 0.25, 0.1, 32]} />
                <meshStandardMaterial color={hovered ? "#ff3333" : "#cc0000"} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
                 <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
                 <meshStandardMaterial color="#ffaaaa" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
            <Text position={[0, 0.2, 0.3]} fontSize={0.15} color="white" rotation={[-Math.PI/2, 0, 0]}>
                INIT SYSTEM
            </Text>
        </group>
    )
}

export const RetroComputerScene = ({ entered, onEnter, scrollProgress = 0 }: RetroComputerProps) => {
  const [bootStatus, setBootStatus] = useState<'standby' | 'welcome' | 'booting' | 'ready'>('standby');
  const [logs, setLogs] = useState<string[]>([]);
  const [robotAction, setRobotAction] = useState<'idle' | 'pressing' | 'typing'>('idle');
  const [navTarget, setNavTarget] = useState<any | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
      if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
      }
  }, []);

  // Shared sound synthesis for robot and user
  const playKeystroke = useCallback(() => {
      initAudio();
      if (!audioCtxRef.current) return;
      try {
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          // Synthesis parameters
          osc.type = 'sawtooth'; // Crisper sound
          // Random pitch variation for different keys (600Hz - 900Hz)
          osc.frequency.value = 600 + Math.random() * 300; 

          // Filter to muffle it slightly like plastic
          filter.type = 'lowpass';
          filter.frequency.value = 3000;

          // Short percussive envelope
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.06);
      } catch (e) {
          // Ignore audio errors
      }
  }, [initAudio]);

  const startBootSequence = () => {
    if (bootStatus !== 'standby') return;
    
    initAudio();

    // 1. Robot presses button
    setRobotAction('pressing');

    // 2. Wait for robot to reach button (approx 1.2s)
    setTimeout(() => {
         setBootStatus('welcome');
         // 3. Robot moves to keyboard to "type" (configure system)
         setRobotAction('typing');
    }, 1200);

    // 4. Start Logs after welcome screen
    setTimeout(() => {
        setBootStatus('booting');
        
        const bootSteps = [
            "BIOS DATE 09/22/2099 14:22:54 VER 1.0.4",
            "CPU: QUANTUM CORE i9-9900K @ 8.0GHZ",
            "DETECTING NVRAM... 64GB OK",
            "LOADING KERNEL... NEURAL_OS_V4.2",
            "> CHECKING PERIPHERALS...",
            "  [OK] NVIDIA T1000 DETECTED",
            "  [OK] GOOGLE_TPU_V5 POD CONNECTED",
            "> LOADING ML_DRIVERS...",
            "  ... TENSORFLOW_BACKEND [INIT]",
            "  ... PYTORCH_CUDA_STREAMS [ACTIVE]",
            "> MOUNTING DATASETS...",
            "  ... /mnt/experience... [MOUNTED]",
            "  ... /mnt/projects... [MOUNTED]",
            "> STARTING SERVICES...",
            "  ... GEMINI_AGENT.EXE [LISTENING]",
            "  ... REACT_RENDERER_D [READY]",
            "> EXECUTING USER_PROFILE...",
            "SYSTEM READY."
        ];

        let delay = 0;
        bootSteps.forEach((step, index) => {
            delay += Math.random() * 300 + 100;
            setTimeout(() => {
            setLogs(prev => [...prev.slice(-12), step]);
            if (index === bootSteps.length - 1) {
                setTimeout(() => {
                    setBootStatus('ready');
                    onEnter();
                    // Robot returns to idle once system is ready
                    setRobotAction('idle');
                }, 800);
            }
            }, delay);
        });
    }, 3500); // Wait for welcome text to read
  };

  return (
    <div className="absolute inset-0 z-0">
      <Canvas 
         camera={{ position: [0, 2, 9.5], fov: 45 }} 
         gl={{ antialias: true, toneMapping: (THREE as any).ReinhardToneMapping, toneMappingExposure: 1.5 }} 
         dpr={[1, 2]}
         shadows
      >
        <color attach="background" args={['#2b002b']} />
        <fog attach="fog" args={['#2b002b', 5, 40]} />
        
        <CameraHandler active={entered} scrollProgress={scrollProgress} />

        {/* --- Lighting --- */}
        {/* CHANGED: Ambient light to white/grey to show true material colors */}
        <ambientLight intensity={0.4} color="#ffffff" />
        
        <spotLight 
            position={[5, 10, 5]} 
            angle={0.5} 
            penumbra={1} 
            intensity={2} 
            color="#00f0ff" 
            castShadow 
            shadowBias={-0.0001}
        />
        {/* Rim Light for Robot */}
        <spotLight position={[-5, 5, -2]} intensity={3} color="#ff00ff" />
        
        {/* Screen Glow */}
        <pointLight position={[0, 1, 0.5]} intensity={1.5} color={bootStatus === 'standby' ? 'red' : '#00ff00'} distance={3} />

        {/* --- Environment --- */}
        <MovingStars />
        <NorthernLights />
        <RetroSun />
        <FloatingData active={entered} />
        <ShootingStars />

        {/* Floor */}
        <Grid 
            position={[0, -2, 0]} 
            args={[40, 40]} 
            cellSize={1} 
            cellThickness={1} 
            cellColor="#00f0ff" 
            sectionSize={5} 
            sectionThickness={1.5} 
            sectionColor="#ff00ff" 
            fadeDistance={25} 
            infiniteGrid 
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.01, 0]}>
          <planeGeometry args={[100, 100]} />
          <MeshReflectorMaterial
            {...({
                blur: [300, 100],
                resolution: 1024,
                mixBlur: 1,
                mixStrength: 60,
                roughness: 0.5,
                depthScale: 1.2,
                minDepthThreshold: 0.4,
                maxDepthThreshold: 1.4,
                color: "#151515",
                metalness: 0.8,
                mirror: 1
            } as any)}
          />
        </mesh>

        {/* Invisible Raycasting Floor for Click-to-Move */}
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -1.9, 0]} 
            onPointerDown={(e) => {
                // Only allow movement if not in boot sequence
                if(robotAction === 'idle') {
                    // Target position (keep Y at -1.5 for robot center pivot)
                    setNavTarget(new (THREE as any).Vector3(e.point.x, -1.5, e.point.z));
                }
            }}
            visible={false}
        >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* --- Objects --- */}
        <MonitorModel bootStatus={bootStatus} logs={logs} onTriggerBoot={startBootSequence} playKeystroke={playKeystroke} />
        <RobotOperator action={robotAction} playKeystroke={playKeystroke} walkTarget={navTarget} />
        
        <PowerButton onClick={startBootSequence} />

      </Canvas>
    </div>
  );
};
