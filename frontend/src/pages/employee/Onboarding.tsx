import React, { useEffect, useState } from 'react';
import Layout from '../../components/shared/Layout';
import { MessageCircle, Trophy, Star, Award, Coffee, Shield, Users, Book, Rocket, Target, Briefcase, Crown, Flag, Heart, Lightbulb, Medal } from 'lucide-react';
import { useStore } from '../../store';
import { api } from '../../services/api';
import type { Question } from '../../types';

// Badge icon mapping
const BADGE_ICONS: { [key: string]: React.ComponentType<any> } = {
  coffee: Coffee,
  shield: Shield,
  users: Users,
  star: Star,
  book: Book,
  rocket: Rocket,
  target: Target,
  award: Award,
  briefcase: Briefcase,
  crown: Crown,
  flag: Flag,
  heart: Heart,
  lightbulb: Lightbulb,
  medal: Medal,
  trophy: Award
};

const getCompletionStatus = (answers: Record<string, any>, questions: Question[]) => {
  if (!answers || Object.keys(answers).length === 0) return 'not_started';
  
  const allAnswered = questions.every(q => answers[q.id]);
  if (!allAnswered) return 'in_progress';
  
  const allCorrect = questions.every(q => {
    const answer = answers[q.id]?.answer;
    if (q.type === 'boolean') {
      return answer === true || answer === 'true';
    } else if (q.type === 'multiple_choice') {
      return answer === q.correctAnswer;
    }
    return true; // Text questions are always considered correct
  });
  
  return allCorrect ? 'completed' : 'almost_there';
};

const CompletionMessage = ({ status }: { status: string }) => {
  if (status === 'not_started' || status === 'in_progress') return null;

  return (
    <div className={`p-4 rounded-lg mb-4 ${
      status === 'completed' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-yellow-100 text-yellow-800'
    }`}>
      {status === 'completed' ? (
        <div className="flex items-center">
          <span className="text-xl mr-2">🎉</span>
          <div>
            <h3 className="font-bold">Congratulations!</h3>
            <p>You've completed all onboarding tasks successfully!</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-xl mr-2">👋</span>
          <div>
            <h3 className="font-bold">Almost there!</h3>
            <p>You're making great progress. Keep going!</p>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionItem = ({ question, answer, onAnswer }: { 
  question: Question; 
  answer?: any;
  onAnswer: (questionId: string, value: any) => Promise<void>;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textAnswer, setTextAnswer] = useState(answer?.answer || '');

  // Load existing answer when it changes
  useEffect(() => {
    if (answer?.answer) {
      setTextAnswer(answer.answer);
    }
  }, [answer?.answer]);

  const handleAnswer = async (value: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAnswer(question.id, value);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleAnswer(true)}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg transition-colors ${
                answer?.answer === true
                  ? 'bg-green-600 text-white'
                  : isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Yes'}
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg transition-colors ${
                answer?.answer === false
                  ? 'bg-red-600 text-white'
                  : isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {isSubmitting ? 'Saving...' : 'No'}
            </button>
          </div>
        );

      case 'text':
        return (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAnswer(textAnswer);
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onClick={(e) => e.currentTarget.select()}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your answer..."
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Submit'}
            </button>
          </form>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={isSubmitting}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  answer?.answer === option
                    ? option === question.correctAnswer
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : isSubmitting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <MessageCircle className="w-5 h-5 text-gray-400 mt-1" />
      <div className="flex-1">
        <p className="text-gray-600">{question.text}</p>
        <div className="flex items-center gap-4 mt-2">
          {renderAnswerInput()}
          {answer && (
            <p className="text-xs text-gray-500">
              Last modified: {new Date(answer.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function EmployeeOnboarding() {
  const user = useStore((state) => state.user);
  const questions = useStore((state) => state.questions);
  const initializeQuestions = useStore((state) => state.initializeQuestions);
  const questionAnswers = useStore((state) => state.questionAnswers);
  const setUser = useStore((state) => state.setUser);
  const completeQuestion = useStore((state) => state.completeQuestion);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Initialize questions and fetch answers
  useEffect(() => {
    const initialize = async () => {
      await initializeQuestions();
      if (user) {
        try {
          const response = await api.get(`/answers/user/${user.id}`);
          if (response.data) {
            const answersMap = response.data.reduce((acc: Record<string, any>, answer: any) => {
              acc[answer.questionId] = {
                answer: answer.answer === 'true' ? true : answer.answer === 'false' ? false : answer.answer,
                timestamp: answer.updatedAt || answer.createdAt,
                questionId: answer.questionId
              };
              return acc;
            }, {});
            setAnswers(answersMap);
          }
        } catch (error) {
          console.error('Error fetching answers:', error);
        }
      }
    };
    initialize();
  }, [initializeQuestions, user]);

  // Update answers when questionAnswers changes
  useEffect(() => {
    if (questionAnswers) {
      const formattedAnswers = Object.entries(questionAnswers).reduce((acc, [key, value]) => {
        if (value.employeeId === user?.id) {
          acc[value.questionId] = {
            answer: value.answer === 'true' ? true : value.answer === 'false' ? false : value.answer,
            timestamp: value.timestamp,
            questionId: value.questionId
          };
        }
        return acc;
      }, {} as Record<string, any>);
      setAnswers(formattedAnswers);
    }
  }, [questionAnswers, user?.id]);

  const handleAnswer = async (questionId: string, value: any) => {
    try {
      console.log('Onboarding - handleAnswer called:', {
        questionId,
        value,
        currentUser: user
      });

      // Call completeQuestion and wait for the response
      const response = await completeQuestion(questionId, value);
      console.log('Answer response:', response);

      if (response?.user) {
        // Update local answers state with the new answer and timestamp from response
        setAnswers(prev => ({
          ...prev,
          [questionId]: {
            answer: value,
            timestamp: response.answer.updatedAt,
            questionId
          }
        }));
      }

    } catch (error) {
      console.error('Onboarding - Error submitting answer:', error);
      throw error;
    }
  };

  if (!user || !questions) {
    return <div>Loading...</div>;
  }

  const totalXP = user.xp || 0;
  const badges = user.badges || [];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);
  const completionStatus = getCompletionStatus(answers, questions);

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
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((badge) => {
                const IconComponent = BADGE_ICONS[badge.icon.toLowerCase()] || Award;
                return (
                  <div
                    key={badge.id}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {badge.name}
                    </div>
                  </div>
                );
              })}
              {badges.length === 0 && (
                <div className="text-sm text-gray-500">No badges earned yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-gray-500" />
            Onboarding Questions
          </h2>

          <CompletionMessage status={completionStatus} />

          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionItem 
                key={question.id} 
                question={question}
                answer={answers[question.id]}
                onAnswer={handleAnswer}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}