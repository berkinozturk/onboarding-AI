import React, { useState } from 'react';
import { useStore } from '../../store';
import type { Question } from '../../types';

interface QuestionFormProps {
  onSuccess?: () => void;
  initialData?: Question;
}

export default function QuestionForm({ onSuccess, initialData }: QuestionFormProps) {
  console.log('QuestionForm component rendered'); // Component render log

  const { addQuestion, updateQuestion } = useStore();

  const [formData, setFormData] = useState({
    text: initialData?.text || '',
    type: initialData?.type || 'boolean',
    category: initialData?.category || 'General',
    xpReward: initialData?.xpReward || 50,
    options: initialData?.options || [],
    correctAnswer: initialData?.correctAnswer || '',
    order: initialData?.order || 0
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit event triggered');

    // Log form data
    console.log('Form data:', formData);

    // Basic validation
    if (!formData.text || !formData.type || !formData.category) {
      console.log('Validation failed');
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialData?.id) {
        console.log('Updating question:', initialData.id);
        await updateQuestion(initialData.id, formData);
      } else {
        console.log('Creating new question');
        await addQuestion(formData);
      }

      // Reset form
      setFormData({
        text: '',
        type: 'boolean',
        category: 'General',
        xpReward: 50,
        options: [],
        correctAnswer: '',
        order: 0
      });

      // Call success callback
      onSuccess?.();
    } catch (error: any) {
      console.error('Error details:', error);
      setError(error.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: name === 'xpReward' ? Number(value) : value
    }));
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4"
    >
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Question Text</label>
        <textarea
          name="text"
          value={formData.text}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="boolean">Yes/No</option>
            <option value="text">Text</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">XP Reward</label>
        <input
          type="number"
          name="xpReward"
          value={formData.xpReward}
          onChange={handleChange}
          required
          min={0}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
} 