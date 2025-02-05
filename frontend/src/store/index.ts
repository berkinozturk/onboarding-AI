import create from 'zustand';
import { Question } from '../types';
import api from '../services/api';

interface Store {
  questions: Question[];
  addQuestion: (question: Partial<Question>) => Promise<void>;
  updateQuestion: (question: Partial<Question> & { id: string }) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  initializeQuestions: () => Promise<void>;
}

const useStore = create<Store>((set, get) => ({
  questions: [],

  addQuestion: async (question) => {
    try {
      console.log('Adding question with data:', question);
      const response = await api.post('/questions', question);
      console.log('Response from adding question:', response.data);
      set(state => ({
        questions: [...state.questions, response.data]
      }));
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  updateQuestion: async (question) => {
    try {
      const response = await api.put(`/questions/${question.id}`, question);
      set(state => ({
        questions: state.questions.map(q => 
          q.id === question.id ? response.data : q
        )
      }));
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      set(state => ({
        questions: state.questions.filter(q => q.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  initializeQuestions: async () => {
    try {
      console.log('Initializing questions...');
      const response = await api.get('/questions');
      console.log('Raw response from GET /questions:', response.data);

      // Parse options for each question
      const questionsWithParsedOptions = response.data.map((question: any) => {
        console.log('Processing question:', question.id, 'Type:', question.type);
        let parsedOptions = [];
        
        if (question.options) {
          try {
            parsedOptions = typeof question.options === 'string' 
              ? JSON.parse(question.options) 
              : Array.isArray(question.options) 
                ? question.options 
                : [];
            console.log('Parsed options for question', question.id, ':', parsedOptions);
          } catch (error) {
            console.error('Error parsing options for question:', question.id, error);
          }
        } else {
          console.warn('No options found for question:', question.id);
        }

        const processedQuestion = {
          ...question,
          options: parsedOptions
        };
        console.log('Processed question:', processedQuestion);
        return processedQuestion;
      });

      console.log('Setting questions in store:', questionsWithParsedOptions);
      set({ questions: questionsWithParsedOptions });
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }
}));

export default useStore; 