import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
}

export function DraggableQuestion({ question, index }: Props) {
  return (
    <Draggable draggableId={question.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white p-4 rounded-lg shadow mb-4 border border-gray-200 ${
            snapshot.isDragging ? 'shadow-lg' : ''
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
              <button className="text-blue-500 hover:text-blue-700">
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button className="text-red-500 hover:text-red-700">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
} 