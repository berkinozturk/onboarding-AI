import axios from 'axios';
import type { User, EmployeeFormData, Question } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login...');
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        const token = response.data.token.startsWith('Bearer ') ? 
          response.data.token : 
          `Bearer ${response.data.token}`;
        console.log('Setting token:', token);
        localStorage.setItem('token', token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      // Don't remove token on login failure
      throw new Error('Invalid email or password');
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Getting current user with token:', token);
      const response = await api.get('/auth/me');
      console.log('Current user response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      localStorage.removeItem('token');
      throw error;
    }
  },

  register: async (data: EmployeeFormData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};

export const questionsApi = {
  getAll: async () => {
    const response = await api.get('/questions');
    return response.data;
  },
  create: async (data: Partial<Question>) => {
    const response = await api.post('/questions', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Question>) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },
  reorder: async (questions: { id: string; order: number }[]) => {
    const response = await api.put('/questions/reorder', { questions });
    return response.data;
  }
};

export const employeeApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: EmployeeFormData) => {
    // Remove any undefined or null values
    const cleanData = {
      email: data.email,
      password: data.password,
      name: data.name,
      position: data.position,
      department: data.department,
      startDate: data.startDate || new Date().toISOString().split('T')[0]
    };
    return await authApi.register(cleanData);
  },
  update: async (id: string, data: Partial<EmployeeFormData>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

export const chatbotApi = {
  async initialize() {
    try {
      const response = await fetch('/api/chatbot/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async sendMessage(message: string) {
    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, response: data.response };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export { api }; 