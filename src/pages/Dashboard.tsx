import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Report, Question, Answer, Interview as InterviewType } from '../types';
import { Loader2, CheckCircle, XCircle, Award, Target, Download, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2pdf from 'html2pdf.js';

export default function Dashboard() {
  const { id } = useParams();
  const [data, setData] = useState<{
    interview: InterviewType;
    questions: Question[];
    answers: Answer[];
    report: Report;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/interviews/${id}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 10,
      filename: `Interview_Report_${id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!data || !data.report) {
    return <div className="text-center mt-20">Report not found. The interview might not be finished yet.</div>;
  }

  const { report, questions, answers, interview } = data;
  
  const strengths = JSON.parse(report.strengths || '[]');
  const weaknesses = JSON.parse(report.weaknesses || '[]');
  const topicsToImprove = JSON.parse(report.topics_to_improve || '[]');
  const heatmap = JSON.parse(report.performance_heatmap || '{}');
  
  // Parse integrity logs and calculate score
  const integrityLogs = JSON.parse((interview as any).integrity_logs || '[]');
  let integrityScore = 100;
  integrityLogs.forEach((log: any) => {
    if (log.type.includes('TAB_SWITCH') || log.type.includes('WINDOW_BLUR')) integrityScore -= 10;
    else if (log.type.includes('PHONE_DETECTED') || log.type.includes('MULTIPLE_PEOPLE')) integrityScore -= 20;
    else if (log.type.includes('LOOKING_AWAY')) integrityScore -= 5;
    else integrityScore -= 5;
  });
  integrityScore = Math.max(0, integrityScore);

  const radarData = Object.keys(heatmap).map(key => ({
    subject: key,
    A: heatmap[key],
    fullMark: 100,
  }));

  const chartData = questions.map((q, i) => {
    const ans = answers.find(a => a.question_id === q.id);
    return {
      name: `Q${i + 1}`,
      score: ans ? ans.score : 0,
      topic: q.topic
    };
  });

  return (
    <div className="space-y-8 pb-20 w-full" ref={reportRef}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200/50 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {interview.interview_type}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {interview.difficulty}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Hiring Assessment</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">{interview.role} • {interview.years_experience}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700" onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `Interview_Report_${id}.json`);
            dlAnchorElem.click();
          }}>
            Export JSON
          </Button>
        </div>
      </div>

      {/* Resume vs JD Analysis */}
      {report.resume_match_percentage > 0 && (
        <Card className="border-0 shadow-lg mb-6 glass-panel overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="col-span-1 border-r border-slate-200 dark:border-slate-800 pr-6">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Resume Match</p>
                <div className="flex items-end space-x-2">
                  <span className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">{report.resume_match_percentage}%</span>
                </div>
                <p className="text-sm mt-4 text-slate-600 dark:text-slate-400">
                  {report.resume_vs_jd_analysis}
                </p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">ATS Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(report.ats_missing_keywords || '[]').length > 0 ? JSON.parse(report.ats_missing_keywords || '[]').map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium border border-red-200/50 dark:border-red-500/20">
                      {kw}
                    </span>
                  )) : (
                    <span className="text-emerald-600 font-medium text-sm">Perfect match! All keywords found.</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-black text-white dark:from-white dark:to-slate-100 dark:text-black">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold uppercase tracking-wider">Hiring Decision</p>
                <p className={`text-2xl font-bold ${
                  report.recommendation.includes('Strong Hire') ? 'text-emerald-400 dark:text-emerald-600' :
                  report.recommendation.includes('Hire') ? 'text-green-400 dark:text-green-600' :
                  report.recommendation.includes('Leaning') ? 'text-amber-400 dark:text-amber-600' :
                  'text-red-400 dark:text-red-600'
                }`}>
                  {report.recommendation}
                </p>
              </div>
              <Target className="w-8 h-8 text-slate-700 dark:text-slate-300 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-0">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Hiring Probability</p>
                <div className="flex items-end space-x-2">
                  <p className="text-3xl font-bold">{report.hiring_probability}%</p>
                  <span className="text-sm font-medium text-slate-400 mb-1">FAANG passing rate</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Assessed Level</p>
                <p className="text-2xl font-bold">
                  {report.skill_level}
                </p>
              </div>
              <Award className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrity Report Section */}
      <Card className="border-0 shadow-lg mb-6 glass-panel overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-full h-1 ${integrityScore >= 90 ? 'bg-emerald-500' : integrityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} />
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center space-x-2 mb-2">
                {integrityScore >= 90 ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-red-500" />}
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Interview Integrity</p>
              </div>
              <div className="flex items-end space-x-2 mb-4">
                <span className={`text-5xl font-extrabold ${integrityScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' : integrityScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{integrityScore}%</span>
                <span className="text-sm font-medium text-slate-400 mb-1">Trust Score</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {integrityScore >= 90 ? 'High integrity. The candidate maintained focus and adherence to proctoring rules.' :
                 integrityScore >= 70 ? 'Moderate integrity. Some minor proctoring violations were detected.' :
                 'Low integrity. Multiple severe proctoring violations detected. Proceed with caution.'}
              </p>
            </div>
            
            <div className="md:w-2/3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Proctoring Events Log</h4>
              {integrityLogs.length === 0 ? (
                <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">No violations detected during the interview.</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {integrityLogs.map((log: any, i: number) => (
                    <div key={i} className="flex items-start p-3 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-3 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-red-800 dark:text-red-300">{log.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="glass-panel border-0">
          <CardContent className="p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Skill Heatmap</h3>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="glass-panel border-0">
          <CardContent className="p-6 h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Question Timeline</h3>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-panel border-0 bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500">
          <CardContent className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center">
              <CheckCircle className="w-4 h-4 mr-2"/> Systemic Strengths
            </h4>
            <ul className="space-y-3">
              {strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start leading-relaxed">
                  <span className="mr-3 text-emerald-500">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-0 bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500">
          <CardContent className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center">
              <XCircle className="w-4 h-4 mr-2"/> Critical Flaws
            </h4>
            <ul className="space-y-3">
              {weaknesses.map((w: string, i: number) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start leading-relaxed">
                  <span className="mr-3 text-red-500">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap */}
      <Card className="glass-panel border-0">
        <CardContent className="p-8">
          <h3 className="text-lg font-bold mb-6">Learning Roadmap</h3>
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed mb-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.learning_roadmap}</ReactMarkdown>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Topics</h4>
            <div className="flex flex-wrap gap-2">
              {topicsToImprove.map((topic: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200/50 dark:border-white/5">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <div className="space-y-6 pt-8 border-t border-slate-200/50 dark:border-white/10">
        <h3 className="text-2xl font-bold">Detailed Transcript</h3>
        <p className="text-slate-500 text-sm mb-6">Review exact AI reasoning for each answer.</p>
        
        <div className="space-y-4">
          {questions.map((q, i) => {
            const ans = answers.find(a => a.question_id === q.id);
            if (!ans) return null;
            
            const isExpanded = expandedQ === q.id;
            
            return (
              <Card key={q.id} className="glass-panel border-0 overflow-hidden">
                <button 
                  className="w-full text-left p-6 flex justify-between items-start focus:outline-none"
                  onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                >
                  <div className="space-y-2 pr-8">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Q{i + 1}</span>
                      <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{q.topic}</span>
                    </div>
                    <p className="font-medium text-base text-slate-900 dark:text-white line-clamp-2">{q.question_text}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <span className={`text-lg font-bold ${ans.score >= 8 ? 'text-emerald-500' : ans.score >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                      {ans.score}/10
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50 space-y-8 mt-4">
                        
                        {/* Question Full */}
                        <div>
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question</h4>
                           <div className="prose prose-sm dark:prose-invert max-w-none">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question_text}</ReactMarkdown>
                           </div>
                        </div>

                        {/* Answer */}
                        <div>
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Answer</h4>
                           <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200/50 dark:border-white/5 font-mono text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                             {ans.answer_text}
                           </div>
                        </div>

                        {/* Evaluation */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-3">AI Evaluation</h4>
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 mb-6">{ans.reasoning}</p>
                          
                          <div className="grid md:grid-cols-2 gap-6 text-sm">
                             <div>
                               <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center mb-2"><CheckCircle className="w-3 h-3 mr-1" /> Technical Strengths</span>
                               <ul className="space-y-1.5">
                                 {JSON.parse(ans.strengths || '[]').map((s: string, idx: number) => <li key={idx} className="text-slate-600 dark:text-slate-400 text-xs">• {s}</li>)}
                               </ul>
                             </div>
                             <div>
                               <span className="font-bold text-red-700 dark:text-red-400 flex items-center mb-2"><XCircle className="w-3 h-3 mr-1" /> Technical Flaws</span>
                               <ul className="space-y-1.5">
                                 {JSON.parse(ans.weaknesses || '[]').map((s: string, idx: number) => <li key={idx} className="text-slate-600 dark:text-slate-400 text-xs">• {s}</li>)}
                               </ul>
                             </div>
                          </div>
                        </div>

                        {/* Ideal Answer */}
                        <div>
                           <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Production-Ready Answer</h4>
                           <div className="prose prose-sm dark:prose-invert max-w-none p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{ans.ideal_answer}</ReactMarkdown>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
