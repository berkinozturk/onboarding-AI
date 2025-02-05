import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, User, Briefcase, LogOut } from 'lucide-react';
import { useStore } from '../../store';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  // If there's no user, redirect to login
  useEffect(() => {
    if (!user) {
      console.log('No user found in Layout, redirecting to login');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/employees', icon: Users, label: 'Employees' },
    { to: '/admin/chatbot', icon: MessageSquare, label: 'Chatbot Config' },
  ];

  const employeeLinks = [
    { to: '/employee', icon: MessageSquare, label: 'Onboarding' },
    { to: '/employee/profile', icon: User, label: 'Profile' },
    { to: '/employee/chatbot-buddy', icon: MessageSquare, label: 'Chatbot Buddy' }
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  const handleLogout = () => {
    // Clear chat messages from localStorage
    localStorage.removeItem('chatMessages');
    // Perform normal logout
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  // If there's no user, don't render anything
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg flex flex-col justify-between">
        <div>
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Skilled GmbH</h1>
                <p className="text-sm text-gray-500">Onboarding System</p>
              </div>
            </div>
          </div>
          <nav className="px-4 mt-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 ${
                  location.pathname === link.to ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}