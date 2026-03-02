import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Avatar Component (Sarah)
 * Procedural stylized neural head to prevent external GLB 404s.
 */
function AvatarModel({ volume = 0 }) {
    // Load the custom, user-provided GLB file from the public folder
    const { scene, nodes, materials } = useGLTF('/models/GLBFILECONFIRMED.glb');
    const headRef = useRef();

    // Find the head mesh for morph targets
    useEffect(() => {
        scene.traverse((obj) => {
            if (obj.isMesh) {
                // Adjust materials to look better under the studio lights
                if (obj.material) {
                    obj.material.roughness = 0.5;
                    obj.material.metalness = 0.1;
                }

                if (obj.morphTargetDictionary) {
                    // Check common head naming conventions
                    if (obj.name.toLowerCase().includes('head') || obj.name.toLowerCase().includes('face') || obj.name.toLowerCase().includes('mesh')) {
                        headRef.current = obj;
                    }
                }
            }
        });

        // Center and scale the user's model to fit the camera view
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // INCREASED SCALE: Multiplier adjusted from 1.5 to 3.5 to make her much larger
        const scale = 3.5 / maxDim;

        scene.position.x = -center.x * scale;
        // Adjusted Y offset to push her torso up into the frame
        scene.position.y = -center.y * scale - 1.2;
        scene.position.z = -center.z * scale;
        scene.scale.setScalar(scale);

    }, [scene]);

    // Lip-sync and Idle Animations
    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();

        // 1. Idle Breathing / Sway (Very subtle)
        // Removed rotation.y to keep looking straight, just slight vertical float
        scene.position.y += Math.sin(t * 1.5) * 0.0005;

        // 2. Facial Morph Targets
        if (headRef.current) {
            // Blinking
            const blinkFreq = 4;
            const blinkStrength = Math.max(0, Math.sin(t * blinkFreq) > 0.98 ? 1 : 0);
            const eyeBlinkLeft = headRef.current.morphTargetDictionary['eyeBlinkLeft'];
            const eyeBlinkRight = headRef.current.morphTargetDictionary['eyeBlinkRight'];
            if (eyeBlinkLeft !== undefined) headRef.current.morphTargetInfluences[eyeBlinkLeft] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[eyeBlinkLeft], blinkStrength, 0.5);
            if (eyeBlinkRight !== undefined) headRef.current.morphTargetInfluences[eyeBlinkRight] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[eyeBlinkRight], blinkStrength, 0.5);

            // Lip Sync (Simplistic volume-to-mouth mapping)
            const visemeAA = headRef.current.morphTargetDictionary['viseme_aa'];
            const visemeO = headRef.current.morphTargetDictionary['viseme_O'];
            const jawOpen = headRef.current.morphTargetDictionary['jawOpen'];
            const mouthOpen = headRef.current.morphTargetDictionary['mouthOpen'];

            const mouthOpenness = Math.min(volume * 15, 1); // Scale volume to morph range

            if (visemeAA !== undefined) headRef.current.morphTargetInfluences[visemeAA] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[visemeAA], mouthOpenness, 0.4);
            if (visemeO !== undefined) headRef.current.morphTargetInfluences[visemeO] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[visemeO], mouthOpenness * 0.5, 0.2);
            if (jawOpen !== undefined) headRef.current.morphTargetInfluences[jawOpen] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[jawOpen], mouthOpenness * 0.3, 0.3);
            if (mouthOpen !== undefined) headRef.current.morphTargetInfluences[mouthOpen] = THREE.MathUtils.lerp(headRef.current.morphTargetInfluences[mouthOpen], mouthOpenness, 0.4);
        }
    });

    return <primitive object={scene} />;
}

export default function SarahV2({ volume = 0 }) {
    return (
        <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black">
            {/* Adjusted camera fov and position to frame the closer/larger model better */}
            <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0.2, 1.5], fov: 30 }}>
                <PerspectiveCamera makeDefault position={[0, 0.2, 1.5]} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />

                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <React.Suspense fallback={null}>
                    <AvatarModel volume={volume} />
                    <Environment preset="city" />
                </React.Suspense>

                <ContactShadows opacity={0.4} scale={5} blur={2.4} far={4.5} />
            </Canvas>
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
    );
}
