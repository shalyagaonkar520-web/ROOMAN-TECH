import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Bot, Code2, Sparkles, ArrowRight, Zap, Target, LineChart } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-20 py-12 relative">
      
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-50 dark:bg-[#0A0A0A] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <div className="absolute top-0 -z-10 h-full w-full flex justify-center opacity-30 dark:opacity-20">
        <div className="w-[800px] h-[500px] bg-gradient-to-r from-blue-500 to-violet-500 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten animate-pulse-slow"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8 max-w-4xl"
      >
        <div className="inline-flex items-center space-x-2 glass-panel px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Junior AI Research Associate – 24 Hour AI Agent Challenge</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Master the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500">
             engineering interview.
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A production-grade AI platform that simulates highly technical, role-specific interviews and delivers actionable, data-driven feedback.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/setup">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-blue-500/25 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 group">
              Start Interview 
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/history">
            <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-full">
              View Past Reports
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-3 gap-6 w-full max-w-6xl"
      >
        {[
          { icon: <Bot className="w-6 h-6 text-blue-500" />, title: "Gemini-Powered", desc: "Utilizes advanced LLMs to generate contextual, non-repeating technical questions." },
          { icon: <Target className="w-6 h-6 text-indigo-500" />, title: "Ruthless Evaluation", desc: "Identifies exact knowledge gaps, logical flaws, and code inefficiencies." },
          { icon: <LineChart className="w-6 h-6 text-violet-500" />, title: "Data-Driven Insights", desc: "Generates performance heatmaps, comprehensive scoring, and a custom learning roadmap." },
          { icon: <Code2 className="w-6 h-6 text-emerald-500" />, title: "Role-Specific Depth", desc: "Adapts to your exact tech stack, years of experience, and interview focus." },
          { icon: <Zap className="w-6 h-6 text-amber-500" />, title: "Real-Time Experience", desc: "Built on a modern React, Vite, and FastAPI-inspired Express backend architecture." },
          { icon: <Sparkles className="w-6 h-6 text-pink-500" />, title: "Premium UI/UX", desc: "Designed with meticulous attention to typography, spacing, and micro-interactions." }
        ].map((feature, idx) => (
          <div key={idx} className="p-8 rounded-2xl glass-panel text-left group hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-200/50 dark:border-white/10 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
      
      {/* Demo UI Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl rounded-3xl glass-panel p-2 mt-12 overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-100 dark:bg-[#111] rounded-2xl p-6 md:p-10 text-left border border-slate-200/50 dark:border-white/5">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="space-y-4">
             <div className="h-4 w-1/4 bg-slate-200 dark:bg-white/10 rounded"></div>
             <div className="h-8 w-3/4 bg-slate-300 dark:bg-white/20 rounded"></div>
             <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded mt-8"></div>
             <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/10 rounded"></div>
             <div className="h-4 w-4/6 bg-slate-200 dark:bg-white/10 rounded"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
