import React, { useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import ChatInterface from '../../components/employee/ChatInterface';
import { Award, Trophy, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../../store';

export default function EmployeeOnboarding() {
  const user = useStore((state) => state.user);
  const questions = useStore((state) => state.questions);
  const initializeQuestions = useStore((state) => state.initializeQuestions);
  const getUnansweredQuestions = useStore((state) => state.getUnansweredQuestions);
  const questionAnswers = useStore((state) => state.questionAnswers);

  useEffect(() => {
    initializeQuestions();
  }, [initializeQuestions]);

  if (!user || !questions) {
    return <div>Loading...</div>;
  }

  const unansweredQuestions = getUnansweredQuestions();
  const isComplete = unansweredQuestions.length === 0;

  // Calculate progress
  const progress = user.progress || 0;
  const totalXP = user.xp || 0;
  const badges = user.badges || [];

  // Check if all questions have been answered (correctly or incorrectly)
  const allQuestionsAnswered = Object.values(questionAnswers).filter(
    answer => answer.employeeId === user.id
  ).length === questions.length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Level {user.level}</h3>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(totalXP % 1000) / 10}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{totalXP} XP</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold">Progress</h3>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{progress}% Complete</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold">Badges</h3>
            </div>
            <div className="mt-3 flex gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="relative group"
                >
                  <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {allQuestionsAnswered && !isComplete && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Almost There!
                </h2>
              </div>
              <p className="text-gray-600 mb-4">The following tasks need to be completed correctly:</p>
              <ul className="list-disc pl-6 space-y-2">
                {unansweredQuestions.map(question => (
                  <li key={question.id} className="text-gray-600">
                    {question.text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-gray-600">
                Please complete these tasks to finish your onboarding. You may need to coordinate with your team or supervisor for assistance.
              </p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Congratulations! Onboarding Complete! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                You've successfully completed all onboarding tasks and earned:
              </p>
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">{totalXP}</p>
                  <p className="text-sm text-gray-500">XP Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{badges.length}</p>
                  <p className="text-sm text-gray-500">Badges Earned</p>
                </div>
              </div>
              <p className="text-gray-600">
                You're now ready to start your journey with us! Check your profile to see all your achievements.
              </p>
            </div>
          </div>
        )}

        <ChatInterface />
      </div>
    </Layout>
  );
}