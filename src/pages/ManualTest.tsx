import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function ManualTest() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative z-10"
      >
        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <ClipboardList className="w-12 h-12" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Manual Testing Interface
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
          The manual assessment and technical screening module is currently under construction. 
          Soon, you'll be able to take timed coding tests, multiple-choice quizzes, and submit written answers.
        </p>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg px-8 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
