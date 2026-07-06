export interface Interview {
  id: number;
  role: string;
  difficulty: string;
  years_experience: string;
  programming_language: string;
  skills: string;
  interview_type: string;
  num_questions: number;
  status: string;
  resume_match_percentage: number;
  ats_missing_keywords: string;
  resume_vs_jd_analysis: string;
  created_at: string;
}

export interface Question {
  id: number;
  interview_id: number;
  question_text: string;
  topic: string;
  difficulty: string;
  expected_answer: string;
  hints: string; // JSON array
  order_idx: number;
}

export interface Answer {
  id: number;
  question_id: number;
  answer_text: string;
  score: number;
  reasoning: string;
  strengths: string; // JSON array
  weaknesses: string; // JSON array
  confidence: number;
  ideal_answer: string;
  knowledge_gaps: string; // JSON array
  learning_suggestions: string; // JSON array
  time_taken_seconds: number | null;
  resume_match_percentage: number;
  ats_missing_keywords: string;
  resume_vs_jd_analysis: string;
  created_at: string;
}

export interface Report {
  id: number;
  interview_id: number;
  overall_score: number;
  percentage: number;
  hiring_probability: number;
  recommendation: string;
  skill_level: string;
  strengths: string; // JSON array
  weaknesses: string; // JSON array
  learning_roadmap: string;
  topics_to_improve: string; // JSON array
  performance_heatmap: string; // JSON object
  resume_match_percentage: number;
  ats_missing_keywords: string;
  resume_vs_jd_analysis: string;
  created_at: string;
}
