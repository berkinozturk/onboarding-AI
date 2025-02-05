export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';
  category: string;
  options: string[];
  correctAnswer?: string;
  xpReward: number;
  order: number;
  badge?: Badge;
  badgeId?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  requiredXP: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  department: string;
  position: string;
  startDate: Date;
  level: number;
  xp: number;
  progress: number;
  badges: Badge[];
  completedQuestions: string[];
}

export interface Answer {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  timestamp: Date;
  question?: Question;
}

export interface QuestionFormProps {
  onSuccess: () => void;
  initialData?: Question;
} 