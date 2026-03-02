import { useState, useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const useFaceTracker = (videoElement, isActive) => {
    const [faceMetrics, setFaceMetrics] = useState({
        detected: false,
        smiling: 0,
        blinking: false,
        eyeContact: false,
        headPosition: { x: 0, y: 0 }
    });

    const landmarkerRef = useRef(null);
    const animationRef = useRef(null);
    const isPredictingRef = useRef(false);

    useEffect(() => {
        let isCanceled = false;

        const initLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                if (isCanceled) return;
                landmarkerRef.current = landmarker;

                // Start predicting immediately if we have a video element ready
                if (videoElement && !isPredictingRef.current) {
                    startPredicting();
                }
            } catch (err) {
                console.error("Face Landmarker init failed:", err);
            }
        };

        if (isActive && !landmarkerRef.current) {
            initLandmarker();
        }

        return () => {
            isCanceled = true;
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            isPredictingRef.current = false;
        };
    }, [isActive, videoElement]);

    const startPredicting = () => {
        if (!videoElement || !landmarkerRef.current) return;
        isPredictingRef.current = true;

        const predict = () => {
            if (!videoElement.videoWidth) {
                animationRef.current = requestAnimationFrame(predict);
                return;
            }

            const startTimeMs = performance.now();
            try {
                const results = landmarkerRef.current.detectForVideo(videoElement, startTimeMs);

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    const blendshapes = results.faceBlendshapes[0].categories;

                    const smileRight = blendshapes.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;
                    const smileLeft = blendshapes.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
                    const blinkRight = blendshapes.find(c => c.categoryName === 'eyeBlinkRight')?.score || 0;
                    const blinkLeft = blendshapes.find(c => c.categoryName === 'eyeBlinkLeft')?.score || 0;
                    const eyeLookInLeft = blendshapes.find(c => c.categoryName === 'eyeLookInLeft')?.score || 0;
                    const eyeLookOutLeft = blendshapes.find(c => c.categoryName === 'eyeLookOutLeft')?.score || 0;

                    setFaceMetrics({
                        detected: true,
                        smiling: (smileRight + smileLeft) / 2,
                        blinking: blinkRight > 0.5 || blinkLeft > 0.5,
                        eyeContact: Math.abs(eyeLookInLeft - eyeLookOutLeft) < 0.2,
                        headPosition: { x: 0, y: 0 }
                    });
                } else {
                    setFaceMetrics(prev => prev.detected ? { ...prev, detected: false } : prev);
                }
            } catch (error) {
                // Ignore errors during video teardown or fast refreshes
            }

            animationRef.current = requestAnimationFrame(predict);
        };

        predict();
    };

    // Re-trigger if videoElement mounts slightly after the model finishes loading
    useEffect(() => {
        if (isActive && videoElement && landmarkerRef.current && !isPredictingRef.current) {
            startPredicting();
        }
    }, [isActive, videoElement]);

    return faceMetrics;
};
