import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Loader2, 
  Send, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, 
  ArrowRight, ShieldCheck, XCircle, AlertCircle, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const COMPANY_THEMES: Record<string, { bg: string, accent: string, border: string, text: string, gradient: string }> = {
  Google: { bg: 'bg-slate-950/80', accent: 'from-blue-600 to-indigo-600', border: 'border-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500/10 via-transparent to-transparent' },
  Microsoft: { bg: 'bg-slate-950/80', accent: 'from-teal-600 to-emerald-600', border: 'border-emerald-500/20', text: 'text-emerald-400', gradient: 'from-emerald-500/10 via-transparent to-transparent' },
  Amazon: { bg: 'bg-slate-950/80', accent: 'from-amber-600 to-orange-600', border: 'border-amber-500/20', text: 'text-amber-400', gradient: 'from-amber-500/10 via-transparent to-transparent' },
  NVIDIA: { bg: 'bg-slate-950/80', accent: 'from-green-600 to-emerald-600', border: 'border-green-500/20', text: 'text-green-400', gradient: 'from-green-500/10 via-transparent to-transparent' },
  OpenAI: { bg: 'bg-slate-950/80', accent: 'from-purple-600 to-pink-600', border: 'border-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500/10 via-transparent to-transparent' },
  Apple: { bg: 'bg-slate-950/80', accent: 'from-slate-700 to-slate-800', border: 'border-slate-500/20', text: 'text-slate-400', gradient: 'from-slate-500/10 via-transparent to-transparent' },
  Netflix: { bg: 'bg-slate-950/80', accent: 'from-red-600 to-rose-600', border: 'border-red-500/20', text: 'text-red-400', gradient: 'from-red-500/10 via-transparent to-transparent' }
};

