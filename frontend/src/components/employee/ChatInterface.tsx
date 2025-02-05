import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import type { Question } from '../../../../src/types';
import { useStore } from '../../store';
import { api } from '../../../../src/services/api';

export default function ChatInterface() {
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const user = useStore((state) => state.user);
  const questions = useStore((state) => state.questions);
  const questionAnswers = useStore((state) => state.questionAnswers);
  const addXP = useStore((state) => state.addXP);
  const completeQuestion = useStore((state) => state.completeQuestion);
  const setUser = useStore((state) => state.setUser);

  // Fetch user's answers when component mounts
  useEffect(() => {
    const fetchAnswers = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching answers for user:', user.id);
        const response = await api.get(`/answers/user/${user.id}`);
        console.log('Answers response:', response.data);
        
        if (response.data) {
          const answersMap = response.data.reduce((acc: Record<string, any>, answer: any) => {
            acc[answer.questionId] = {
              answer: answer.answer === 'true' ? true : answer.answer === 'false' ? false : answer.answer,
              timestamp: answer.createdAt || answer.timestamp,
              questionId: answer.questionId
            };
            return acc;
          }, {});
          console.log('Processed answers:', answersMap);
          setAnswers(answersMap);
        }
      } catch (error) {
        console.error('Error fetching answers:', error);
      }
    };

    fetchAnswers();
  }, [user]);

  // Get unanswered questions
  const unansweredQuestions = useMemo(() => {
    if (!user || !questions) return [];
    
    // Use completedQuestions directly from user data
    const completedQuestions = user.completedQuestions || [];
    
    // Filter out completed questions
    return questions.filter(q => !completedQuestions.includes(q.id));
  }, [user, questions]);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!unansweredQuestions || unansweredQuestions.length === 0) return null;
    return unansweredQuestions[currentQuestionIndex];
  }, [unansweredQuestions, currentQuestionIndex]);

  useEffect(() => {
    // Update review mode when all questions are answered
    const isComplete = user?.completedQuestions?.length === questions.length;
    setIsReviewMode(isComplete);
  }, [user?.completedQuestions?.length, questions.length]);

  const handleSubmit = async (questionId: string, answer: string | boolean) => {
    if (!user || isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log('Submitting answer:', { questionId, answer }); // Debug log

      const response = await api.post('/answers', {
        questionId,
        answer
      });

      console.log('Answer response:', response.data); // Debug log

      if (response.data.user) {
        // Update user in store
        setUser(response.data.user);
        
        // Complete question in store
        completeQuestion(questionId, answer);

        // Update local answers state
        setAnswers(prev => ({
          ...prev,
          [questionId]: response.data.answer
        }));

        // Clear text answer if it's a text question
        setTextAnswer('');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question, existingAnswer?: { answer: string | boolean }) => {
    // Get answer from local state first, then fall back to store
    const answer = answers[question.id] || existingAnswer;

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(question.options || []).map((option, index) => (
              <button
                key={index}
                onClick={() => handleSubmit(question.id, option)}
                disabled={isSubmitting}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  answer?.answer === option
                    ? 'bg-blue-600 text-white'
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

      case 'boolean':
        const boolAnswer = typeof answer?.answer === 'string' 
          ? answer.answer === 'true'
          : answer?.answer;
        
        return (
          <div className="space-x-4">
            <button
              onClick={() => handleSubmit(question.id, true)}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg transition-colors ${
                boolAnswer === true
                  ? 'bg-green-600 text-white'
                  : isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Yes'}
            </button>
            <button
              onClick={() => handleSubmit(question.id, false)}
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg transition-colors ${
                boolAnswer === false
                  ? 'bg-red-600 text-white'
                  : isSubmitting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'No'}
            </button>
          </div>
        );

      case 'text':
        return (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(question.id, textAnswer);
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              value={answer?.answer as string || textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
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
              <Send className="w-5 h-5" />
            </button>
          </form>
        );
    }
  }

  if (!currentQuestion && !isReviewMode) {
    // Automatically set review mode when all questions are completed
    setIsReviewMode(true);
    return null; // Return null to prevent showing anything while state updates
  }

  return (
    <div className="space-y-6">
      {isReviewMode || !currentQuestion ? (
        // Review mode - show all questions
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            Onboarding Questions
          </h3>
          <div className="space-y-4">
            {questions.map((question) => {
              const answer = answers[question.id];
              
              return (
                <div key={question.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <MessageCircle className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-gray-600">{question.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {renderQuestionInput(question, answer)}
                      {answer && (
                        <p className="text-xs text-gray-500">
                          Last modified: {new Date(answer.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Sequential mode - show current question with animation
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start gap-3"
            >
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 text-lg">{currentQuestion.text}</p>
                <div className="mt-4">
                  {renderQuestionInput(currentQuestion)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}