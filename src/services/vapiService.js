import Vapi from "@vapi-ai/web";

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

/**
 * Vapi Service
 * Handles real-time conversational AI and voice-to-text.
 */

export const startInterview = async (assistantId, assistantOverrides) => {
    try {
        const call = await vapi.start(assistantId, assistantOverrides);
        return call;
    } catch (err) {
        console.error("Vapi Start Error:", err);
        throw err;
    }
};

export const stopInterview = () => {
    vapi.stop();
};

export const subscribeToInterview = (onEvent) => {
    vapi.on('call-start', () => onEvent({ type: 'call-start' }));
    vapi.on('call-end', () => onEvent({ type: 'call-end' }));
    vapi.on('speech-start', () => onEvent({ type: 'speech-start' }));
    vapi.on('speech-end', () => onEvent({ type: 'speech-end' }));
    vapi.on('message', (message) => onEvent({ type: 'message', data: message }));
    vapi.on('error', (err) => onEvent({ type: 'error', data: err }));
};

export default vapi;
