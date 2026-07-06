import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Interview as InterviewType } from '../types';
import { Loader2, Calendar, Briefcase, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function History() {
  const [interviews, setInterviews] = useState<InterviewType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInterview = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    try {
      await fetch(`/api/interviews/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 w-full pb-20 pt-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Interview History</h1>
          <p className="text-slate-500 mt-1">Review your past performance and track progress</p>
        </div>
        <Link to="/setup">
          <Button className="rounded-xl shadow-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200">
            New Interview
          </Button>
        </Link>
      </div>

      {interviews.length === 0 ? (
        <Card className="text-center p-16 glass-panel border-0 border-dashed border-slate-300 dark:border-slate-800">
           <div className="text-slate-300 dark:text-slate-700 mb-6 flex justify-center">
             <Briefcase className="w-16 h-16" />
           </div>
           <h3 className="text-xl font-bold mb-2">No interviews yet</h3>
           <p className="text-slate-500 mb-8">Start your first AI mock interview to see it here.</p>
           <Link to="/setup">
            <Button className="rounded-xl px-8">Start Interview</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="glass-panel border-0 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    <h3 className="font-bold text-lg">{interview.role}</h3>
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {interview.years_experience}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium
                      ${interview.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                        interview.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {interview.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium
                      ${interview.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {interview.status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 space-x-4">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {new Date(interview.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    onClick={() => deleteInterview(interview.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Link to={interview.status === 'completed' ? `/report/${interview.id}` : `/interview/${interview.id}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full rounded-xl border-slate-300 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-colors">
                      {interview.status === 'completed' ? 'View Report' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