export default function FaceToFaceInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [interview, setInterview] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [welcomeMessage, setWelcomeMessage] = useState(location.state?.welcome_message || '');
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [integrityLogs, setIntegrityLogs] = useState<{type: string, timestamp: string}[]>([]);
  
  // Zoom Call Page Metadata
  const [meetingTimer, setMeetingTimer] = useState(0);
  const [roundName, setRoundName] = useState('Onboarding verification');
  
  // F2F specific states
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isSTTListening, setIsSTTListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [candidateSubtitle, setCandidateSubtitle] = useState('');

  // Silence auto-submit refs & states
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  
  // Correction Mode States
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionData, setCorrectionData] = useState<any>(null);
  const [hasRetried, setHasRetried] = useState(false);

  // Dynamic Welcome Voice Check flow stages
  const [welcomeStage, setWelcomeStage] = useState<'active' | 'hear_check' | 'hear_voice'>('active');
  const hearCheckFailsRef = useRef(0);
  const [speechRate, setSpeechRate] = useState(1.0);

  const handleProceedVoiceFlow = () => {
    setWelcomeStage('active');
  };

  // Real-time AI Proctoring States
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [proctoringAlert, setProctoringAlert] = useState<string | null>(null);
  const [interviewPauseReason, setInterviewPauseReason] = useState<string | null>('Please enter Full Screen mode to start the interview.');

  // Tracking continuous durations (runs every 1200ms = 1.2s per frame)
  const noFaceFramesRef = useRef(0);
  const phoneFramesRef = useRef(0);
  const eyeDeviationFramesRef = useRef(0);

  // Real-time vocal/facial analysis metric scores
  const [metrics, setMetrics] = useState({
    wpm: 0,
    confidence: 100,
    eyeContact: 100,
    fillers: 0,
    fluency: 100
  });

  // Timer trackers for WPM calculation
  const [questionStartSeconds, setQuestionStartSeconds] = useState(0);

  // Refs for media streaming & face mesh animation
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const cocoModelRef = useRef<any>(null);
  const predictionsRef = useRef<any[]>([]);
  
  // Interval refs
  const faceMeshAnimationRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const integrityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const proctoringLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Asynchronously load TensorFlow.js and COCO-SSD from CDN
  useEffect(() => {
    async function loadModels() {
      try {
        if (!(window as any).tf) {
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
        }
        if (!(window as any).cocoSsd) {
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd");
        }
        
        const model = await (window as any).cocoSsd.load({ base: 'lite' });
        cocoModelRef.current = model;
        setIsModelLoading(false);
      } catch (err) {
        console.error("Failed to load proctoring models:", err);
        setIsModelLoading(false); // allow layout to render anyway
      }
    }
    loadModels();
    
    return () => {
      if (proctoringLoopRef.current) clearInterval(proctoringLoopRef.current);
    };
  }, []);

  function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  // 2. Initialize Zoom Call Meeting Timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setMeetingTimer(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // 3. Initialize camera stream
  useEffect(() => {
    async function startCamera() {
      try {
        if (cameraEnabled) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setCameraError(false);
        } else {
          stopCamera();
        }
      } catch (err) {
        console.warn("Webcam access failed:", err);
        setCameraError(true);
      }
    }
    startCamera();
    return () => stopCamera();
  }, [cameraEnabled]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // 4. Bounding Box & Face Mesh animation render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 480;
    let height = canvas.height = 360;
    let frame = 0;

    const faceCenter = { x: width / 2, y: height / 2 - 20 };
    const leftEye = { x: faceCenter.x - 35, y: faceCenter.y - 15 };
    const rightEye = { x: faceCenter.x + 35, y: faceCenter.y - 15 };
    
    function drawMesh() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      frame++;

      // 1. Draw Object Detection Bounding Boxes
      if (predictionsRef.current && predictionsRef.current.length > 0) {
        predictionsRef.current.forEach((pred: any) => {
          if (pred.score > 0.45) {
            const [x, y, w, h] = pred.bbox;
            // Draw box outline
            ctx.strokeStyle = pred.class === 'cell phone' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(34, 211, 238, 0.8)';
            ctx.lineWidth = pred.class === 'cell phone' ? 3 : 2;
            ctx.strokeRect(x, y, w, h);
            
            // Draw label background
            ctx.fillStyle = pred.class === 'cell phone' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 211, 238, 0.9)';
            ctx.font = 'bold 11px monospace';
            const label = `${pred.class.toUpperCase()} [${Math.round(pred.score * 100)}%]`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x, y - 18, textWidth + 10, 18);
            
            // Text label
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, x + 5, y - 5);
          }
        });
      }

      if (!cameraEnabled || cameraError) {
        faceMeshAnimationRef.current = requestAnimationFrame(drawMesh);
        return;
      }

      // 2. Draw Simulated Glowing cyan Face Landmarks lines
      const jitterX = Math.sin(frame * 0.05) * 1.5;
      const jitterY = Math.cos(frame * 0.08) * 1.5;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1;

      // Outer head mesh
      ctx.beginPath();
      const outerPoints = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const rx = 80 + Math.sin(frame * 0.02 + i) * 1;
        const ry = 100 + Math.cos(frame * 0.03 + i) * 1;
        const px = faceCenter.x + Math.cos(angle) * rx + jitterX;
        const py = faceCenter.y + Math.sin(angle) * ry + jitterY;
        outerPoints.push({ x: px, y: py });
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Connecting grid links
      ctx.beginPath();
      outerPoints.forEach((pt, i) => {
        if (i % 2 === 0) {
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(faceCenter.x + jitterX, faceCenter.y + 20 + jitterY);
        }
      });
      ctx.stroke();

      // Eyes tracking circles
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.beginPath();
      ctx.arc(leftEye.x + jitterX, leftEye.y + jitterY, 4, 0, Math.PI * 2);
      ctx.arc(rightEye.x + jitterX, rightEye.y + jitterY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Connect eyes
      ctx.beginPath();
      ctx.moveTo(leftEye.x + jitterX, leftEye.y + jitterY);
      ctx.lineTo(rightEye.x + jitterX, rightEye.y + jitterY);
      ctx.stroke();

      // Eyebrows
      ctx.beginPath();
      ctx.moveTo(leftEye.x - 15 + jitterX, leftEye.y - 12 + jitterY);
      ctx.lineTo(leftEye.x + 15 + jitterX, leftEye.y - 15 + jitterY);
      ctx.moveTo(rightEye.x - 15 + jitterX, rightEye.y - 15 + jitterY);
      ctx.lineTo(rightEye.x + 15 + jitterX, rightEye.y - 12 + jitterY);
      ctx.stroke();

      // Nose bridge and tip
      const noseTip = { x: faceCenter.x + jitterX, y: faceCenter.y + 25 + jitterY };
      ctx.beginPath();
      ctx.moveTo(faceCenter.x + jitterX, faceCenter.y - 10 + jitterY);
      ctx.lineTo(noseTip.x, noseTip.y);
      ctx.lineTo(noseTip.x - 12, noseTip.y + 8);
      ctx.lineTo(noseTip.x + 12, noseTip.y + 8);
      ctx.closePath();
      ctx.stroke();

      // Lips
      ctx.beginPath();
      const mouthWidth = 40 + Math.sin(frame * 0.05) * 1;
      ctx.ellipse(faceCenter.x + jitterX, faceCenter.y + 60 + jitterY, mouthWidth / 2, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pose node links (Neck, Shoulders)
      const neck = { x: faceCenter.x + jitterX, y: faceCenter.y + 110 + jitterY };
      const leftShoulder = { x: neck.x - 90, y: neck.y + 40 };
      const rightShoulder = { x: neck.x + 90, y: neck.y + 40 };

      ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
      ctx.beginPath();
      ctx.moveTo(neck.x, neck.y);
      ctx.lineTo(leftShoulder.x, leftShoulder.y);
      ctx.moveTo(neck.x, neck.y);
      ctx.lineTo(rightShoulder.x, rightShoulder.y);
      ctx.stroke();

      // Dot landmarks
      const points = [leftEye, rightEye, noseTip, neck, leftShoulder, rightShoulder];
      ctx.fillStyle = '#22d3ee';
      points.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x + (pt === leftEye || pt === rightEye || pt === noseTip || pt === neck ? jitterX : 0), pt.y + (pt === leftEye || pt === rightEye || pt === noseTip || pt === neck ? jitterY : 0), 3, 0, Math.PI * 2);
        ctx.fill();
      });

      faceMeshAnimationRef.current = requestAnimationFrame(drawMesh);
    }

    drawMesh();
    return () => {
      if (faceMeshAnimationRef.current) cancelAnimationFrame(faceMeshAnimationRef.current);
    };
  }, [cameraEnabled, cameraError]);

  // 5. Strict Proctoring Loop using TensorFlow & COCO-SSD
  useEffect(() => {
    if (isModelLoading || !cocoModelRef.current || !cameraEnabled || cameraError) return;

    proctoringLoopRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await cocoModelRef.current.detect(videoRef.current);
          predictionsRef.current = predictions;

          let personCount = 0;
          let phoneDetected = false;

          predictions.forEach((pred: any) => {
            if (pred.class === 'person' && pred.score > 0.5) {
              personCount++;
            }
            if (pred.class === 'cell phone' && pred.score > 0.45) {
              phoneDetected = true;
            }
          });

          // Evaluate violations
          if (personCount === 0) {
            noFaceFramesRef.current += 1;
            if (noFaceFramesRef.current >= 4) { // ~5 seconds
              triggerViolation('NO_FACE_5S', 'Your face is not visible. Please face the camera.', true);
            } else {
              triggerViolation('NO_PERSON_DETECTED', 'Proctoring Alert: No person detected in camera feed!');
            }
          } else {
            noFaceFramesRef.current = 0;
            if (personCount > 1) {
              triggerViolation('MULTIPLE_PEOPLE_DETECTED', 'Multiple people detected. Only the candidate should be visible.', true);
            }
          }

          if (phoneDetected) {
            phoneFramesRef.current += 1;
            if (phoneFramesRef.current >= 2) { // ~3 seconds
              triggerViolation('PHONE_DETECTED_3S', 'Mobile phone detected. Please remove the phone from the interview area.', true);
            } else {
              triggerViolation('PHONE_DETECTED', 'Proctoring Alert: Mobile phone device usage detected!');
            }
          } else {
            phoneFramesRef.current = 0;
          }

          // Evaluate Eye Contact based on bounding box centering
          const person = predictions.find((p: any) => p.class === 'person');
          if (person) {
            const [x, y, w, h] = person.bbox;
            const videoWidth = videoRef.current.videoWidth || 480;
            const centerX = x + w / 2;
            const deviation = Math.abs(centerX - videoWidth / 2) / videoWidth;
            
            if (deviation > 0.22) {
              eyeDeviationFramesRef.current += 1;
              setMetrics(m => ({ ...m, eyeContact: Math.max(20, m.eyeContact - 12) }));
              
              if (eyeDeviationFramesRef.current >= 6) { // ~8 seconds
                triggerViolation('LOOKING_AWAY_LONG', 'Please maintain eye contact with the camera.');
              } else if (Math.random() > 0.6) {
                triggerViolation('LOOKING_AWAY', 'Proctoring Warning: Face deviation detected. Please focus on the screen.');
              }
            } else {
              eyeDeviationFramesRef.current = 0;
              setMetrics(m => ({ ...m, eyeContact: Math.min(100, m.eyeContact + 4) }));
            }
          }
        } catch (e) {
          console.warn("Proctoring model inference failed:", e);
        }
      }
    }, 1200);

    return () => {
      if (proctoringLoopRef.current) clearInterval(proctoringLoopRef.current);
    };
  }, [isModelLoading, cameraEnabled, cameraError]);

  // Violation triggers
  const triggerViolation = (type: string, message: string, hardPause = false) => {
    if (hardPause) {
      setInterviewPauseReason(message);
    } else {
      setProctoringAlert(message);
    }
    
    setIntegrityLogs(prev => {
      // Avoid duplicate logs of the same type within 6 seconds
      const exists = prev.filter(log => log.type === type && (new Date().getTime() - new Date(log.timestamp).getTime()) < 6000);
      if (exists.length > 0) return prev;
      return [...prev, { type, timestamp: new Date().toISOString() }];
    });

    if (!hardPause) {
      setTimeout(() => {
        setProctoringAlert(prev => prev === message ? null : prev);
      }, 3200);
    }
  };

  // 6. Integrity window listeners
  useEffect(() => {
    const logTabViolation = (type: string, alertText: string) => {
      triggerViolation(type, alertText);
    };

    const handleVisibilityChange = () => { 
      if (document.hidden) {
        triggerViolation('TAB_SWITCH_OR_MINIMIZE', 'You have switched away from the interview. Please return to continue.', true);
      } 
    };
    const handleWindowBlur = () => { 
      triggerViolation('WINDOW_BLUR', 'You have switched away from the interview. Please return to continue.', true);
    };
    const handleFullscreenChange = () => { 
      if (!document.fullscreenElement) {
        triggerViolation('FULLSCREEN_EXIT', 'Please return to Full Screen Mode.', true);
      } 
    };

    const resetInactivityTimer = () => {
      if (integrityTimeoutRef.current) clearTimeout(integrityTimeoutRef.current);
      integrityTimeoutRef.current = setTimeout(() => {
        logTabViolation('LONG_INACTIVITY_DETECTED', 'Proctoring Warning: Long inactivity detected.');
      }, 5 * 60 * 1000); 
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      if (integrityTimeoutRef.current) clearTimeout(integrityTimeoutRef.current);
    };
  }, []);

  // 6.5 Fetch Interview Session by ID
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) throw new Error('Failed to fetch interview session');
        const data = await response.json();
        setInterview(data.interview);
        
        const mappedAnswers: Record<string, string> = {};
        data.answers.forEach((ans: any) => {
          mappedAnswers[ans.question_id] = ans.answer_text;
        });
        setAnswersMap(mappedAnswers);

        const loadedQuestions = data.questions;
        const unansweredIdx = loadedQuestions.findIndex((q: any) => !mappedAnswers[q.id]);
        
        if (unansweredIdx !== -1) {
          setCurrentQuestion(loadedQuestions[unansweredIdx]);
        } else if (loadedQuestions.length > 0) {
          setCurrentQuestion(loadedQuestions[loadedQuestions.length - 1]);
        }
      } catch (err) {
        setError('Failed to configure virtual meeting call.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchInterview();
    }
  }, [id]);

  // 7. Calculate real-time evaluation metrics from candidate answers
  useEffect(() => {
    if (isLoading || welcomeStage === 'hear_check') return;

    // Calculate dynamic WPM
    const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
    const activeSeconds = Math.max(5, meetingTimer - questionStartSeconds);
    const speedWpm = Math.floor((wordCount / activeSeconds) * 60);

    // Fluency & grammar drops based on fillers
    const calculatedFluency = Math.max(40, 100 - (metrics.fillers * 8));
    const calculatedConfidence = Math.round((metrics.eyeContact * 0.45) + (calculatedFluency * 0.55));

    setMetrics(prev => ({
      ...prev,
      wpm: speedWpm > 0 && speedWpm < 250 ? speedWpm : prev.wpm,
      fluency: calculatedFluency,
      confidence: calculatedConfidence
    }));
  }, [answer, meetingTimer, questionStartSeconds, isLoading, welcomeStage]);

  // Silence Auto-Submit monitor
  useEffect(() => {
    if (!isSTTListening || isSubmitting) {
      setSilenceCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
      
      const hasContent = candidateSubtitle.trim().length > 0 || answer.trim().length > 0;
      
      if (hasContent) {
        if (timeSinceLastSpeech >= 3000) {
          clearInterval(interval);
          setSilenceCountdown(null);
          
          if (welcomeStage === 'active') {
            handleSubmitResponse(false);
          }
        } else if (timeSinceLastSpeech >= 1500) {
          const remaining = Math.max(1, Math.ceil((3000 - timeSinceLastSpeech) / 1000));
          setSilenceCountdown(remaining);
        } else {
          setSilenceCountdown(null);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isSTTListening, isSubmitting, welcomeStage, candidateSubtitle, answer]);

  // 8. Onboarding first speech triggers
  useEffect(() => {
    if (isLoading || !interview) return;

    if (welcomeStage === 'active' && !subtitleText) {
      const name = (interview as any).candidate_name || "there";
      const introCheckText = `Hello ${name}! Good morning. My name is Sarah. I'll be your interviewer today representing ${interview.company}. I have carefully reviewed your resume and the job description. Let's begin. ${currentQuestion?.question_text || ''}`;
      setSubtitleText(introCheckText);
      speakText(introCheckText);
      setRoundName('Round 1: Technical Deep Dive');
    }
  }, [isLoading, welcomeStage, interview, currentQuestion]);

  const speakText = (text: string, rateOverride?: number, shouldListenAfter = true) => {
    if (!speechEnabled) return;
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/[*_`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rateOverride !== undefined ? rateOverride : speechRate;
    
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
    utterance.voice = goodVoice || voices.find(v => v.lang.startsWith('en')) || null;
    
    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => {
      setIsAISpeaking(false);
      if (shouldListenAfter) {
        startSpeechRecognition();
      }
    };
    utterance.onerror = () => setIsAISpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // 9. Strict Speech dictation functions
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isSTTListening) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsSTTListening(true);
      setCandidateSubtitle('');
      lastSpeechTimeRef.current = Date.now();
      setSilenceCountdown(null);
    };

    rec.onresult = (e: any) => {
      lastSpeechTimeRef.current = Date.now();
      setSilenceCountdown(null);
      
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const trans = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += trans + ' ';
        } else {
          interimTranscript += trans;
        }
      }
      const updatedText = finalTranscript || interimTranscript;
      setCandidateSubtitle(updatedText);
      setAnswer(prev => {
        const currentAnswer = (prev + finalTranscript).trim();
        const fillersFound = (updatedText.toLowerCase().match(/\b(uh|um|like|basically|actually)\b/g) || []).length;
        if (fillersFound > 0) {
          setMetrics(m => ({ ...m, fillers: m.fillers + fillersFound }));
        }
        return currentAnswer;
      });
    };

    rec.onerror = () => {
      setIsSTTListening(false);
    };

    rec.onend = () => {
      setIsSTTListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current && isSTTListening) {
      recognitionRef.current.stop();
    }
  };


  // 10. Submit Answer
  const handleSubmitResponse = async (forceNext = false) => {
    if (!answer.trim() && !forceNext) return;
    
    stopSpeechRecognition();
    setIsSubmitting(true);
    setError('');
    window.speechSynthesis.cancel();

    // Transcript Quality Intelligence check
    const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (!forceNext && wordCount < 4) {
       const phrases = [
         "I couldn't hear you clearly. Could you please repeat that?",
         "Could you please speak a little louder? I missed some words.",
         "There seems to be some background noise, could you say that again?",
         "I think I missed a few words. Could you repeat your last sentence?"
       ];
       const politePrompt = phrases[Math.floor(Math.random() * phrases.length)];
       setSubtitleText(politePrompt);
       speakText(politePrompt);
       
       setAnswer('');
       setCandidateSubtitle('');
       setIsSubmitting(false);
       // It will automatically resume listening because speakText's onEnd calls startSpeechRecognition
       return;
    }

    // Play a conversational thinking phrase
    const thinkingPhrases = [
      "Let me process your answer...",
      "Interesting. Let me think about that...",
      "Got it. Give me just a second...",
      "Okay, let me check your answer..."
    ];
    const thinkingText = thinkingPhrases[Math.floor(Math.random() * thinkingPhrases.length)];
    setSubtitleText(thinkingText);
    speakText(thinkingText, undefined, false);

    try {
      const response = await fetch(`/api/interviews/${id}/questions/${currentQuestion.id}/f2f-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answer_text: forceNext ? "Skipped correction retry." : answer,
          time_taken_seconds: meetingTimer - questionStartSeconds,
          force_next: forceNext
        })
      });

      if (!response.ok) throw new Error('API submission failed.');
      const data = await response.json();

      if (data.is_meta_command) {
        setAnswer('');
        setCandidateSubtitle('');
        
        const action = data.meta_action;
        const respText = data.meta_response || "I understand.";

        if (action === 'REPEAT' || action === 'REPHRASE') {
          const repeatText = `${respText} ${currentQuestion?.question_text || ""}`;
          setSubtitleText(repeatText);
          speakText(repeatText);
        } else if (action === 'WAIT') {
          setSubtitleText(respText);
          speakText(respText);
        } else if (action === 'SLOW_DOWN') {
          setSpeechRate(0.85);
          setSubtitleText(respText);
          speakText(respText, 0.85);
        } else if (action === 'PAUSE') {
          setSubtitleText(respText);
          speakText(respText);
          setInterviewPauseReason("Interview paused by candidate request.");
        } else {
          setSubtitleText(respText);
          speakText(respText);
        }
        return;
      }

      if (data.retry_allowed && !hasRetried && !forceNext) {
        setCorrectionData(data.evaluation);
        setShowCorrection(true);
        setHasRetried(true);
        
        const explanationSpeech = `I understand your thought process. However, there is one important concept missing: ${data.correction_explanation}. Would you like to try answering again?`;
        setSubtitleText(explanationSpeech);
        speakText(explanationSpeech);
      } else {
        setShowCorrection(false);
        setCorrectionData(null);
        setHasRetried(false);
        setAnswer('');
        setCandidateSubtitle('');
        setQuestionStartSeconds(meetingTimer);

        if (data.is_complete) {
          setRoundName('Round 5: Completing report...');
          const completeRes = await fetch(`/api/interviews/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ integrityLogs })
          });
          if (!completeRes.ok) throw new Error('Failed to compile report.');
          navigate(`/report/${id}`);
        } else {
          setAnswersMap(prev => ({ ...prev, [currentQuestion.id]: answer }));
          setCurrentQuestion(data.next_question);
          
          const orderIdx = data.next_question.order_idx;
          if (orderIdx === 3) setRoundName('Round 3: JD Target Skills');
          else if (orderIdx >= 4) setRoundName('Round 4: Architecture Challenge');
          
          const speechTextString = (data.next_question.transition_phrase ? data.next_question.transition_phrase + " " : "") + data.next_question.question_text;
          setSubtitleText(speechTextString);
          speakText(speechTextString);
        }
      }
    } catch (err) {
      setError('Connection failure. Please submit again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (integrityTimeoutRef.current) clearTimeout(integrityTimeoutRef.current);
      if (proctoringLoopRef.current) clearInterval(proctoringLoopRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Establishing secure call connections...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="max-w-md mx-auto text-center mt-20 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Error Connection Lost</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">{error}</p>
        <Button onClick={() => navigate('/setup')} className="w-full">Reconfigure Session</Button>
      </div>
    );
  }

  const theme = COMPANY_THEMES[interview?.company] || COMPANY_THEMES.Google;

  const handleResumeInterview = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setInterviewPauseReason(null);
        if (!cameraEnabled) setCameraEnabled(true);
      }).catch(err => console.error("Fullscreen error:", err));
    } else {
      setInterviewPauseReason(null);
      if (!cameraEnabled) setCameraEnabled(true);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none"
      onCopy={(e) => { e.preventDefault(); triggerViolation('COPY_ATTEMPT', 'Copying is disabled during the interview.'); }}
      onPaste={(e) => { e.preventDefault(); triggerViolation('PASTE_ATTEMPT', 'Pasting is disabled during the interview.'); }}
      onCut={(e) => { e.preventDefault(); triggerViolation('CUT_ATTEMPT', 'Cutting is disabled during the interview.'); }}
    >
      
      {/* Top Header Navigation Overlay */}
      <div className="bg-slate-900/80 border-b border-slate-800/60 backdrop-blur-md px-6 py-4 flex justify-between items-center z-20">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Live Video Conference Call</span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/10">
            {roundName}
          </span>
          {isModelLoading && (
            <span className="text-[10px] text-amber-400 font-semibold animate-pulse bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
              Loading AI Proctoring Models...
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-slate-400 text-sm font-semibold">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatTimer(meetingTimer)}</span>
          </div>
          
          <div className="text-xs font-semibold bg-white/5 border border-white/10 px-3 py-1 rounded-md text-slate-300">
            Round Limit: {interview?.num_questions || 5} questions
          </div>
        </div>
      </div>

      {/* Floating Proctoring Alert Overlay */}
      <AnimatePresence>
        {proctoringAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-red-600 text-white font-bold text-sm px-5 py-3.5 rounded-2xl flex items-center justify-center space-x-2.5 shadow-2xl border border-red-400/25">
              <ShieldAlert className="w-5 h-5 animate-bounce shrink-0" />
              <span>{proctoringAlert}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace split screen */}
      <div className="flex-1 grid md:grid-cols-2 gap-6 p-6 items-stretch">
        
        {/* Left Grid: AI Interviewer Sarah */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between min-h-[420px] bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent">
          {/* Mock office glass background visual */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="absolute top-12 left-24 w-44 h-44 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl" />

          {/* Sarah Top label bar */}
          <div className="p-6 flex justify-between items-center z-10">
            <span className="text-xs font-semibold px-3 py-1 bg-black/60 border border-white/5 rounded-full text-slate-300">
              Sarah (Interviewer)
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold bg-white/10 border ${theme.border} ${theme.text}`}>
              {interview?.company || 'Google'} Style
            </span>
          </div>

          {/* Visual card */}
          <div className="flex flex-col items-center justify-center text-center space-y-4 z-10 py-6">
            <div className="relative">
              <div className={`absolute -inset-4 rounded-full bg-gradient-to-tr ${theme.accent} opacity-20 blur-md transition-all duration-1000 ${isAISpeaking ? 'scale-125' : 'scale-100'}`} />
              <div className="w-32 h-32 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center relative overflow-hidden shadow-xl">
                <Sparkles className={`w-14 h-14 ${theme.text} ${isAISpeaking ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-white">Senior Engineering Manager</h3>
              <p className="text-slate-400 text-xs mt-0.5">{interview?.company} Tech Lead</p>
            </div>
            
            {/* Pulsing vocal lines indicator */}
            <div className="flex items-end space-x-1.5 justify-center h-8">
              <div className={`w-1 bg-indigo-500 rounded transition-all duration-300 ${isAISpeaking ? 'h-6 animate-bounce [animation-delay:0.1s]' : 'h-1.5'}`} />
              <div className={`w-1 bg-indigo-500 rounded transition-all duration-300 ${isAISpeaking ? 'h-8 animate-bounce [animation-delay:0.3s]' : 'h-1.5'}`} />
              <div className={`w-1 bg-indigo-500 rounded transition-all duration-300 ${isAISpeaking ? 'h-5 animate-bounce [animation-delay:0.5s]' : 'h-1.5'}`} />
              <div className={`w-1 bg-indigo-500 rounded transition-all duration-300 ${isAISpeaking ? 'h-7 animate-bounce [animation-delay:0.2s]' : 'h-1.5'}`} />
              <div className={`w-1 bg-indigo-500 rounded transition-all duration-300 ${isAISpeaking ? 'h-4 animate-bounce [animation-delay:0.4s]' : 'h-1.5'}`} />
            </div>
          </div>

          {/* Under-video live closed captions block */}
          <div className="p-6 w-full z-10">
            <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-h-[90px] flex items-center justify-center shadow-lg">
              <p className="text-sm font-semibold text-center text-slate-100 leading-relaxed italic">
                {subtitleText || "Establishing voice stream..."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Grid: Candidate (webcam feed + Face Mesh simulation) */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between min-h-[420px] bg-slate-950">
          
          {/* Webcam stream */}
          {cameraEnabled && !cameraError && (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-500"
            />
          )}

          {/* Canvas Draw layer overlay for simulated FaceMesh */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 opacity-80"
          />

          {/* Render mock UI placeholder when camera disabled */}
          {(!cameraEnabled || cameraError) && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 z-10 p-6 absolute inset-0 bg-slate-900/60 backdrop-blur-sm">
              <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center shadow-lg relative">
                <div className={`absolute inset-0 rounded-full border border-indigo-500/20 animate-ping ${isSTTListening ? 'block' : 'hidden'}`} />
                <Mic className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-200">Candidate (You)</h4>
                <p className="text-xs text-slate-500">Camera stream active (Wireframe mesh rendering)</p>
              </div>
            </div>
          )}

          {/* Overlay UI: Live vocal metrics gauges */}
          <div className="absolute top-6 left-6 right-6 grid grid-cols-4 gap-3 z-20 pointer-events-none">
            
            {/* Gauge: Confidence */}
            <div className="bg-slate-950/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Confidence</span>
              <div className="flex items-baseline space-x-0.5 mt-1">
                <span className="text-sm font-extrabold text-indigo-400">{metrics.confidence}</span>
                <span className="text-[10px] text-slate-400">%</span>
              </div>
            </div>

            {/* Gauge: Eye Contact */}
            <div className="bg-slate-950/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Eye Contact</span>
              <div className="flex items-baseline space-x-0.5 mt-1">
                <span className="text-sm font-extrabold text-cyan-400">{Math.floor(metrics.eyeContact)}</span>
                <span className="text-[10px] text-slate-400">%</span>
              </div>
            </div>

            {/* Gauge: Speech Speed */}
            <div className="bg-slate-950/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Speech Speed</span>
              <div className="flex items-baseline space-x-0.5 mt-1">
                <span className="text-sm font-extrabold text-purple-400">{metrics.wpm}</span>
                <span className="text-[9px] text-slate-400">WPM</span>
              </div>
            </div>

            {/* Gauge: Filler Words */}
            <div className="bg-slate-950/85 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Filler Words</span>
              <div className="flex items-baseline space-x-0.5 mt-1">
                <span className="text-sm font-extrabold text-rose-400">{metrics.fillers}</span>
                <span className="text-[9px] text-slate-400">found</span>
              </div>
            </div>
          </div>

          {/* Under candidate caption transcript display */}
          <div className="p-6 w-full z-10">
            <div className="bg-slate-950/90 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-h-[90px] flex items-center justify-center shadow-lg">
              <p className="text-sm font-semibold text-center text-slate-300 leading-relaxed italic">
                {candidateSubtitle ? `You: "${candidateSubtitle}"` : "Vocal dictation active..."}
              </p>
            </div>
          </div>

          {/* Bottom left tools */}
          <div className="absolute bottom-6 left-6 flex space-x-2 z-20">
            <button 
              onClick={() => setCameraEnabled(prev => {
                if (prev) {
                  triggerViolation('CAMERA_OFF', 'Camera is required for this interview.', true);
                }
                return !prev;
              })}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
            >
              {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-400" />}
            </button>
            <button 
              onClick={() => setSpeechEnabled(prev => !prev)}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/10"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Control panel & Action overrides */}
      <div className="p-6 bg-slate-900 border-t border-slate-800/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left indicator: current status */}
          <div className="flex items-center space-x-3">
            <div className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSTTListening ? 'bg-red-400' : isAISpeaking ? 'bg-indigo-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSTTListening ? 'bg-red-500' : isAISpeaking ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
            </div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 font-mono">
              {isSTTListening ? 'Microphone Active (Listening...)' : isAISpeaking ? 'Interviewer Speaking...' : 'Secure Wait state'}
            </span>
            {silenceCountdown !== null && (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/30 px-2.5 py-1 rounded-full animate-pulse border border-amber-500/20 font-mono shrink-0">
                Auto-submitting in {silenceCountdown}s...
              </span>
            )}
          </div>

          {/* Right Action buttons based on flow stage */}
          <div className="flex space-x-3 w-full md:w-auto text-black">
            {welcomeStage !== 'active' ? (
              <Button
                onClick={handleProceedVoiceFlow}
                disabled={isSubmitting}
                className="w-full md:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 py-3 flex items-center justify-center font-bold"
              >
                <span>Proceed Conversation</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : showCorrection && correctionData ? (
              <div className="flex space-x-3 w-full">
                <Button 
                  onClick={() => {
                    setShowCorrection(false);
                    setAnswer('');
                    setCandidateSubtitle('');
                  }}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 py-3 font-bold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubmitResponse(true)}
                  isLoading={isSubmitting}
                  className="flex-1 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 py-3 font-bold"
                >
                  Skip & Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleSubmitResponse(false)}
                isLoading={isSubmitting}
                disabled={!answer.trim() || isSubmitting}
                className="w-full md:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 py-3 flex items-center justify-center font-bold"
              >
                <span>Finish Speaking & Submit</span>
                <Send className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating full correction detail panel when active */}
      <AnimatePresence>
        {showCorrection && correctionData && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-6 right-6 max-w-4xl mx-auto z-30"
          >
            <Card className="border border-red-500/30 bg-slate-900/95 backdrop-blur-md shadow-2xl relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-3 text-red-400">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <h3 className="font-extrabold text-base">Correction feedback:</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                  {correctionData.correction_explanation}
                </p>
                {correctionData.correction_example && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{correctionData.correction_example}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {interviewPauseReason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-slate-900 border border-red-500/30 shadow-2xl rounded-3xl p-8 text-center flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Interview Paused</h2>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {interviewPauseReason}
                </p>
              </div>
              <Button 
                onClick={handleResumeInterview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25"
              >
                Resume Interview & Enter Full Screen
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
