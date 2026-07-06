import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Bot, Code2, Sparkles, ArrowRight, Zap, Target, LineChart, BrainCircuit, Shield, Users, Award } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Custom 3D Mouse Tilt Wrapper component
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    
    // Relative mouse coordinates from -1 to 1
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    
    // Limits rotation to maximum 12 degrees
    const rotateX = -y * 12;
    const rotateY = x * 12;
    
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-all duration-200 ease-out preserve-3d ${className}`}
      style={{
        transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);

  // Animated Welcome screen stages
  useEffect(() => {
    const timer1 = setTimeout(() => setIntroStep(1), 700);
    const timer2 = setTimeout(() => setIntroStep(2), 1600);
    const timer3 = setTimeout(() => setShowIntro(false), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="relative min-h-[90vh]">
      
      {/* 1. Blank Screen Tech Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#020205] z-[9999] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Morphing Neon 3D Sphere in Center */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 0.9, 1.1, 1],
                borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"],
                rotate: [0, 120, 360]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute w-72 h-72 bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 opacity-20 blur-3xl"
            />
            
            <div className="text-center space-y-6 z-10">
              <AnimatePresence mode="wait">
                {introStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex items-center justify-center"
                  >
                    <BrainCircuit className="w-16 h-16 text-indigo-500 animate-pulse" />
                  </motion.div>
                )}
                {introStep === 1 && (
                  <motion.h1
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase font-mono"
                  >
                    ROOMAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
                  </motion.h1>
                )}
                {introStep === 2 && (
                  <motion.p
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-semibold tracking-widest text-indigo-400 uppercase font-mono"
                  >
                    Loading secure neural environment...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Page Layout (Visible after Intro finishes) */}
      <div className="flex flex-col items-center justify-center text-center space-y-24 py-16 relative overflow-hidden">
        
        {/* Background dot pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-[#0A0A0A] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating gradient orbs */}
        <div className="absolute top-0 -z-10 h-full w-full flex justify-center pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-[100px] opacity-20"></div>
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-[120px] opacity-15"></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full blur-[100px] opacity-15"></div>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 max-w-5xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-5 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-lg">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span>Rooman AI Interviewer — Enterprise-Grade Interview Platform</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
            Ace Your Next<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
              Interview with AI.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
            A production-grade AI platform that simulates highly technical, role-specific interviews with real-time proctoring, face tracking, and data-driven feedback.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/login">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 group border-0 font-bold cursor-pointer">
                Start Interview 
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-full border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 font-semibold cursor-pointer">
                View Past Reports
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* 3D Floating Dashboard Card Visual */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl"
        >
          <TiltCard className="rounded-3xl border border-slate-200/50 dark:border-white/5 bg-slate-100/50 dark:bg-slate-950/60 p-2 shadow-2xl shadow-indigo-500/5 backdrop-blur-xl">
            <div className="bg-white dark:bg-[#0A0A0E] rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-white/5 text-left transform-style">
              {/* Window chrome header */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  <span>rooman-ai-interviewer.web.app</span>
                </div>
              </div>
              
              {/* Mock interview split pane */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Left: AI Interviewer */}
                <div className="bg-slate-950 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[190px] relative overflow-hidden border border-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 z-10">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <span className="text-sm font-bold text-white z-10">Sarah (AI Interviewer)</span>
                  <div className="flex items-end space-x-1 h-6">
                    <div className="w-1 h-3 bg-indigo-500 rounded animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-5 bg-indigo-500 rounded animate-bounce [animation-delay:0.3s]"></div>
                    <div className="w-1 h-2 bg-indigo-500 rounded animate-bounce [animation-delay:0.5s]"></div>
                    <div className="w-1 h-4 bg-indigo-500 rounded animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
                
                {/* Right: Candidate */}
                <div className="bg-slate-950 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[190px] relative overflow-hidden border border-slate-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 z-10">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white z-10">Candidate (You)</span>
                  <div className="flex items-center space-x-2 z-10">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Camera Active</span>
                  </div>
                </div>
              </div>
              
              {/* Captions */}
              <div className="mt-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                <p className="text-sm text-slate-700 dark:text-slate-300 italic text-center font-medium">
                  "Could you walk me through the distributed caching architecture you built at your previous role?"
                </p>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Feature Cards with 3D Tilt Effect */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-3 gap-6 w-full max-w-6xl"
        >
          {[
            { icon: <Bot className="w-6 h-6 text-blue-500" />, title: "Gemini-Powered", desc: "Utilizes advanced LLMs to generate contextual, non-repeating technical questions tailored to your resume and job description.", color: "from-blue-500/10 to-transparent" },
            { icon: <Target className="w-6 h-6 text-rose-500" />, title: "Ruthless Evaluation", desc: "Identifies exact knowledge gaps, logical flaws, and code inefficiencies with bluff detection and correction mode.", color: "from-rose-500/10 to-transparent" },
            { icon: <LineChart className="w-6 h-6 text-emerald-500" />, title: "Data-Driven Insights", desc: "Generates performance heatmaps, comprehensive scoring, and a custom learning roadmap for career growth.", color: "from-emerald-500/10 to-transparent" },
            { icon: <Code2 className="w-6 h-6 text-amber-500" />, title: "Role-Specific Depth", desc: "Adapts to your exact tech stack, years of experience, and interview focus with dynamic difficulty scaling.", color: "from-amber-500/10 to-transparent" },
            { icon: <Zap className="w-6 h-6 text-cyan-500" />, title: "Real-Time Experience", desc: "Live face-to-face interviews with voice recognition, AI proctoring, and real-time performance metrics.", color: "from-cyan-500/10 to-transparent" },
            { icon: <Sparkles className="w-6 h-6 text-purple-500" />, title: "Premium UI/UX", desc: "Designed with meticulous attention to typography, spacing, micro-interactions, and 3D visual elements.", color: "from-purple-500/10 to-transparent" }
          ].map((feature, idx) => (
            <TiltCard
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-white/5 shadow-xl hover:shadow-2xl text-left group overflow-hidden relative cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="p-8 relative z-10">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium">{feature.desc}</p>
              </div>
            </TiltCard>
          ))}
        </motion.div>

        {/* Stats Counter Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 10000, suffix: '+', label: 'Interviews Conducted', icon: <Users className="w-5 h-5 text-indigo-400" /> },
              { value: 95, suffix: '%', label: 'Accuracy Rate', icon: <Target className="w-5 h-5 text-emerald-400" /> },
              { value: 50, suffix: '+', label: 'Tech Stacks Supported', icon: <Code2 className="w-5 h-5 text-cyan-400" /> },
              { value: 99, suffix: '%', label: 'User Satisfaction', icon: <Award className="w-5 h-5 text-amber-400" /> },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300 shadow-lg"
              >
                <div className="flex justify-center mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
