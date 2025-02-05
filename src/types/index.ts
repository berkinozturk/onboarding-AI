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
  password: string; // Added password field
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredXP: number;
  image?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'boolean' | 'multiple_choice';
  category: string;
  xpReward: number;
  options?: string[];
  correctAnswer?: string;
  badge?: Badge;
  order: number;
}

export interface EmployeeFormData {
  email: string;
  password: string;
  name: string;
  department: string;
  position: string;
  startDate: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  requiredXP: number;
  // Add other properties as needed
}