import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminChatbot from './pages/admin/Chatbot';
import EmployeeOnboarding from './pages/employee/Onboarding';
import EmployeeProfile from './pages/employee/Profile';
import ChatbotBuddy from './pages/employee/ChatbotBuddy';
import Login from './pages/Login';
import { useStore } from './store';
import { authApi } from './services/api';

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'admin' | 'employee' }) {
  const user = useStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  }

  return <>{children}</>;
}

function App() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const initializeStore = useStore((state) => state.initializeStore);
  const initializeQuestions = useStore((state) => state.initializeQuestions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing app...');
        
        // First load questions to ensure they're available
        await initializeQuestions();
        
        // Then initialize the store (user, answers, etc.)
        const token = localStorage.getItem('token');
        if (token) {
          await initializeStore();
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [initializeStore, initializeQuestions]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Default Route */}
          <Route path="/" element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Login Route */}
          <Route path="/login" element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />
            ) : (
              <Login />
            )
          } />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chatbot"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminChatbot />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/chatbot-buddy"
            element={
              <ProtectedRoute requiredRole="employee">
                <ChatbotBuddy />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;