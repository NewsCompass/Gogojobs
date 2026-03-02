import { useState, useEffect, useRef } from 'react';

/**
 * Hook to analyze voice volume, pitch, and pacing in real-time.
 */
export const useVoiceAnalyzer = (isActive) => {
    const [metrics, setMetrics] = useState({
        volume: 0,
        isSpeaking: false,
        startTime: null,
        wordCount: 0,
        wpm: 0,
        lastVolume: 0
    });

    const audioCtxRef = useRef(null);
    const analyzerRef = useRef(null);
    const streamRef = useRef(null);
    const animationRef = useRef(null);

    const startAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const analyze = () => {
                if (!isActive) return;

                analyzer.getByteFrequencyData(dataArray);

                // Calculate average volume
                let total = 0;
                for (let i = 0; i < bufferLength; i++) {
                    total += dataArray[i];
                }
                const volume = total / bufferLength;

                setMetrics(prev => {
                    const isSpeaking = volume > 20;
                    let { startTime, wordCount, wpm } = prev;

                    if (isSpeaking && !prev.isSpeaking) {
                        if (!startTime) startTime = Date.now();
                        // Start of a word/sentence
                    }

                    if (startTime) {
                        const durationMin = (Date.now() - startTime) / 60000;
                        if (durationMin > 0) {
                            // Very rough WPM approximation based on speech bursts
                            if (isSpeaking && prev.lastVolume <= 20) {
                                wordCount += 1;
                            }
                            wpm = Math.round(wordCount / durationMin);
                        }
                    }

                    return {
                        volume,
                        isSpeaking,
                        startTime,
                        wordCount,
                        wpm,
                        lastVolume: volume
                    };
                });

                animationRef.current = requestAnimationFrame(analyze);
            };

            analyze();
        } catch (err) {
            console.error("Audio analysis failed:", err);
        }
    };

    const stopAnalysis = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioCtxRef.current) audioCtxRef.current.close();
    };

    useEffect(() => {
        if (isActive) {
            startAnalysis();
        } else {
            stopAnalysis();
        }
        return stopAnalysis;
    }, [isActive]);

    return metrics;
};
