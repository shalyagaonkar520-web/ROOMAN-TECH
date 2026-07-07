import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Loader2, Award, Target, Briefcase, Calendar, 
  TrendingUp, Activity, CheckCircle, Trash2, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, Legend, BarChart, Bar, CartesianGrid 
} from 'recharts';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [careerHistory, setCareerHistory] = useState<{resumes: any[], coverLetters: any[]}>({ resumes: [], coverLetters: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch analytics aggregates
      const analyticsRes = await fetch(`/api/analytics?userId=${user?.uid}`);
      let analyticsJson = {
        interviewCount: 0,
        averageScore: 0,
        highestScore: 0,
        trends: [],
        heatmap: {}
      };
      if (analyticsRes.ok) {
        analyticsJson = await analyticsRes.json();
      }

      // Fetch user interviews list
      const interviewsRes = await fetch(`/api/interviews?userId=${user?.uid}`);
      let interviewsJson = [];
      if (interviewsRes.ok) {
        interviewsJson = await interviewsRes.json();
      }

      const careerRes = await fetch(`/api/career/history?userId=${user?.uid}`);
      let careerJson = { resumes: [], coverLetters: [] };
      if (careerRes.ok) {
        careerJson = await careerRes.json();
      }

      setAnalytics(analyticsJson);
      setInterviews(interviewsJson);
      setCareerHistory(careerJson);
    } catch (e) {
      console.error('Error fetching dashboard analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInterview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interview record?')) return;
    try {
      const res = await fetch(`/api/interviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Aggregating interview analytics...</p>
      </div>
    );
  }

  const hasInterviews = interviews.length > 0;
  const heatmapData = analytics ? Object.keys(analytics.heatmap).map(topic => ({
    topic,
    Score: analytics.heatmap[topic]
  })) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-10 w-full pb-20 pt-6">
      
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">
            Welcome back, <span className="font-bold text-indigo-500 dark:text-indigo-400">{user?.displayName || 'Candidate'}</span>. Track your skill trends and history.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/career-assistant">
            <Button variant="outline" className="rounded-xl font-bold px-6 py-3 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 cursor-pointer">
              Career Assistant
            </Button>
          </Link>
          <Link to="/setup">
            <Button className="rounded-xl shadow-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 border-0 font-bold px-6 py-3 cursor-pointer">
              Start New Interview
            </Button>
          </Link>
        </div>
      </div>

      {!hasInterviews ? (
        <Card className="text-center p-16 glass-panel border-0 border-dashed border-slate-300 dark:border-slate-800">
          <div className="text-slate-300 dark:text-slate-700 mb-6 flex justify-center">
            <Briefcase className="w-16 h-16" />
          </div>
          <h3 className="text-xl font-bold mb-2">No analytics available yet</h3>
          <p className="text-slate-500 mb-8 dark:text-slate-400">Complete your first AI mock interview or Face-to-Face call to view performance analysis.</p>
          <Link to="/setup">
            <Button className="rounded-xl px-8 font-bold">Start Now</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Stats Aggregates Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Interview Count */}
            <Card className="border-0 shadow-xl glass-panel relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">Interviews Completed</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2">{analytics?.interviewCount}</h3>
                  <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">Practice sessions completed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <Briefcase className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Box 2: Average Score */}
            <Card className="border-0 shadow-xl glass-panel relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500" />
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">Average Proficiency</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2">{analytics?.averageScore}%</h3>
                  <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">Across all topics tested</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
                  <Award className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            {/* Box 3: Highest Score */}
            <Card className="border-0 shadow-xl glass-panel relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider dark:text-slate-400">Highest Score Achieved</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2">{analytics?.highestScore}%</h3>
                  <p className="text-slate-400 text-xs mt-1 dark:text-slate-500">Peak assessment performance</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                  <Target className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends Chart & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart: Trends */}
            <Card className="lg:col-span-2 border-0 shadow-xl glass-panel">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/10 pb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Performance Metrics Trends
                  </h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="probColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F172A', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#FFF'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area name="Overall Score" type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                      <Area name="Hiring Prob." type="monotone" dataKey="hiringProbability" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#probColor)" />
                      <Area name="Resume Match" type="monotone" dataKey="resumeMatch" stroke="#10B981" strokeWidth={2} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart: Topic scores Heatmap (Horizontal Bar Chart) */}
            <Card className="border-0 shadow-xl glass-panel">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/10 pb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-500" />
                    Topic-wise Analytics
                  </h3>
                </div>
                {heatmapData.length === 0 ? (
                  <div className="flex justify-center items-center h-72 text-slate-500 text-sm">No topic scores evaluated.</div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={10} />
                        <YAxis dataKey="topic" type="category" stroke="#94A3B8" fontSize={11} width={85} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F172A', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#FFF'
                          }} 
                        />
                        <Bar dataKey="Score" fill="rgba(34, 211, 238, 0.7)" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Career Assistant History */}
          {(careerHistory.resumes.length > 0 || careerHistory.coverLetters.length > 0) && (
            <div className="space-y-4 pt-6">
              <h3 className="text-xl font-bold flex items-center gap-2 pl-1">
                <Briefcase className="w-5 h-5 text-indigo-500" />
                Resume & Cover Letter History
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {careerHistory.resumes.map((resume) => (
                  <Card key={resume.id} className="glass-panel border-0 hover:shadow-2xl hover:scale-[1.005] transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-extrabold text-lg">Optimized Resume</h4>
                          <div className="flex items-center text-xs text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {new Date(resume.created_at?.seconds * 1000 || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </div>
                        </div>
                        <span className="text-xs font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                          ATS Score: {resume.newAtsScore}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                        {resume.optimizedData?.careerObjective}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {careerHistory.coverLetters.map((cl) => (
                  <Card key={cl.id} className="glass-panel border-0 hover:shadow-2xl hover:scale-[1.005] transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-extrabold text-lg">Cover Letter</h4>
                          <p className="text-sm font-semibold text-indigo-500">{cl.targetRole} @ {cl.targetCompany}</p>
                          <div className="flex items-center text-xs text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {new Date(cl.created_at?.seconds * 1000 || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 italic">
                        "{cl.content.substring(0, 100)}..."
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* List of Previous Interviews */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xl font-bold flex items-center gap-2 pl-1">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Interview History
            </h3>
            
            <div className="grid gap-4">
              {interviews.map((interview) => (
                <Card key={interview.id} className="glass-panel border-0 hover:shadow-2xl hover:scale-[1.005] transition-all duration-300 group">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                        <h4 className="font-extrabold text-lg">{interview.role}</h4>
                        <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                          {interview.years_experience}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border
                          ${interview.difficulty === 'Easy' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                            interview.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                            interview.difficulty === 'Hard' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                          {interview.difficulty}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border
                          ${interview.status === 'completed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200'}`}>
                          {interview.status}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-400 space-x-4">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {new Date(interview.created_at?.toDate ? interview.created_at.toDate() : interview.created_at || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-400 uppercase tracking-widest text-[9px] bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">{interview.interview_type} Mode</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button 
                        onClick={() => deleteInterview(interview.id)}
                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-600 flex items-center justify-center border border-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link to={interview.status === 'completed' ? `/report/${interview.id}` : interview.mode === 'face_to_face' ? `/interview/f2f/${interview.id}` : `/interview/${interview.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full rounded-xl border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 group-hover:border-indigo-500 dark:group-hover:border-indigo-500 transition-colors font-bold py-2.5 cursor-pointer">
                          {interview.status === 'completed' ? 'View Analysis Report' : 'Resume Interview'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
