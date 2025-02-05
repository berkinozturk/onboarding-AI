import React, { useState } from 'react';
import Layout from '../../components/shared/Layout';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit, Trash2, X } from 'lucide-react';
import type { Question, Badge } from '../../types';
import { useStore } from '../../store';

const questionCategories = ['General', 'Policies', 'Culture', 'Safety', 'Equipment', 'Team Building', 'Office Navigation'];

interface QuestionFormData {
  text: string;
  type: 'text' | 'boolean' | 'multiple_choice';
  category: string;
  xpReward: number;
  options?: string[];
  correctAnswer?: string;
  badge?: {
    id?: string;
    name: string;
    description: string;
    icon: string;
    requiredXP: number;
    image?: string;
  };
}

const initialFormData: QuestionFormData = {
  text: '',
  type: 'boolean',
  category: 'General',
  xpReward: 50,
  options: [],
  correctAnswer: '',
  badge: undefined
};

export default function AdminChatbot() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [newOption, setNewOption] = useState('');

  const questions = useStore((state) => state.questions);
  const addQuestion = useStore((state) => state.addQuestion);
  const updateQuestion = useStore((state) => state.updateQuestion);
  const deleteQuestion = useStore((state) => state.deleteQuestion);
  const reorderQuestions = useStore((state) => state.reorderQuestions);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowBadgeForm(false);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const badge = showBadgeForm && formData.badge?.name && formData.badge?.description ? {
      id: formData.badge.id || `badge-${Date.now()}`,
      name: formData.badge.name,
      description: formData.badge.description,
      requiredXP: formData.badge.requiredXP || formData.xpReward,
      image: formData.badge.image || '',
      icon: 'star'
    } : undefined;

    const questionData = {
      ...formData,
      order: 0,
      badge
    };
    
    try {
      if (editingId) {
        await updateQuestion({ ...questionData, id: editingId });
      } else {
        await addQuestion(questionData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleEdit = (question: Question) => {
    setFormData({
      text: question.text,
      type: question.type,
      category: question.category,
      xpReward: question.xpReward,
      options: question.options || [],
      correctAnswer: question.correctAnswer || '',
      badge: question.badge
    });
    setEditingId(question.id);
    setShowBadgeForm(!!question.badge);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteQuestion(id);
    setShowDeleteConfirm(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderQuestions(result.source.index, result.destination.index);
  };

  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...(formData.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (optionToRemove: string) => {
    setFormData({
      ...formData,
      options: formData.options?.filter(opt => opt !== optionToRemove) || [],
      correctAnswer: formData.correctAnswer === optionToRemove ? '' : formData.correctAnswer
    });
  };

  const QuestionCard = React.memo(({ question, index }: { question: Question; index: number }) => (
    <Draggable draggableId={question.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
        >
          <div className="flex items-start gap-4">
            <div {...provided.dragHandleProps} className="mt-1">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">
                    {question.category}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {question.type}
                  </span>
                  {question.badge && (
                    <span className="text-sm font-medium text-purple-600">
                      Has Badge
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(question.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-900">{question.text}</p>
              <p className="text-sm text-gray-500 mt-1">
                XP Reward: {question.xpReward}
              </p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  ));

  return (
    <Layout>
      <div className="pt-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-4"
                >
                  {questions.map((question, index) => (
                    <QuestionCard key={question.id} question={question} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Question' : 'Add Question'}
              </h2>
              <button onClick={resetForm}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Question Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionFormData['type'];
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      // Reset options and correctAnswer when changing type
                      options: newType === 'multiple_choice' ? [] : undefined,
                      correctAnswer: undefined // Always reset correctAnswer when changing type
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="boolean">Yes/No</option>
                  <option value="text">Text</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  {questionCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">XP Reward</label>
                <input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: Math.max(0, parseInt(e.target.value)) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasBadge"
                  checked={showBadgeForm}
                  onChange={(e) => {
                    setShowBadgeForm(e.target.checked);
                    if (!e.target.checked) {
                      setFormData({ ...formData, badge: undefined });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasBadge" className="text-sm font-medium text-gray-700">
                  Award Badge for Completion
                </label>
              </div>
              {showBadgeForm && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badge Name</label>
                    <input
                      type="text"
                      value={formData.badge?.name || ''}
                      onChange={(e) => {
                        const currentBadge = formData.badge || {
                          description: '',
                          requiredXP: formData.xpReward,
                          image: '',
                          icon: 'star'
                        };
                        setFormData({
                          ...formData,
                          badge: {
                            ...currentBadge,
                            name: e.target.value
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={showBadgeForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badge Description</label>
                    <textarea
                      value={formData.badge?.description || ''}
                      onChange={(e) => {
                        const currentBadge = formData.badge || {
                          name: '',
                          requiredXP: formData.xpReward,
                          image: '',
                          icon: 'star'
                        };
                        setFormData({
                          ...formData,
                          badge: {
                            ...currentBadge,
                            description: e.target.value
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      required={showBadgeForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badge Image URL</label>
                    <input
                      type="url"
                      value={formData.badge?.image || ''}
                      onChange={(e) => {
                        const currentBadge = formData.badge || {
                          name: '',
                          description: '',
                          requiredXP: formData.xpReward,
                          icon: 'star'
                        };
                        setFormData({
                          ...formData,
                          badge: {
                            ...currentBadge,
                            image: e.target.value
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                      required={showBadgeForm}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Required XP</label>
                    <input
                      type="number"
                      value={formData.badge?.requiredXP || formData.xpReward}
                      onChange={(e) => {
                        const currentBadge = formData.badge || {
                          name: '',
                          description: '',
                          image: '',
                          icon: 'star'
                        };
                        setFormData({
                          ...formData,
                          badge: {
                            ...currentBadge,
                            requiredXP: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min={0}
                      required={showBadgeForm}
                    />
                  </div>
                </div>
              )}
              {formData.type === 'multiple_choice' && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <div className="mt-2 space-y-2">
                      {formData.options?.map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === option}
                            onChange={() => setFormData({ ...formData, correctAnswer: option })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1">{option}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(option)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add new option..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (newOption.trim()) {
                            setFormData({
                              ...formData,
                              options: [...(formData.options || []), newOption.trim()]
                            });
                            setNewOption('');
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Add'} Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}