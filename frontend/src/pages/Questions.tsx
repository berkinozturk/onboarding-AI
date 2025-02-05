import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import QuestionForm from '../components/QuestionForm';

const Questions: React.FC = () => {
  const { questions, deleteQuestion, initializeQuestions } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        await initializeQuestions();
        const currentQuestions = questions;
        console.log('Loaded questions:', currentQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    };
    loadQuestions();
  }, [initializeQuestions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteQuestion(id);
      await initializeQuestions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (question: any) => {
    setSelectedQuestion(question);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedQuestion(null);
    initializeQuestions(); // Refresh the list
  };

  const renderOptions = (options: any) => {
    console.log('Rendering options for question:', options);
    
    if (!options) {
      console.warn('Options is null or undefined');
      return null;
    }

    if (!Array.isArray(options)) {
      console.warn('Options is not an array:', typeof options, options);
      return null;
    }

    if (options.length === 0) {
      console.warn('Options array is empty');
      return null;
    }

    return (
      <div className="mt-2">
        <p className="text-sm font-medium">Options:</p>
        <ul className="list-disc list-inside text-sm text-gray-600">
          {options.map((option: string, index: number) => (
            <li key={index}>{option}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Questions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Question
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedQuestion ? 'Edit Question' : 'Add Question'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedQuestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <QuestionForm
              onSuccess={handleFormSuccess}
              initialData={selectedQuestion}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {questions.map((question) => {
          console.log('Rendering question:', {
            id: question.id,
            text: question.text,
            type: question.type,
            options: question.options,
            optionsType: typeof question.options
          });
          
          return (
            <div
              key={question.id}
              className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{question.text}</h3>
                  <p className="text-gray-600 text-sm mb-1">
                    Type: {question.type}
                  </p>
                  <p className="text-gray-600 text-sm mb-1">
                    Category: {question.category}
                  </p>
                  <p className="text-gray-600 text-sm">
                    XP Reward: {question.xpReward}
                  </p>
                  {question.type === 'multiple_choice' && renderOptions(question.options)}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Questions; 