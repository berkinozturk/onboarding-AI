import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStore } from '../../store';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/shared/Layout';
import type { Question } from '../../../../src/types';

export default function ChatbotConfig() {
  const questions = useStore((state) => state.questions);
  const reorderQuestions = useStore((state) => state.reorderQuestions);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    // Create a new array of questions with updated order
    const reorderedQuestions = Array.from(questions);
    const [removed] = reorderedQuestions.splice(startIndex, 1);
    reorderedQuestions.splice(endIndex, 0, removed);

    // Update the order property for each question
    const updatedQuestions = reorderedQuestions.map((question, index) => ({
      id: question.id,
      order: index + 1
    }));

    // Call the store's reorderQuestions function
    reorderQuestions(updatedQuestions);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleDelete = (questionId: string) => {
    setShowDeleteConfirm(questionId);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Chatbot Configuration</h1>
          <button 
            onClick={() => {
              setEditingQuestion(null);
              setShowEditModal(true);
            }}
            className="btn btn-primary"
          >
            + Add Question
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-4"
              >
                {questions.map((question, index) => (
                  <Draggable 
                    key={question.id} 
                    draggableId={question.id} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white p-4 rounded-lg shadow border border-gray-200 ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 ring-opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-move text-gray-400 hover:text-gray-600 px-2"
                            >
                              ⋮⋮
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-600">{question.category}</span>
                                <span className="text-sm text-blue-500">{question.type}</span>
                                {question.badge && (
                                  <span className="text-sm text-purple-500">Has Badge</span>
                                )}
                              </div>
                              <p className="text-gray-900">{question.text}</p>
                              <p className="text-sm text-gray-500">XP Reward: {question.xpReward}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(question)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(question.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Delete Question</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm) {
                      // Call delete function from store
                      // deleteQuestion(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 