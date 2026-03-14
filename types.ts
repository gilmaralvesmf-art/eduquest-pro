
export enum Difficulty {
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options?: string[];
  correctAnswer: string;
  difficulty: Difficulty;
  year: number;
  source?: string;
  board?: string;
  commentary?: string;
  visualType?: 'table' | 'graph' | 'infographic' | 'charge' | 'none';
  visualContent?: string;
  questionType?: 'multiple_choice' | 'open';
}

export interface Assessment {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  status: 'draft' | 'published';
}

export interface DashboardStats {
  totalQuestions: number;
  totalAssessments: number;
  aiGenerations: number;
  recentActivity: { date: string; value: number }[];
}
