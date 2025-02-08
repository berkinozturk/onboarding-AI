import React, { useState } from 'react';
import Layout from '../../components/shared/Layout';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Edit, Trash2, X } from 'lucide-react';
import type { Question } from '../../types';
import { useStore } from '../../store';
import QuestionForm from '../../components/admin/QuestionForm';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const questions = useStore((state) => state.questions);
  const deleteQuestion = useStore((state) => state.deleteQuestion);
  const reorderQuestions = useStore((state) => state.reorderQuestions);

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
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
              <button onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <QuestionForm
              initialData={editingId ? questions.find(q => q.id === editingId) : undefined}
              onSuccess={() => {
                setShowModal(false);
                setEditingId(null);
              }}
            />
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