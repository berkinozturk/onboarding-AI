import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { User, Question, Badge, EmployeeFormData } from '../types';
import { api, authApi } from '../services/api';

interface AppState {
  user: User | null;
  questions: Question[];
  currentQuestionId: string | null;
  employees: User[];
  questionAnswers: Record<string, { 
    answer: string | boolean; 
    timestamp: string; 
    employeeId: string;
    questionId: string;
  }>;
  setUser: (user: User | null) => void;
  setEmployees: (employees: User[]) => void;
  updateProgress: (progress: number) => void;
  addXP: (amount: number) => void;
  addBadge: (badge: Badge) => void;
  completeQuestion: (questionId: string, answer: string | boolean) => Promise<any>;
  setCurrentQuestion: (questionId: string) => void;
  addEmployee: (data: EmployeeFormData) => Promise<void>;
  updateEmployee: (id: string, data: Partial<EmployeeFormData>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User | null>;
  calculateEmployeeProgress: (id: string) => number;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  updateQuestion: (question: Partial<Question> & { id: string }) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (sourceIndex: number, destinationIndex: number) => void;
  getAvgCompletionRate: () => number;
  getTotalBadgesAwarded: () => number;
  getUnansweredQuestions: () => Question[];
  initializeQuestions: () => Promise<void>;
  logout: () => void;
  initializeStore: () => Promise<User | null>;
}

// Mock employees for testing
const mockEmployees: User[] = [
  {
    id: '1',
    email: 'admin@skilled.com',
    name: 'Admin User',
    role: 'admin',
    department: 'Management',
    position: 'System Administrator',
    startDate: '2024-01-01',
    level: 1,
    xp: 0,
    badges: [],
    progress: 50,
    completedQuestions: []
  },
  {
    id: '2',
    email: 'employee@skilled.com',
    name: 'Test Employee',
    role: 'employee',
    department: 'Engineering',
    position: 'Software Engineer',
    startDate: '2024-01-01',
    level: 1,
    xp: 0,
    badges: [{
      id: 'badge1',
      name: 'First Badge',
      description: 'Awarded for completing the first task',
      icon: 'star',
      requiredXP: 10,
      image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200'
    }],
    progress: 75,
    completedQuestions: []
  }
];

// Move the initial questions to a separate constant
const INITIAL_QUESTIONS: Question[] = [
  {
    id: '1',
    text: "Have you found the coffee machine in the break room? It's an essential part of our office culture!",
    type: 'boolean',
    category: 'Office Navigation',
    xpReward: 50,
    order: 1,
    badge: {
      id: 'coffee-explorer',
      name: 'Coffee Explorer',
      description: 'Successfully located the sacred coffee machine',
      icon: 'coffee',
      requiredXP: 50,
      image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=200'
    }
  },
  {
    id: '2',
    text: 'Do you know where to find the emergency exits? Safety first!',
    type: 'boolean',
    category: 'Safety',
    xpReward: 75,
    order: 2,
    badge: {
      id: 'safety-first',
      name: 'Safety Champion',
      description: 'Demonstrated commitment to workplace safety',
      icon: 'shield',
      requiredXP: 75,
      image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200'
    }
  },
  {
    id: '3',
    text: 'Have you met your team members? Building connections is important!',
    type: 'boolean',
    category: 'Team Building',
    xpReward: 100,
    order: 3,
    badge: {
      id: 'team-player',
      name: 'Team Player',
      description: 'Successfully connected with team members',
      icon: 'users',
      requiredXP: 100,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200'
    }
  }
];

export const useStore = create<AppState>()(
  immer((set, get) => ({
    user: null,
    questions: [],
    currentQuestionId: null,
    employees: [],
    questionAnswers: {},

    initializeStore: async () => {
      try {
        console.log('Initializing store...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          set({ 
            user: null,
            employees: [],
            questions: [],
            currentQuestionId: null,
            questionAnswers: {}
          });
          return null;
        }

        // First fetch questions to ensure they're always available
        console.log('Fetching questions...');
        const questionsResponse = await api.get('/questions');
        if (questionsResponse.data) {
          set({ questions: questionsResponse.data });
        }

        console.log('Getting current user...');
        const userResponse = await api.get('/auth/me');
        console.log('Current user:', userResponse.data);
        
        if (userResponse.data) {
          const userData = userResponse.data;
          set({ user: userData });

          // If user is admin, fetch employees and their answers
          if (userData.role === 'admin') {
            console.log('Admin user detected, fetching employees...');
            const employeesResponse = await api.get('/users');
            console.log('Employees:', employeesResponse.data);
            
            if (employeesResponse.data) {
              set({ employees: employeesResponse.data });
              
              // Fetch answers for all employees
              const allAnswers: Record<string, any> = {};
              for (const employee of employeesResponse.data) {
                try {
                  const answersResponse = await api.get(`/answers/user/${employee.id}`);
                  if (answersResponse.data) {
                    answersResponse.data.forEach((answer: any) => {
                      const key = `${answer.questionId}_${employee.id}`;
                      allAnswers[key] = {
                        answer: answer.answer === 'true' ? true : answer.answer === 'false' ? false : answer.answer,
                        timestamp: answer.createdAt || answer.timestamp,
                        employeeId: employee.id,
                        questionId: answer.questionId
                      };
                    });
                  }
                } catch (error) {
                  console.error(`Error fetching answers for employee ${employee.id}:`, error);
                }
              }
              set({ questionAnswers: allAnswers });
            }
          } else {
            // For regular employees, just fetch their own answers
            try {
              const answersResponse = await api.get(`/answers/user/${userData.id}`);
              if (answersResponse.data) {
                const answers = answersResponse.data.reduce((acc: Record<string, any>, answer: any) => {
                  const key = `${answer.questionId}_${userData.id}`;
                  acc[key] = {
                    answer: answer.answer === 'true' ? true : answer.answer === 'false' ? false : answer.answer,
                    timestamp: answer.createdAt || answer.timestamp,
                    employeeId: userData.id,
                    questionId: answer.questionId
                  };
                  return acc;
                }, {});
                set({ questionAnswers: answers });
              }
            } catch (error) {
              console.error('Error fetching answers:', error);
            }
          }

          return userData;
        }
        return null;
      } catch (error) {
        console.error('Error initializing store:', error);
        localStorage.removeItem('token');
        set({ 
          user: null,
          employees: [],
          questions: [],
          currentQuestionId: null,
          questionAnswers: {}
        });
        throw error;
      }
    },

    login: async (email: string, password: string) => {
      try {
        console.log('Login attempt:', email);
        const response = await authApi.login(email, password);
        console.log('Login response:', response);
        
        if (response.user) {
          set({ user: response.user });
          return response.user;
        }
        return null;
      } catch (error) {
        console.error('Login error:', error);
        return null;
      }
    },

    initializeQuestions: async () => {
      try {
        console.log('Fetching questions...');
        const response = await api.get('/questions');
        console.log('Questions response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Sort questions by order
          const sortedQuestions = [...response.data].sort((a, b) => a.order - b.order);
          console.log('Setting questions in store:', sortedQuestions);
          set({ questions: sortedQuestions });
          
          // Cache questions in localStorage for faster initial load
          localStorage.setItem('cached_questions', JSON.stringify(sortedQuestions));
        } else {
          // If no questions from API, try to load from cache
          const cachedQuestions = localStorage.getItem('cached_questions');
          if (cachedQuestions) {
            console.log('Loading questions from cache');
            set({ questions: JSON.parse(cachedQuestions) });
          } else {
            console.log('No questions available');
            set({ questions: [] });
          }
        }
      } catch (error) {
        console.error('Error initializing questions:', error);
        // Try to load from cache if API fails
        const cachedQuestions = localStorage.getItem('cached_questions');
        if (cachedQuestions) {
          console.log('Loading questions from cache after API error');
          set({ questions: JSON.parse(cachedQuestions) });
        }
        throw error;
      }
    },

    completeQuestion: async (questionId, answer) => {
      const state = get();
      if (!state.user) return;

      try {
        console.log('Store - completeQuestion called:', {
          questionId,
          answer,
          currentUser: state.user
        });
        
        // First update the answer
        const response = await api.post('/answers', {
          questionId,
          answer: answer.toString()
        });

        console.log('Store - Answer submission response:', response.data);

        if (response.data.user) {
          // Update state
          set((state) => {
            // Update user state
            state.user = {
              ...state.user!,
              xp: response.data.user.xp,
              level: response.data.user.level,
              progress: response.data.user.progress,
              badges: response.data.user.badges || [],
              completedQuestions: response.data.user.completedQuestions || []
            };

            // Update question answers with current timestamp
            const key = `${questionId}_${state.user!.id}`;
            state.questionAnswers[key] = {
              questionId,
              employeeId: state.user!.id,
              answer: response.data.answer.answer === 'true' ? true :
                     response.data.answer.answer === 'false' ? false :
                     response.data.answer.answer,
              timestamp: response.data.answer.updatedAt
            };
          });

          return response.data;
        }
      } catch (error) {
        console.error('Store - Failed to submit answer:', error);
        throw error;
      }
    },

    setCurrentQuestion: (questionId) => {
      const state = get();
      if (!state.user) return;

      // Only set if not already answered
      if (!state.user.completedQuestions.includes(questionId)) {
        set({ currentQuestionId: questionId });
      } else {
        // Find next unanswered question
        const nextUnanswered = state.questions.find(q => 
          state.user && !state.user.completedQuestions.includes(q.id)
        );
        set({ currentQuestionId: nextUnanswered?.id || state.currentQuestionId });
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      set({ 
        user: null,
        employees: [],
        questions: [],
        currentQuestionId: null,
        questionAnswers: {}
      });
    },

    setUser: (user) => set({ user }),
    setEmployees: (employees) => set({ employees }),

    updateProgress: (progress) =>
      set((state) => {
        if (state.user) {
          state.user.progress = progress;
        }
      }),

    addXP: (amount) =>
      set((state) => {
        if (state.user) {
          state.user.xp += amount;
          state.user.level = Math.floor(state.user.xp / 1000) + 1;
        }
      }),

    addBadge: (badge) =>
      set((state) => {
        if (state.user && !state.user.badges.find(b => b.id === badge.id)) {
          state.user.badges.push(badge);
        }
      }),

    addEmployee: async (data) => {
      try {
        console.log('Adding employee:', data);
        const response = await authApi.register(data);
        console.log('Add employee response:', response);
        
        if (response.user) {
          set((state) => {
            // Initialize employee with default values
            const newEmployee = {
              ...response.user,
              badges: response.user.badges || [],
              completedQuestions: response.user.completedQuestions || [],
              progress: response.user.progress || 0,
              xp: response.user.xp || 0,
              level: response.user.level || 1
            };
            state.employees.push(newEmployee);
          });
        }
      } catch (error) {
        console.error('Failed to add employee:', error);
        throw error;
      }
    },

    updateEmployee: async (id, data) => {
      try {
        const response = await api.put(`/users/${id}`, data);
          set((state) => {
          const index = state.employees.findIndex(emp => emp.id === id);
            if (index !== -1) {
              state.employees[index] = response.data;
            }
          });
      } catch (error) {
        console.error('Failed to update employee:', error);
        throw error;
      }
    },

    deleteEmployee: async (id) => {
      try {
        await api.delete(`/users/${id}`);
        set((state) => {
          state.employees = state.employees.filter(emp => emp.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete employee:', error);
        throw error;
      }
    },

    calculateEmployeeProgress: (id) => {
      const state = get();
      const employee = state.employees.find(emp => emp.id === id);
      if (!employee || !state.questions.length) return 0;

      // Get all answers for this employee
      const employeeAnswers = Object.entries(state.questionAnswers)
        .filter(([_, data]) => data.employeeId === id)
        .map(([_, data]) => data);

      if (employeeAnswers.length === 0) return 0;

      // Count all answered questions
      const answeredQuestionsCount = employeeAnswers.length;

      // Calculate progress based on total answered questions
      return Math.min(100, Math.round((answeredQuestionsCount / state.questions.length) * 100));
    },

    addQuestion: async (question) => {
      try {
        const response = await api.post('/questions', question);
        set((state) => {
          state.questions.push(response.data);
        });
      } catch (error) {
        console.error('Failed to add question:', error);
        throw error;
      }
    },

    updateQuestion: async (question) => {
      try {
        const response = await api.put(`/questions/${question.id}`, question);
        set((state) => {
          const index = state.questions.findIndex(q => q.id === question.id);
          if (index !== -1) {
            state.questions[index] = response.data;
          }
        });
      } catch (error) {
        console.error('Failed to update question:', error);
        throw error;
      }
    },

    deleteQuestion: async (id) => {
      try {
        await api.delete(`/questions/${id}`);
        set((state) => {
          state.questions = state.questions.filter(q => q.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete question:', error);
        throw error;
      }
    },

    reorderQuestions: async (sourceIndex: number, destinationIndex: number) => {
      try {
        const state = get();
        const newQuestions = Array.from(state.questions);
        const [removed] = newQuestions.splice(sourceIndex, 1);
        newQuestions.splice(destinationIndex, 0, removed);

        // Update local state first for immediate feedback
        set({ questions: newQuestions });

        // Create updates array with new order
        const updates = newQuestions.map((question, index) => ({
          id: question.id,
          order: index
        }));

        // Update backend
        await api.put('/questions/reorder', { questions: updates });
      } catch (error) {
        console.error('Failed to reorder questions:', error);
        // Revert to original state on error
        const response = await api.get('/questions');
        set({ questions: response.data });
        throw error;
      }
    },

    getAvgCompletionRate: () => {
      const state = get();
      const employees = state.employees.filter(emp => emp.role === 'employee');
      
      if (employees.length === 0) return 0;

      let totalProgress = 0;
      for (const employee of employees) {
        const progress = state.calculateEmployeeProgress(employee.id);
        totalProgress += progress;
      }

      return Math.round(totalProgress / employees.length);
    },

    getTotalBadgesAwarded: () => {
      const state = get();
      return state.employees.reduce((acc, emp) => acc + emp.badges.length, 0);
    },

    getUnansweredQuestions: () => {
      const state = get();
      if (!state.user) return [];

      return state.questions.filter(question => {
        // Get the latest answer for this question
        const answer = Object.entries(state.questionAnswers)
          .filter(([_, data]) => data.employeeId === state.user?.id && data.questionId === question.id)
          .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime())[0]?.[1];

        if (!answer) return true; // No answer yet

        // Check if the answer is correct based on question type
        if (question.type === 'boolean') {
          return answer.answer !== true; // For boolean questions, only true is correct
        } else if (question.type === 'multiple_choice') {
          return answer.answer !== question.correctAnswer; // For multiple choice, must match correctAnswer
        } else {
          return false; // For text questions, any answer is fine
        }
      });
    }
  }))
);