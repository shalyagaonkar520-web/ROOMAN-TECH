import Database from 'better-sqlite3';
import path from 'path';

// Store DB in the workspace root or memory if you prefer. Using a file to persist across server restarts in dev.
const dbPath = path.resolve(process.cwd(), 'interview_agent.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    years_experience TEXT NOT NULL,
    programming_language TEXT NOT NULL,
    skills TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    num_questions INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    expected_answer TEXT,
    hints TEXT,
    order_idx INTEGER NOT NULL,
    FOREIGN KEY(interview_id) REFERENCES interviews(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL UNIQUE,
    answer_text TEXT NOT NULL,
    score INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    strengths TEXT NOT NULL,
    weaknesses TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    ideal_answer TEXT NOT NULL,
    knowledge_gaps TEXT NOT NULL,
    learning_suggestions TEXT NOT NULL,
    time_taken_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL UNIQUE,
    overall_score INTEGER NOT NULL,
    percentage INTEGER NOT NULL,
    hiring_probability INTEGER NOT NULL,
    recommendation TEXT NOT NULL,
    skill_level TEXT NOT NULL,
    strengths TEXT NOT NULL, -- JSON array
    weaknesses TEXT NOT NULL, -- JSON array
    learning_roadmap TEXT NOT NULL,
    topics_to_improve TEXT NOT NULL, -- JSON array
    performance_heatmap TEXT NOT NULL, -- JSON object
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(interview_id) REFERENCES interviews(id) ON DELETE CASCADE
  );
`);

export default db;

try {
  db.exec('ALTER TABLE reports ADD COLUMN resume_match_percentage INTEGER DEFAULT 0');
  db.exec('ALTER TABLE reports ADD COLUMN ats_missing_keywords TEXT DEFAULT "[]"');
  db.exec('ALTER TABLE reports ADD COLUMN resume_vs_jd_analysis TEXT DEFAULT ""');
} catch (e) {
  // Columns might already exist
}

try {
  db.exec('ALTER TABLE interviews ADD COLUMN resume_text TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE interviews ADD COLUMN jd_text TEXT');
} catch (e) {}

try {
  db.exec('ALTER TABLE interviews ADD COLUMN integrity_logs TEXT');
} catch (e) {}

try {
  db.exec("ALTER TABLE interviews ADD COLUMN mode TEXT DEFAULT 'premium'");
} catch (e) {}

try {
  db.exec("ALTER TABLE interviews ADD COLUMN company TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE interviews ADD COLUMN interview_plan TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE interviews ADD COLUMN candidate_name TEXT DEFAULT 'Candidate'");
} catch (e) {}

