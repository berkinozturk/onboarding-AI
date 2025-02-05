import React from 'react';
import Questions from './Questions';
import Chatbot from '../components/Chatbot';

const OnboardingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Questions />
      </div>
      <Chatbot />
    </div>
  );
};

export default OnboardingPage; 