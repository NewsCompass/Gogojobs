import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingDown, UserPlus, Info, Zap } from 'lucide-react';

/**
 * InnerMonologue Component
 * Displays "unfiltered" recruiter feedback with a raw, high-tech aesthetic.
 */
export default function InnerMonologue({ analysis, visible }) {
    if (!analysis) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed top-24 right-8 w-80 z-50 pointer-events-auto"
                >
                    <div className="card border-primary-500/30 bg-black/80 backdrop-blur-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500" />

                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-primary-400 animate-pulse" />
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Recruiter's Inner Monologue</div>
                        </div>

                        <p className="text-sm font-serif italic text-white/90 leading-relaxed mb-6">
                            "{analysis.innerMonologue}"
                        </p>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-white/40">Hierarchy Fit</span>
                                <span className="text-primary-400">{analysis?.hierarchyFit || 'Analyzing...'}</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-white/40">Budget Risk</span>
                                <span className={`px-2 py-0.5 rounded ${analysis?.budgetRisk?.toLowerCase()?.includes('high') ? 'bg-red-500/20 text-red-400' :
                                    analysis?.budgetRisk?.toLowerCase()?.includes('medium') ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/20 text-green-400'
                                    }`}>
                                    {analysis?.budgetRisk || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        {analysis.redFlags?.length > 0 && (
                            <div className="mt-8">
                                <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Red Flags Detectsed
                                </div>
                                <div className="space-y-2">
                                    {analysis.redFlags.map((flag, i) => (
                                        <div key={i} className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded border border-white/5 lowercase">
                                            • {flag}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
