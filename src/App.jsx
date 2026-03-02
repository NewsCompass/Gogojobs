import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Brain, Video, Mic, ArrowRight, CheckCircle2, Sparkles, User, Briefcase, ChevronRight, XCircle } from 'lucide-react';
import { parseCV } from './utils/cvParser';
import { generateInterviewStructure, getRealTimeFeedback } from './services/aiInterviewer';
import { useFaceTracker } from './hooks/useFaceTracker';
import { useVoiceAnalyzer } from './hooks/useVoiceAnalyzer';
import BiometricHUD from './components/BiometricHUD';
import AdviceDashboard from './components/AdviceDashboard';
import vapi from './services/vapiService';
import { INTERVIEW_KNOWLEDGE_BASE } from './utils/knowledgeBase';
import SarahV2 from './components/SarahV2';
import InnerMonologue from './components/InnerMonologue';
const GoGoJob = () => {
  const [step, setStep] = useState('landing'); // landing, upload, processing, interview
  const [cvFile, setCvFile] = useState(null);
  const [cvText, setCvText] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [rawAnalysis, setRawAnalysis] = useState(null);
  const [assistantVolume, setAssistantVolume] = useState(0);
  const [showInnerMonologue, setShowInnerMonologue] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [transcript, setTranscript] = useState("");

  const videoRef = React.useRef(null);
  const isInterviewActive = step === 'interview';

  // Vapi Event Listeners
  React.useEffect(() => {
    vapi.on('call-start', () => setIsCalling(true));
    vapi.on('call-end', () => {
      setIsCalling(false);
      setAssistantVolume(0);
    });
    vapi.on('volume-level', (volume) => {
      setAssistantVolume(volume);
    });
    vapi.on('message', (message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        setTranscript(prev => prev + " " + message.transcript);
      }
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const handleStartInterview = async () => {
    if (questions.length === 0) {
      setError("Interview questions are still being generated. Please wait.");
      return;
    }

    try {
      setStep('interview');

      // Convert questions array to a string for the prompt
      const questionsList = questions.map((q, i) => `${i + 1}. [${q.type.toUpperCase()}] ${q.question}`).join('\n');

      await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, {
        assistant: {
          model: {
            provider: "google",
            model: "gemini-1.5-flash", // Changed from gemini-2.0-flash to gemini-1.5-flash
            systemPrompt: `
                      You are "Sarah", a top-tier Technical Executive Recruiter. 
                      You are conducting a high-stakes interview for the role of: ${jobRole || 'Professional Role'}.
                      
                      JOB DESCRIPTION:
                      ${jobDescription || 'N/A'}
                      
                      CANDIDATE PROFILE:
                      ${cvText.substring(0, 4000)}
                      
                      YOUR INTERVIEW PLAN (Ask these specific questions in order):
                      ${questionsList}
                      
                      GUIDELINES:
                      1. Start by welcoming them. Mention a specific highlight from their CV to show you've done your homework.
                      2. Proceed through the list of 5 questions. Do NOT skip them.
                      3. BE ASSERTIVE AND INTERRUPT: If the candidate waffles, dodges the question, or talks for more than 45 seconds without getting to the point, INTERRUPT THEM immediately. Say phrases like "Let me stop you there," or "To bring this back to the specific question...".
                      4. DEMAND STAR METHOD: If they give a vague behavioral answer, interrupt them and say: "Can you give me a specific Situation, Task, Action, and Result for that?"
                      5. After the final question, give a brief "Sarah's Tip" (e.g. "I love your energy, but watch the pace") and then conclude the interview.
                      
                      CRITICAL UK INTERVIEW STANDARDS TO ENFORCE:
                      ${INTERVIEW_KNOWLEDGE_BASE}
                      
                      If the candidate asks about the company, improvise as a fast-growing, innovative tech firm.
          firstMessage: `Hello! I'm Sarah. I've been looking over your profile and I'm particularly impressed by your experience. Ready to dive into the interview for the ${jobRole || 'position'}?`,
          transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-GB",
        endpointing: 250 // Lower endpointing makes her interrupt faster (Standard is 500-800)
      }
        }
      });

} catch (err) {
  console.error("Vapi start failed:", err);
  setError("Failed to start voice interview. Check your Vapi keys.");
}
  };

// Biometric Hooks
const faceMetrics = useFaceTracker(videoRef.current, isInterviewActive);
const voiceMetrics = useVoiceAnalyzer(isInterviewActive);

// Setup webcam with better error handling
React.useEffect(() => {
  let stream = null;

  const startCamera = async () => {
    if (isInterviewActive && videoRef.current) {
      try {
        // Check if devices are available first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(device => device.kind === 'videoinput');

        if (!hasVideo) {
          setError("No camera detected. Please connect a webcam.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays
          await videoRef.current.play().catch(e => console.error("Playback failed", e));
        }
      } catch (err) {
        console.error("Webcam failed:", err);
        setError(`Camera Error: ${err.message}. Please check browser permissions.`);
      }
    }
  };

  startCamera();

  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, [isInterviewActive]);

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.type !== 'application/pdf') {
      setError("Only PDF files are supported for now.");
      return;
    }

    try {
      setError(null);
      setCvFile(file);
      setIsUploading(true);
      setStep('upload');
      setQuestions([]); // Reset for new session
      setCvText("");    // Reset for new session
      // Note: we keep jobRole and jobDescription as the user might want to reuse them

      // Step 1: Parse the CV
      const text = await parseCV(file);
      setCvText(text);

      // Step 2: Simulate processing delay for transition
      setIsUploading(false);
      setStep('processing');

      // Step 3: Generate Interview Structure + Raw Analysis
      const data = await generateInterviewStructure(text, jobRole, jobDescription);
      setQuestions(data.questions);
      setRawAnalysis(data.rawAnalysis);
      console.log("RAW RECRUITER ANALYSIS DETECTED:", data.rawAnalysis);

    } catch (err) {
      console.error("Processing failed:", err);
      setError("Failed to parse your CV. Please try again.");
      setIsUploading(false);
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

return (
  <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary-500/30">
    {/* Background Glows */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full" />
    </div>

    <nav className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
      <div className="flex items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-display font-black tracking-tighter uppercase">GoGoJob</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
        <a href="#" className="hover:text-primary-400 transition-colors">How it works</a>
        <a href="#" className="hover:text-primary-400 transition-colors">Pricing</a>
        <button className="px-5 py-2 glass rounded-full hover:bg-white/20 transition-all">Sign In</button>
      </div>
    </nav>

    <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <motion.div
            key="landing"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-xs font-bold text-primary-400 uppercase tracking-widest mb-8">
              <Brain className="w-4 h-4" /> Powered by Advanced Digital Human AI
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 max-w-4xl">
              MASTER YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">INTERVIEW</span> <br />
              WITH AI PRECISION
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
              Upload your CV and practice with a lifelike AI recruiter. Get real-time feedback on your answers, facial expressions, and vocal tone.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => setStep('upload')}
                className="btn-primary flex items-center gap-3 text-lg px-8 group"
              >
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-3 glass rounded-2xl font-bold flex items-center gap-3 hover:bg-white/20 transition-all">
                Watch Demo <Video className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Feature Grid */}
            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mt-32 w-full">
              {[
                { icon: FileText, title: 'CV Analysis', desc: 'Custom questions generated based on your experience and the job role.' },
                { icon: Video, title: 'Facial Feedback', desc: 'AI tracks eye contact, confidence, and micro-expressions.' },
                { icon: Mic, title: 'Voice Analytics', desc: 'Tone, pace, and filler word detection to polish your speaking.' }
              ].map((f, i) => (
                <div key={i} className="card group hover:border-primary-500/30 transition-all hover:bg-white/[0.12]">
                  <div className="w-12 h-12 bg-primary-950/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto w-full"
          >
            <div className="card p-12 text-center relative overflow-hidden">
              {isUploading && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2 }}
                  className="absolute top-0 left-0 right-0 h-1 bg-primary-500 origin-left"
                />
              )}

              <div className="w-20 h-20 bg-primary-950/50 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
                <Upload className="w-10 h-10 text-primary-400" />
              </div>

              <h2 className="text-3xl font-display font-black mb-4 tracking-tight">
                {isUploading ? 'ANALYZING PROFILE' : 'UPLOAD YOUR CV'}
              </h2>
              <p className="text-slate-400 mb-12">
                PDF, DOCX, or Image. AI will parse your experience to build your 1:1 interview suite.
              </p>
              <div className="card p-8 mb-8">
                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-400 block mb-2">Target Position</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-all font-serif italic"
                  />
                  <p className="text-[9px] text-white/30 mt-2 uppercase tracking-tighter">Tell Sarah what role you're applying for.</p>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary-400 block mb-2">Job Description (JD)</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here for deeper context..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-all font-serif italic h-32 resize-none"
                  />
                  <p className="text-[9px] text-white/30 mt-2 uppercase tracking-tighter">Sarah will use this to find gaps in your experience.</p>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".pdf"
                  />
                  <div className="btn-primary w-full flex items-center justify-center gap-3">
                    <Upload className="w-5 h-5" />
                    {isUploading ? 'PROCESSING...' : 'UPLOAD PDF CV'}
                  </div>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 glass border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 rounded-2xl"
                >
                  <XCircle className="w-5 h-5 shrink-0" /> {error}
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setStep('landing')}
              className="mt-8 flex items-center gap-2 text-white/40 hover:text-white transition-all mx-auto text-xs font-black uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
            </button>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto w-full text-center"
          >
            <div className="relative w-48 h-48 mx-auto mb-12">
              <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-16 h-16 text-primary-400 animate-pulse" />
              </div>
            </div>

            <h2 className="text-4xl font-display font-black mb-6 tracking-tight italic">BUILDING YOUR PERSONA</h2>
            <div className="space-y-4 text-left max-w-sm mx-auto">
              {[
                { label: 'Neural CV Analysis', done: !!cvText },
                { label: 'Role Context Mapping', done: !!cvText },
                { label: 'Generative Interview Flow', done: questions.length > 0 },
                { label: 'Finalizing AI Recruiter', done: questions.length > 0 }
              ].map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 transition-all duration-500 ${s.done ? 'opacity-100' : 'opacity-30'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${s.done ? 'bg-primary-500 text-white' : 'bg-slate-800'}`}>
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {cvText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 p-4 glass rounded-2xl text-[10px] font-mono text-white/40 overflow-hidden line-clamp-3 italic text-left"
                >
                  <div className="text-primary-400 font-black mb-1">NEURAL TRACE DETECTED:</div>
                  "{cvText.substring(0, 200)}..."
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {questions.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep('interview')}
                  className="btn-primary mt-12 px-12 group"
                >
                  ENTER INTERVIEW ROOM <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto h-[70vh]"
          >
            {/* Interviewer View */}
            <div className="card h-full flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Interview Session</span>
              </div>

              {/* 3D Digital Human Avatar */}
              <div className="w-full h-full bg-slate-900/50 flex flex-col items-center justify-center text-center group">
                <SarahV2 volume={assistantVolume} />

                {/* Digital Overlay on top of 3D */}
                <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center pointer-events-none">
                  <h3 className="text-xl font-display font-black tracking-tight mb-2 uppercase italic text-primary-400 bg-black/60 px-4 py-1 rounded-full backdrop-blur-md border border-white/5">
                    {questions[currentQuestionIndex]?.type || 'SARAH'}
                  </h3>
                  <div className="px-8 py-4 bg-black/40 backdrop-blur-xl rounded-3xl max-w-md border border-white/10 shadow-2xl">
                    <p className="text-sm italic text-white/90 leading-relaxed font-serif">
                      "{questions[currentQuestionIndex]?.question || 'Preparing your first question...'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Recruiter Monologue Overlay */}
            <InnerMonologue analysis={rawAnalysis} visible={showInnerMonologue} />

            {/* Your View & Analytics */}
            <div className="flex flex-col gap-6 h-full">
              <div className="card flex-1 relative bg-black p-0 overflow-hidden">
                {/* User Webcam */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {error && error.includes("Camera") ? (
                  <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center transition-all">
                    <Video className="w-12 h-12 text-red-500 mb-4" />
                    <div className="text-sm font-black uppercase tracking-widest text-white mb-2">Camera Access Required</div>
                    <p className="text-xs text-white/60 mb-6 max-w-xs">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-primary py-2 px-6 text-[10px]"
                    >
                      RETRY PERMISSIONS
                    </button>
                  </div>
                ) : !faceMetrics.detected && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center transition-all">
                    <Video className="w-12 h-12 text-white/20 mb-4" />
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Initializing Neural Link...</div>
                  </div>
                )}

                {/* Biometric HUD Overlay */}
                <BiometricHUD face={faceMetrics} voice={voiceMetrics} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="card p-4 flex flex-col justify-center items-center text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">Sentiment</div>
                  <div className="text-2xl font-bold">Confident</div>
                </div>
                <div className="card p-4 flex flex-col justify-center items-center text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Words/Min</div>
                  <div className="text-2xl font-bold">142</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={isCalling ? () => vapi.stop() : handleStartInterview}
                  className={`flex-1 ${isCalling ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-500'} py-4 uppercase tracking-widest text-xs font-black text-white rounded-2xl transition-all flex items-center justify-center gap-2`}
                >
                  {isCalling ? <XCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isCalling ? 'End Conversation' : 'Start AI Conversation'}
                </button>

                <button
                  onClick={() => setShowInnerMonologue(!showInnerMonologue)}
                  className={`p-4 rounded-2xl border transition-all ${showInnerMonologue ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'glass border-white/10 text-white/40 hover:text-white'}`}
                  title="Toggle Recruiter's Inner Monologue"
                >
                  <Brain className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    if (currentQuestionIndex < questions.length - 1) {
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      vapi.stop();
                      setStep('results');
                    }
                  }}
                  className="glass p-4 rounded-2xl hover:bg-white/20 transition-all border-white/10 group"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <AdviceDashboard
            metrics={{ face: faceMetrics, voice: voiceMetrics }}
            rawAnalysis={rawAnalysis}
            onReset={() => {
              setStep('landing');
              setCurrentQuestionIndex(0);
              setCvFile(null);
              setQuestions([]);
            }}
          />
        )}
      </AnimatePresence>
    </main>

    <footer className="relative z-10 border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-display font-black tracking-tighter uppercase text-sm">Verro LTD</span>
        </div>
        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">© 2026 GoGoJob AI. All rights reserved.</p>
      </div>
    </footer>
  </div >
);
};

export default GoGoJob;
