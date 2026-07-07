import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, CheckCircle2, ChevronRight, Briefcase, Zap, AlertCircle, 
  Download, ArrowRight, TrendingUp, Sparkles, User, GraduationCap, Link2, 
  Code, Award, MapPin, DollarSign, Target 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { generatePdfCoverLetter } from '../utils/documentGenerator';
import { useAuth } from '../contexts/AuthContext';

const JOB_ROLES = [
  'Software Engineer', 'Java Developer', 'Python Developer', 'Full Stack Developer',
  'Frontend Developer', 'Backend Developer', 'AI Engineer', 'ML Engineer',
  'Data Scientist', 'DevOps Engineer', 'Cloud Engineer', 'Cyber Security Engineer',
  'Mobile App Developer', 'UI/UX Designer', 'Product Manager', 'Business Analyst', 'QA Engineer'
];

export default function CareerAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [targetRole, setTargetRole] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [atsData, setAtsData] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Optimization details
  const [optDetails, setOptDetails] = useState({
    linkedin: '', github: '', portfolio: '', expectedSalary: '', 
    preferredLocation: '', careerObjective: ''
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStep(2); // Extraction progress

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('type', 'resume');

    try {
      // Step 1: Upload and get text
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.success) {
        // We already extract in /api/upload using extractResumeDetails if type='resume'
        // Let's use the new career/extract explicitly to ensure 11 fields.
        const extractRes = await fetch('/api/career/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: uploadData.text })
        });
        const extracted = await extractRes.json();
        setParsedResume(extracted);
        setTimeout(() => setStep(3), 1000);
      } else {
        alert(uploadData.message);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to parse resume');
      setStep(1);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    setTargetRole(role);
    navigate('/setup', { state: { optimizedResume: parsedResume, targetRole: role } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10">
        


        <AnimatePresence mode="wait">
          
          {/* STEP 1: UPLOAD RESUME */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">AI Career Assistant</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                  Upload your resume and let our AI optimize it for ATS, match you with target roles, and prepare you for interviews.
                </p>
              </div>
              
              <div 
                className="max-w-xl mx-auto border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 text-center bg-white dark:bg-slate-900 hover:border-indigo-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">Upload your Resume</h3>
                <p className="text-slate-500 text-sm mb-6">PDF, DOCX up to 5MB</p>
                <Button variant="primary" className="mx-auto">Browse Files</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: EXTRACTION PROGRESS */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center">
              <div className="w-24 h-24 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" />
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Extracting Insights...</h2>
              <div className="space-y-3 text-left">
                {['Name & Contact', 'Skills & Technologies', 'Experience & Projects', 'Education & Certifications'].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.5 }}
                    className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: ROLE SELECTION */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-3 dark:text-white">What role are you targeting?</h2>
                <p className="text-slate-500">We'll analyze your resume against industry ATS standards for this specific role.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <input 
                  type="text" 
                  placeholder="Search roles (e.g., Frontend Developer)" 
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 mb-6 text-lg dark:text-white"
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                />
                
                <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto pb-4">
                  {JOB_ROLES.filter(r => r.toLowerCase().includes(searchRole.toLowerCase())).map((role) => (
                    <button 
                      key={role}
                      onClick={() => handleRoleSelection(role)}
                      className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
                  <Button variant="outline" onClick={() => handleRoleSelection('General Software Engineer')}>
                    Skip for now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}



        </AnimatePresence>
      </div>
    </div>
  );
}
