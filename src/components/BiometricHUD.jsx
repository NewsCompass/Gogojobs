import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Eye, User, Activity } from 'lucide-react';

const BiometricHUD = ({ face, voice }) => {
    return (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            {/* Top Indicators */}
            <div className="flex justify-between items-start">
                <div className="glass px-4 py-2 rounded-2xl flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${face.detected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                        {face.detected ? 'Face Locked' : 'Searching for Face...'}
                    </span>
                </div>

                <div className="flex flex-col gap-2 scale-90 origin-top-right">
                    <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <Mic className={`w-3.5 h-3.5 ${voice.isSpeaking ? 'text-primary-400' : 'text-slate-500'}`} />
                        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${Math.min(voice.volume * 2, 100)}%` }}
                                className="h-full bg-primary-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Reticle (Simulated) */}
            <div className="flex-1 flex items-center justify-center opacity-20">
                <div className="w-64 h-64 border-2 border-white/10 rounded-full flex items-center justify-center">
                    <div className="w-1 h-8 bg-white/20 absolute -top-4" />
                    <div className="w-1 h-8 bg-white/20 absolute -bottom-4" />
                    <div className="w-8 h-1 bg-white/20 absolute -left-4" />
                    <div className="w-8 h-1 bg-white/20 absolute -right-4" />
                </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    icon={Eye}
                    label="Eye Contact"
                    value={face.eyeContact ? "Strong" : "Seeking"}
                    color={face.eyeContact ? "text-green-400" : "text-yellow-400"}
                />
                <MetricCard
                    icon={User}
                    label="Confidence"
                    value={face.smiling > 0.4 ? "High" : "Optimal"}
                    color="text-primary-400"
                />
                <MetricCard
                    icon={Activity}
                    label="WPM"
                    value={voice.wpm || '---'}
                    color="text-blue-400"
                />
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass p-3 rounded-2xl flex flex-col items-center justify-center text-center">
        <Icon className="w-4 h-4 text-white/40 mb-1" />
        <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</div>
        <div className={`text-xs font-bold leading-tight ${color}`}>{value}</div>
    </div>
);

export default BiometricHUD;
