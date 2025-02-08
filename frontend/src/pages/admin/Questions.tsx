import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import QuestionForm from '../../components/admin/QuestionForm';
import type { Question } from '../../types';
import { Edit2, Trash2, Plus, Coffee, Shield, Users, Star, Book, Rocket, Target, Award, Briefcase, Crown, Flag, Heart, Lightbulb, Medal, Trophy } from 'lucide-react';

const BADGE_ICONS = [
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'book', label: 'Book', icon: Book },
  { value: 'rocket', label: 'Rocket', icon: Rocket },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'crown', label: 'Crown', icon: Crown },
  { value: 'flag', label: 'Flag', icon: Flag },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { value: 'medal', label: 'Medal', icon: Medal },
  { value: 'trophy', label: 'Trophy', icon: Trophy }
];

export default function Questions() {
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    questions, 
    deleteQuestion,
    initializeQuestions 
  } = useStore();

  // Initialize questions when component mounts
  useEffect(() => {
    initializeQuestions();
  }, [initializeQuestions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    setIsDeleting(true);
    try {
      await deleteQuestion(id);
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingQuestion(null);
    // Refresh questions
    initializeQuestions();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Onboarding Questions Configuration</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingQuestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <QuestionForm
              initialData={editingQuestion || undefined}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {question.category}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {question.type}
                  </span>
                  {question.badge && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Has Badge
                    </span>
                  )}
                </div>
                <p className="text-gray-900">{question.text}</p>
                <p className="text-sm text-gray-500 mt-1">XP Reward: {question.xpReward}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(question)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  disabled={isDeleting}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 