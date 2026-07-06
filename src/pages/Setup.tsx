import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { BrainCircuit, Settings2, AlertCircle, FileText, Upload, Briefcase, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

import { useAuth } from '../contexts/AuthContext';

const ROLES = [

  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'Engineering Manager'
];

const EXPERIENCE = [
  'Entry Level (0-2 years)',
  'Mid Level (3-5 years)',
  'Senior (5-8 years)',
  'Staff/Principal (8+ years)'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];
const TYPES = ['Technical', 'System Design', 'Behavioral', 'Mixed'];

const setupSchema = z.object({
  role: z.string(),
  yearsExperience: z.string(),
  difficulty: z.string(),
  interviewType: z.string(),
  programmingLanguage: z.string().min(2, 'Please enter a primary language'),
  skills: z.string().min(5, 'Please list some specific skills to test'),
  numQuestions: z.number().min(3).max(10),
  resumeText: z.string().optional(),
  jdText: z.string().optional(),
  mode: z.enum(['premium', 'face_to_face']),
  company: z.string().optional(),
  candidateName: z.string().min(1, 'Please enter your name')
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorData, setErrorData] = useState<any>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isParsingJD, setIsParsingJD] = useState(false);
  const [resumeAtsScore, setResumeAtsScore] = useState<number | null>(null);

  // Automatic role detection & Loading overlays states
  const [detectedInfo, setDetectedInfo] = useState<any>(null);
  const [showDetectionOverlay, setShowDetectionOverlay] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [loadingStepsTexts] = useState([
    'Checking Resume...',
    'Analyzing Projects...',
    'Analyzing Skills...',
    'Analyzing Job Description...',
    'Matching Skills...',
    'Creating Interview Plan...',
    'Generating Questions...',
    'Preparing Interview...'
  ]);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      role: 'Full Stack Engineer',
      yearsExperience: 'Mid Level (3-5 years)',
      difficulty: 'Medium',
      interviewType: 'Technical',
      programmingLanguage: 'TypeScript',
      skills: 'React, Node.js, System Design',
      numQuestions: 5,
      resumeText: '',
      jdText: '',
      mode: 'premium',
      company: 'Google',
      candidateName: ''
    }
  });

  const resumeText = watch('resumeText');
  const jdText = watch('jdText');

  const mutation = useMutation({
    mutationFn: async (data: SetupForm) => {
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: user?.uid, email: user?.email })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate interview');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.mode === 'face_to_face') {
        navigate(`/interview/f2f/${data.id}`, { state: { welcome_message: data.welcome_message } });
      } else {
        navigate(`/interview/${data.id}`);
      }
    },
    onError: (error: Error) => {
      setErrorData({ raw: error.message });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'resume') setIsParsingResume(true);
    else setIsParsingJD(true);
    setErrorData(null);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('resume', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        let errObj: any = { raw: `HTTP ${response.status}: ${response.statusText}` };
        try {
          const parsed = await response.json();
          errObj = {
             step: parsed.step || 'Unknown Backend Step',
             reason: parsed.error || 'Server crashed silently',
             fix: parsed.step === 'Groq API Error' ? 'Check your GROQ_API_KEY in Vercel settings.' : 'Check the resume file format.'
          };
        } catch (e) {}
        throw errObj;
      }
      const data = await response.json();
      const extractedName = data.candidateName || data.candidate_name || data.name || data.CandidateName;
      const { text, role, yearsExperience, programmingLanguage, skills } = data;
      const atsScoreVal = data.atsScore !== undefined ? data.atsScore : data.ats_score;
      
      if (type === 'resume') {
        setValue('resumeText', text);
        if (role) setValue('role', role);
        if (yearsExperience) setValue('yearsExperience', yearsExperience);
        if (programmingLanguage) setValue('programmingLanguage', programmingLanguage);
        if (skills) setValue('skills', skills);
        if (extractedName) setValue('candidateName', extractedName);
        if (atsScoreVal !== undefined && atsScoreVal !== null) {
          setResumeAtsScore(Number(atsScoreVal));
        }

        if (watch('jdText') || watch('mode') === 'face_to_face') {
          setDetectedInfo({
            role: role || watch('role'),
            yearsExperience: yearsExperience || watch('yearsExperience'),
            programmingLanguage: programmingLanguage || watch('programmingLanguage'),
            skills: skills || watch('skills')
          });
          setShowDetectionOverlay(true);
        }
      } else {
        setValue('jdText', text);

        if (watch('resumeText')) {
          setDetectedInfo({
            role: watch('role'),
            yearsExperience: watch('yearsExperience'),
            programmingLanguage: watch('programmingLanguage'),
            skills: watch('skills')
          });
          setShowDetectionOverlay(true);
        }
      }
    } catch (err: any) {
      setErrorData(err.step ? err : { raw: err.message || 'Failed to upload document' });
    } finally {
      if (type === 'resume') setIsParsingResume(false);
      else setIsParsingJD(false);
    }
  };

  const onSubmit = (data: SetupForm) => {
    setErrorData(null);
    
    // Start loading check list sequence
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev >= loadingStepsTexts.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setLoadingStep(null);
            mutation.mutate(data);
          }, 300);
          return prev;
        }
        return prev + 1;
      });
    }, 450);
  };

  const handleContinueWithDetected = () => {
    setShowDetectionOverlay(false);
    const currentValues = watch();
    onSubmit(currentValues);
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-20 w-full px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Configure Premium Interview</h1>
        <p className="text-slate-500 dark:text-slate-400">Set the parameters for your AI-generated technical assessment. Upload a resume and Job Description for personalized tailoring.</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Module 1 & 2: Resume & JD Upload */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-panel border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Upload Resume</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">PDF or DOCX. Used to analyze your match and tailor questions to your experience.</p>
              
              <div className="w-full relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileUpload(e, 'resume')}
                  disabled={isParsingResume}
                />
                <Button type="button" className="w-full pointer-events-none" variant="outline" disabled={isParsingResume}>
                  {isParsingResume ? 'Parsing...' : resumeText ? 'Resume Uploaded ✓' : 'Select Resume File'}
                </Button>
              </div>

              {resumeAtsScore !== null && (
                <div className="mt-4 p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-full text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted ATS Score</span>
                  <h4 className="text-2xl font-black text-indigo-400 mt-1 animate-pulse">{resumeAtsScore}/100</h4>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Upload Job Description</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">PDF or DOCX. We will generate highly targeted questions strictly based on JD keywords.</p>
              
              <div className="w-full relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileUpload(e, 'jd')}
                  disabled={isParsingJD}
                />
                <Button type="button" className="w-full pointer-events-none" variant="outline" disabled={isParsingJD}>
                  {isParsingJD ? 'Parsing...' : jdText ? 'JD Uploaded ✓' : 'Select JD File'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel border-0 shadow-xl">
          <CardContent className="p-8 md:p-10">
            {/* Candidate Name Input */}
            <div className="mb-8 space-y-3">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider block">What should I call you?</label>
              <Controller
                name="candidateName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Enter your name (e.g. Shalya)"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  />
                )}
              />
              {errors.candidateName && <p className="text-xs text-red-500">{errors.candidateName.message}</p>}
              {watch('candidateName') && resumeText && (
                <p className="text-xs text-green-500 font-semibold mt-1">✓ Name automatically extracted from your resume!</p>
              )}
            </div>

            {/* Mode Selection */}
            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider block mb-4">Choose Interview Experience</label>
              <Controller
                name="mode"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => field.onChange('premium')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        field.value === 'premium'
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <h4 className="font-bold text-base mb-1 text-slate-900 dark:text-white">Standard Premium</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Structured Q&A with real-time text evaluations & reports.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange('face_to_face')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        field.value === 'face_to_face'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-black hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <h4 className="font-bold text-base mb-1 text-slate-900 dark:text-white">Virtual Face-to-Face</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Voice-enabled AI avatar interviewer simulating a real FAANG interview.</p>
                    </button>
                  </div>
                )}
              />
            </div>



            <div className="grid md:grid-cols-2 gap-8">
              {/* Role */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Target Role</label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-2">
                      <select {...field} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                />
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Years of Experience</label>
                <Controller
                  name="yearsExperience"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-2">
                      <select {...field} className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none">
                        {EXPERIENCE.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  )}
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Difficulty Level</label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          className={`h-11 px-4 rounded-xl border text-sm font-medium transition-all ${
                            field.value === d 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Interview Type */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Interview Type</label>
                <Controller
                  name="interviewType"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {TYPES.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field.onChange(t)}
                          className={`h-11 px-2 rounded-xl border text-xs font-medium transition-all ${
                            field.value === t 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="h-px w-full bg-slate-200/50 dark:bg-white/10 my-8" />

            {/* Custom inputs */}
            <div className="space-y-6"> 
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Primary Programming Language</label>
                <Controller
                  name="programmingLanguage"
                  control={control}
                  render={({ field }) => (
                    <input 
                      {...field} 
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="e.g., Python, TypeScript, Java"
                    />
                  )}
                />
                {errors.programmingLanguage && <p className="text-red-500 text-xs">{errors.programmingLanguage.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">Specific Frameworks or Skills to Test</label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <textarea 
                      {...field} 
                      className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="e.g., React internals, Distributed systems, PyTorch, GraphQL..."
                    />
                  )}
                />
                {errors.skills && <p className="text-red-500 text-xs">{errors.skills.message}</p>}
              </div>
            </div>

            {errorData && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-start border border-red-200 dark:border-red-500/20 mt-6 flex-col w-full">
                <div className="flex items-center font-bold mb-3">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0" /> Error Occurred
                </div>
                {errorData.step ? (
                  <div className="w-full text-xs space-y-2 bg-black/5 dark:bg-black/20 p-3 rounded-lg border border-red-500/10">
                    <p><span className="font-bold opacity-80 uppercase tracking-wider text-[10px] block mb-0.5">Current Step</span> <span className="text-sm">{errorData.step}</span></p>
                    <p><span className="font-bold opacity-80 uppercase tracking-wider text-[10px] block mb-0.5 mt-2">Reason</span> <span className="text-sm">{errorData.reason}</span></p>
                    <p><span className="font-bold opacity-80 uppercase tracking-wider text-[10px] block mb-0.5 mt-2">Suggested Fix</span> <span className="text-sm">{errorData.fix}</span></p>
                  </div>
                ) : (
                  <p className="ml-8">{errorData.raw}</p>
                )}
              </div>
            )}

            <div className="mt-8">
              <Button 
                type="submit"
                className="w-full h-14 text-lg rounded-xl shadow-lg shadow-blue-500/25 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200" 
                isLoading={mutation.isPending}
              >
                {mutation.isPending 
                  ? 'Analyzing Resume & JD, Designing Plan...' 
                  : watch('mode') === 'face_to_face' 
                    ? 'Start AI Face-to-Face Interview' 
                    : 'Start Premium Interview'}
              </Button>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                <Settings2 className="w-3 h-3 inline mr-1 mb-0.5"/>
                This process may take 15-30 seconds as the AI generates complex, tailored questions based on your resume and JD.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Role Detection Overlay Dialog */}
      {showDetectionOverlay && detectedInfo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-40 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-xl">Automatic Role Detected</h3>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              I have analyzed your resume and the job description. I believe you are interviewing for this role:
            </p>

            <div className="p-5 rounded-2xl bg-black/40 border border-slate-800 space-y-4 mb-6">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Detected Title</span>
                <h4 className="font-extrabold text-lg text-white mt-0.5">{detectedInfo.role}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Experience level</span>
                  <p className="text-sm text-slate-300 font-semibold mt-0.5">{detectedInfo.yearsExperience}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Core language</span>
                  <p className="text-sm text-slate-300 font-semibold mt-0.5">{detectedInfo.programmingLanguage}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Identified skills</span>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{detectedInfo.skills}</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs mb-8">
              Would you like to continue with these settings, or change them manually?
            </p>

            <div className="flex space-x-3">
              <Button 
                type="button" 
                onClick={handleContinueWithDetected}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 py-3 font-semibold"
              >
                Continue
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDetectionOverlay(false)}
                className="flex-1 rounded-xl border-slate-800 text-slate-300 hover:bg-slate-800 py-3 font-semibold"
              >
                Change Role
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pre-Interview Loading Checklist Overlay */}
      {loadingStep !== null && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center z-50 p-6 text-white select-none">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-blue-500/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <BrainCircuit className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight uppercase text-indigo-400 tracking-wider">AI Setup Engine</h2>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${((loadingStep + 1) / loadingStepsTexts.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {loadingStepsTexts.map((text, idx) => {
                const isDone = idx < loadingStep;
                const isActive = idx === loadingStep;

                return (
                  <div 
                    key={text} 
                    className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-200 ${
                      isActive ? 'text-white translate-x-2' : 
                      isDone ? 'text-slate-500' : 'text-slate-700'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
