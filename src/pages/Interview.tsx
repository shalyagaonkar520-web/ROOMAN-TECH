import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Loader2, Clock, HelpCircle, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 mins per question
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [integrityLogs, setIntegrityLogs] = useState<{type: string, timestamp: string}[]>([]);

  const currentQuestion = questions[currentIndex];
  const isAnswered = currentQuestion && answersMap[currentQuestion.id];

  // Integrity Monitoring
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const logIntegrityEvent = (type: string) => {
      setIntegrityLogs(prev => [...prev, { type, timestamp: new Date().toISOString() }]);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logIntegrityEvent('TAB_SWITCH_OR_MINIMIZE');
      }
    };

    const handleWindowBlur = () => {
      logIntegrityEvent('WINDOW_BLUR');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logIntegrityEvent('FULLSCREEN_EXIT');
      }
    };

    // Inactivity tracking
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logIntegrityEvent('LONG_INACTIVITY_DETECTED');
      }, 5 * 60 * 1000); // 5 minutes of no mouse/keyboard
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) {
          let backendError = 'Failed to fetch interview session';
          try {
            const errJson = await response.json();
            backendError += `: ${errJson.error || errJson.message || JSON.stringify(errJson)}`;
          } catch (e) {
            backendError += ` (HTTP ${response.status}: ${response.statusText})`;
          }
          throw new Error(backendError);
        }
        const data = await response.json();
        setInterview(data.interview);
        setQuestions(data.questions);
        
        const mapped: Record<string, string> = {};
        data.answers.forEach((a: any) => {
          mapped[a.question_id] = a.answer_text;
        });
        setAnswersMap(mapped);
        
        const firstUnanswered = data.questions.findIndex((q: any) => !mapped[q.id]);
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered);
        } else if (data.questions.length > 0) {
          setCurrentIndex(data.questions.length - 1);
        }
      } catch (err: any) {
        console.error('Interview load error:', err);
        setError(`Failed to load interview session: ${err.message || String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  useEffect(() => {
    if (currentQuestion) {
      setAnswer(answersMap[currentQuestion.id] || '');
      setTimeRemaining(15 * 60); 
    }
  }, [currentIndex, currentQuestion, answersMap]);

  useEffect(() => {
    if (isAnswered || isLoading || !currentQuestion) return;
    
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAnswered, isLoading, currentQuestion]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/interviews/${id}/questions/${currentQuestion.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_text: answer, time_taken_seconds: 15 * 60 - timeRemaining }),
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      
      setAnswersMap(prev => ({ ...prev, [currentQuestion.id]: answer }));
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Complete interview and send integrity logs
      const response = await fetch(`/api/interviews/${id}/complete`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrityLogs })
      });
      if (!response.ok) throw new Error('Failed to complete interview');
      navigate(`/report/${id}`);
    } catch (err) {
      setError('Failed to generate report');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!interview || questions.length === 0) {
    return <div className="text-center text-red-500 mt-20">Interview not found.</div>;
  }

  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-20 px-4">
      
      {integrityLogs.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-3 flex items-center text-sm text-red-600 dark:text-red-400">
          <ShieldAlert className="w-4 h-4 mr-2" />
          Integrity warning: Focus lost detected. This will be noted in the final report.
        </div>
      )}

      {/* Header / Progress */}
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Question {currentIndex + 1} of {questions.length}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded">
                {currentQuestion.topic}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                currentQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                currentQuestion.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>
          </div>
          
          {!isAnswered && (
            <div className={`flex items-center space-x-1.5 font-mono text-sm font-medium px-3 py-1 rounded-full border ${timeRemaining < 120 ? 'text-red-600 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20' : 'text-slate-600 border-slate-200 bg-white dark:text-slate-300 dark:border-slate-800 dark:bg-black'}`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
          <div 
            className="bg-blue-500 h-1 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Question Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="glass-panel border-0 shadow-lg">
            <div className="p-8 border-b border-slate-200/50 dark:border-white/10">
               <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed font-medium">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                   {currentQuestion.question_text}
                 </ReactMarkdown>
               </div>
            </div>
            
            <CardContent className="p-0 flex flex-col relative">
              <textarea
                className="w-full min-h-[300px] p-8 bg-transparent border-0 focus:ring-0 resize-y text-slate-700 dark:text-slate-300 text-base leading-relaxed placeholder:text-slate-400/70 font-mono outline-none disabled:opacity-50"
                placeholder="Write your technical answer here. Use Markdown if you like (e.g., ```javascript). Focus on depth, architecture, and edge cases..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isSubmitting || !!isAnswered}
                
              />
              
            </CardContent>
          </Card>
          
          
        </motion.div>
      </AnimatePresence>

      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

      <div className="flex justify-between items-center pt-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentIndex(prev => prev - 1)}
          disabled={currentIndex === 0 || isSubmitting}
          className="rounded-xl border-slate-300 dark:border-slate-700"
        >
          Previous
        </Button>
        
        <div className="flex space-x-3">
          {!isAnswered ? (
            <Button 
              onClick={handleSubmit} 
              isLoading={isSubmitting}
              disabled={!answer.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8"
            >
              Submit Answer
            </Button>
          ) : currentIndex === questions.length - 1 ? (
            <Button onClick={handleFinish} isLoading={isSubmitting} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8 group">
              Complete Interview
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex(prev => prev + 1)} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 px-8 group">
              Next Question
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
