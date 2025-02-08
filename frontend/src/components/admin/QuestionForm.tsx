import React, { useState } from 'react';
import { useStore } from '../../store';
import type { Question, BadgeIcon } from '../../types';

const BADGE_ICONS: { value: BadgeIcon; label: string }[] = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'shield', label: 'Shield' },
  { value: 'users', label: 'Users' },
  { value: 'star', label: 'Star' },
  { value: 'book', label: 'Book' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'target', label: 'Target' },
  { value: 'award', label: 'Award' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'crown', label: 'Crown' },
  { value: 'flag', label: 'Flag' },
  { value: 'heart', label: 'Heart' },
  { value: 'lightbulb', label: 'Lightbulb' },
  { value: 'medal', label: 'Medal' },
  { value: 'trophy', label: 'Trophy' }
];

interface QuestionFormProps {
  initialData?: Question;
  onSuccess: () => void;
}

export default function QuestionForm({ initialData, onSuccess }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    text: initialData?.text || '',
    type: initialData?.type || 'boolean',
    category: initialData?.category || 'General',
    xpReward: initialData?.xpReward || 50,
    options: initialData?.options || [],
    correctAnswer: initialData?.correctAnswer || '',
    awardBadge: initialData?.badge ? true : false,
    badge: initialData?.badge ? {
      id: initialData.badge.id,
      name: initialData.badge.name,
      description: initialData.badge.description,
      icon: initialData.badge.icon || 'star',
      requiredXP: initialData.badge.requiredXP
    } : {
      id: undefined,
      name: '',
      description: '',
      icon: 'star' as BadgeIcon,
      requiredXP: 50
    }
  });

  const [newOption, setNewOption] = useState('');
  const addQuestion = useStore((state) => state.addQuestion);
  const updateQuestion = useStore((state) => state.updateQuestion);

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const questionData = {
        text: formData.text,
        type: formData.type as 'boolean' | 'text' | 'multiple_choice',
        category: formData.category,
        xpReward: Number(formData.xpReward),
        options: formData.type === 'multiple_choice' ? formData.options : [],
        correctAnswer: formData.type === 'multiple_choice' ? formData.correctAnswer : '',
        order: initialData?.order || 0,
        badge: formData.awardBadge ? {
          ...formData.badge,
          id: formData.badge.id || `badge-${Date.now()}`
        } : undefined
      };

      if (initialData) {
        await updateQuestion({ ...questionData, id: initialData.id });
      } else {
        await addQuestion(questionData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Question['type'] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="boolean">Yes/No</option>
          <option value="text">Text</option>
          <option value="multiple_choice">Multiple Choice</option>
        </select>
      </div>

      {formData.type === 'multiple_choice' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Options</label>
            <div className="mt-2 space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={option === formData.correctAnswer}
                    onChange={() => setFormData({ ...formData, correctAnswer: option })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add new option"
              />
              <button
                type="button"
                onClick={handleAddOption}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="General">General</option>
          <option value="Office Navigation">Office Navigation</option>
          <option value="Safety">Safety</option>
          <option value="Team Building">Team Building</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">XP Reward</label>
        <input
          type="number"
          value={formData.xpReward}
          onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="awardBadge"
            checked={formData.awardBadge}
            onChange={(e) => setFormData({ ...formData, awardBadge: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="awardBadge" className="ml-2 block text-sm text-gray-900">
            Award Badge for Completion
          </label>
        </div>

        {formData.awardBadge && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">Badge Name</label>
              <input
                type="text"
                value={formData.badge.name}
                onChange={(e) => setFormData({
                  ...formData,
                  badge: { ...formData.badge, name: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.awardBadge}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Badge Description</label>
              <textarea
                value={formData.badge.description}
                onChange={(e) => setFormData({
                  ...formData,
                  badge: { ...formData.badge, description: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={2}
                required={formData.awardBadge}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Badge Icon</label>
              <select
                value={formData.badge.icon}
                onChange={(e) => setFormData({
                  ...formData,
                  badge: { ...formData.badge, icon: e.target.value as BadgeIcon }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.awardBadge}
              >
                {BADGE_ICONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Required XP</label>
              <input
                type="number"
                value={formData.badge.requiredXP}
                onChange={(e) => setFormData({
                  ...formData,
                  badge: { ...formData.badge, requiredXP: parseInt(e.target.value) }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                required={formData.awardBadge}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Add'} Question
        </button>
      </div>
    </form>
  );
} 