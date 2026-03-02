import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertCircle, TrendingUp, Clock, Smile, Mic, ArrowRight, Home } from 'lucide-react';

const AdviceDashboard = ({ metrics, rawAnalysis, onReset }) => {
    const score = 84; // Simulated aggregate score

    const insights = [
        {
            icon: Smile,
            title: "Confidence & Presence",
            status: metrics.face.smiling > 0.3 ? "Excellent" : "Needs Work",
            advice: "Your facial expressions were warm and engaged. Maintaining eye contact during technical answers was a highlight.",
            color: "text-green-400"
        },
        {
            icon: Mic,
            title: "Vocal Delivery",
            status: metrics.voice.wpm > 150 ? "Fast" : "Optimal",
            advice: `Your average pace was ${metrics.voice.wpm || 142} WPM. Aim for 130-150 WPM to ensure maximum clarity during complex explanations.`,
            color: "text-blue-400"
        }
    ];

    if (rawAnalysis) {
        insights.push({
            icon: AlertCircle,
            title: "Recruiter's 'Inner' View",
            status: rawAnalysis.budgetRisk || "Strategic",
            advice: rawAnalysis.innerMonologue,
            color: "text-primary-400"
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto w-full"
        >
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-xs font-bold text-primary-400 uppercase tracking-widest mb-6">
                    <Trophy className="w-4 h-4" /> Interview Session Complete
                </div>
                <h1 className="text-5xl font-display font-black tracking-tighter mb-4 italic uppercase">Your Performance</h1>
                <p className="text-slate-400">Based on real-time biometric tracking and AI content analysis.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="card p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl font-black text-primary-400 mb-1">{score}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Overall Score</div>
                </div>
                <div className="card p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold mb-1">Strong</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-green-400">Eye Contact</div>
                </div>
                <div className="card p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold mb-1">{metrics.voice.wpm || '142'}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">Avg Pace (WPM)</div>
                </div>
                <div className="card p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-2xl font-bold mb-1">Optimal</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary-400">Positivity</div>
                </div>
            </div>

            <div className="space-y-6">
                {insights.map((insight, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="card p-8 flex flex-col md:flex-row gap-8 items-start hover:border-white/10 transition-all"
                    >
                        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center shrink-0">
                            <insight.icon className={`w-8 h-8 ${insight.color}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold">{insight.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/5 ${insight.color}`}>
                                    {insight.status}
                                </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-serif italic text-sm">
                                "{insight.advice}"
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {rawAnalysis && (
                <div className="mt-12 card p-8 border-red-500/10 bg-red-500/5">
                    <h3 className="text-xl font-display font-black uppercase italic tracking-tight text-red-500 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-6 h-6" /> Raw Hierarchy & Risk Analysis
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Internal Leveling</div>
                            <p className="text-sm font-bold text-white/80">{rawAnalysis.hierarchyFit}</p>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Red Flags Detected</div>
                            <div className="flex flex-wrap gap-2">
                                {rawAnalysis.redFlags?.map((flag, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-black uppercase">
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-16 flex justify-center gap-4">
                <button
                    onClick={onReset}
                    className="btn-primary px-12 py-4 flex items-center gap-3"
                >
                    <Home className="w-5 h-5" /> Back to Dashboard
                </button>
                <button className="glass px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-3">
                    Download PDF Report <TrendingUp className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};

export default AdviceDashboard;
