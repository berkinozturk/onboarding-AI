import React, { useState } from 'react';
import { Question } from '../types';
import { useStore } from '../store';

interface QuestionFormProps {
  onSuccess?: () => void;
  initialData?: Question;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ onSuccess, initialData }) => {
  const { addQuestion, updateQuestion } = useStore();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    text: initialData?.text || '',
    type: initialData?.type || 'text',
    category: initialData?.category || '',
    xpReward: initialData?.xpReward || 50,
    options: initialData?.options || [],
    correctAnswer: initialData?.correctAnswer || ''
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('Form data before submission:', formData);

      // Validate required fields
      if (!formData.text || !formData.type || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      // Validate options for multiple choice questions
      if (formData.type === 'multiple_choice' && formData.options.length < 2) {
        throw new Error('Multiple choice questions must have at least 2 options');
      }

      const questionData = {
        ...formData,
        options: formData.type === 'multiple_choice' ? formData.options : []
      };

      console.log('Submitting question data:', questionData);

      if (initialData?.id) {
        await updateQuestion({ ...questionData, id: initialData.id });
      } else {
        await addQuestion(questionData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error submitting question:', error);
      setError(error.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Question Text *
        </label>
        <input
          type="text"
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="text">Text</option>
          <option value="multiple_choice">Multiple Choice</option>
        </select>
      </div>

      {formData.type === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Options
          </label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={`Option ${index + 1}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + Add Option
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category *
        </label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          XP Reward
        </label>
        <input
          type="number"
          value={formData.xpReward}
          onChange={(e) => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min="0"
        />
      </div>

      {formData.type === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correct Answer
          </label>
          <select
            value={formData.correctAnswer}
            onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select correct answer</option>
            {formData.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Add')} Question
        </button>
      </div>
    </form>
  );
};

export default QuestionForm; 