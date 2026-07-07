import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('hasSpokenWelcome')) {
        const msg = new SpeechSynthesisUtterance("Welcome to Rooman Technologies");
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
        sessionStorage.setItem('hasSpokenWelcome', 'true');
      }
    } catch (e) {
      console.warn("Speech synthesis failed or blocked by browser");
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Cinematic Background Glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="relative z-10 flex flex-col items-center justify-center space-y-4"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-2xl">
              ROOMAN<span className="text-indigo-500">.</span>AI
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="text-slate-400 text-xl md:text-2xl font-light tracking-widest"
            >
              ELEVATING POTENTIAL
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
