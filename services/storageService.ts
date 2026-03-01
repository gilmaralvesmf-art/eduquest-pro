import { Question } from '../types';

export interface Assessment {
  id: string;
  subject: string;
  topic: string;
  board: string;
  difficulty: string;
  questions: Question[];
  createdAt: string;
}

export interface ScanResult {
  id: string;
  assessmentId?: string;
  title: string;
  topic: string;
  score: number;
  totalQuestions: number;
  studentAnswers: string[];
  scannedAt: string;
}

const ASSESSMENTS_KEY = 'eduquest_assessments';
const HISTORY_KEY = 'eduquest_history';
const SAVED_QUESTIONS_KEY = 'eduquest_saved_questions';

export const storageService = {
  saveAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>): Assessment => {
    const assessments = storageService.getAssessments();
    const newAssessment: Assessment = {
      ...assessment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    assessments.unshift(newAssessment);
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
    return newAssessment;
  },

  getAssessments: (): Assessment[] => {
    const data = localStorage.getItem(ASSESSMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteAssessment: (id: string) => {
    const assessments = storageService.getAssessments().filter(a => a.id !== id);
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
  },

  saveScanResult: (result: Omit<ScanResult, 'id' | 'scannedAt'>): ScanResult => {
    const history = storageService.getHistory();
    const newResult: ScanResult = {
      ...result,
      id: crypto.randomUUID(),
      scannedAt: new Date().toISOString(),
    };
    history.unshift(newResult);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return newResult;
  },

  getHistory: (): ScanResult[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteHistoryItem: (id: string) => {
    const history = storageService.getHistory().filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  saveQuestion: (question: Question) => {
    const questions = storageService.getSavedQuestions();
    if (!questions.find(q => q.text === question.text)) {
      questions.unshift(question);
      localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(questions));
    }
  },

  getSavedQuestions: (): Question[] => {
    const data = localStorage.getItem(SAVED_QUESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteSavedQuestion: (text: string) => {
    const questions = storageService.getSavedQuestions().filter(q => q.text !== text);
    localStorage.setItem(SAVED_QUESTIONS_KEY, JSON.stringify(questions));
  },

  getStats: () => {
    const assessments = storageService.getAssessments();
    const history = storageService.getHistory();
    const savedQuestions = storageService.getSavedQuestions();
    const totalQuestions = assessments.reduce((acc, a) => acc + a.questions.length, 0);
    
    return {
      totalAssessments: assessments.length,
      totalQuestions: totalQuestions + savedQuestions.length,
      totalScans: history.length,
      avgScore: history.length > 0 
        ? (history.reduce((acc, h) => acc + (h.score / h.totalQuestions), 0) / history.length * 100).toFixed(1)
        : 0
    };
  }
};
