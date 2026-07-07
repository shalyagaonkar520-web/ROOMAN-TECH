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

  const handleRoleSelection = async (role: string) => {
    setTargetRole(role);
    setStep(4);
    setIsEvaluating(true);
    
    try {
      const res = await fetch('/api/career/evaluate-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedResume, targetRole: role })
      });
      const data = await res.json();
      setAtsData(data);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate ATS score');
      setStep(3);
    } finally {
      setIsEvaluating(false);
    }
  };

  const generateCoverLetterFlow = async () => {
    try {
      const res = await fetch('/api/career/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          optimizedResume: parsedResume, 
          targetRole, 
          targetCompany: 'Target Company',
          userId: user?.uid
        })
      });
      const data = await res.json();
      setCoverLetter(data.coverLetterText);
      alert('Cover Letter Generated! You can now download it.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartInterview = () => {
    navigate('/setup', { state: { optimizedResume: parsedResume, targetRole } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Upload</span>
            <span>Target Role</span>
            <span>ATS Check</span>
            <span>Optimize</span>
            <span>Result</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-indigo-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 9) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

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

          {/* STEP 4: ANALYZING ATS */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center mt-20">
              <div className="w-24 h-24 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" />
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Scanning ATS Patterns...</h2>
              <p className="text-slate-500">Comparing your resume against thousands of successful {targetRole} applications.</p>
            </motion.div>
          )}

          {/* STEP 5: ATS DASHBOARD */}
          {step === 5 && atsData && (
            <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold dark:text-white mb-2">ATS Analysis Report</h2>
                  <p className="text-slate-500">Targeting: <span className="font-semibold text-indigo-500">{targetRole}</span></p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/30 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-black text-indigo-500 mb-2">{atsData.atsScore}/100</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">ATS Score</div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-black text-emerald-500 mb-2">{atsData.resumeMatchPercentage}%</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Role Match</div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-amber-100 dark:border-amber-900/30 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-black text-amber-500 mb-2">{atsData.hiringProbability}%</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Hiring Probability</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <Card className="bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-500"/> Strengths</h3>
                    <ul className="space-y-3">
                      {atsData.strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start text-sm text-slate-600 dark:text-slate-300"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-emerald-500 shrink-0"/>{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-red-100 dark:border-red-900/30">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-red-500"/> Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {atsData.missingKeywords?.map((kw: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-800/30">{kw}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl mb-10">
                <h3 className="text-xl font-bold mb-6 flex items-center dark:text-white">
                  <Sparkles className="w-6 h-6 mr-3 text-indigo-500" />
                  Actionable Suggestions to Improve your ATS Score
                </h3>
                <div className="space-y-4">
                  {atsData.actionableSuggestions?.map((suggestion: string, i: number) => (
                    <div key={i} className="flex items-start p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4">
                        {i + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                  {(!atsData.actionableSuggestions || atsData.actionableSuggestions.length === 0) && (
                    <p className="text-slate-500 italic">No major suggestions. Your resume is highly optimized!</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <Button 
                  onClick={generateCoverLetterFlow}
                  className="bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30"
                >
                  <FileText className="w-4 h-4 mr-2"/> Generate Custom Cover Letter
                </Button>
                <Button onClick={handleStartInterview} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">
                  <User className="w-4 h-4 mr-2"/> Start AI Interview
                </Button>
              </div>

              {/* Cover Letter Modal / Display */}
              {coverLetter && (
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-emerald-500 mb-10">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold dark:text-white">Generated Cover Letter</h3>
                      <Button onClick={() => {
                        const blob = generatePdfCoverLetter(coverLetter);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'Cover_Letter.pdf'; a.click();
                      }} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2"/> Download PDF
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                      {coverLetter}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
