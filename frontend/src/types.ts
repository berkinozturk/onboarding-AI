export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department: string;
  position: string;
  startDate: string;
  level: number;
  xp: number;
  badges: Badge[];
  progress: number;
  completedQuestions: string[];
}

export interface Question {
  id: string;
  text: string;
  type: 'boolean' | 'text' | 'multiple_choice';
  category: string;
  options?: string[];
  correctAnswer?: string;
  xpReward: number;
  order: number;
  badge?: Badge;
}

export type BadgeIcon = 'star' | 'coffee' | 'shield' | 'users' | 'book' | 'rocket' | 'target' | 'award' | 'briefcase' | 'crown' | 'flag' | 'heart' | 'lightbulb' | 'medal' | 'trophy';

export interface Badge {
  id: string;
  name: string;
  description: string;
  requiredXP: number;
  icon: BadgeIcon;
}

export interface EmployeeFormData {
  email: string;
  password: string;
  name: string;
  position: string;
  department: string;
  startDate?: string;
}

export interface Answer {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  timestamp: string;
  question: Question;
}

export interface QuestionFormData {
  text: string;
  type: 'boolean' | 'text';
  category: string;
  xpReward: number;
  options: string[];
  correctAnswer: string;
  badge?: Badge;
} 