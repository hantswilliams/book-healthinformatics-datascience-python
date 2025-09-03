'use client';

import { useState } from 'react';
import type { AssessmentConfig } from '@/types';

interface AssessmentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (config: AssessmentConfig) => void;
}

interface AssessmentTypeOption {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  title: string;
  description: string;
  icon: string;
  example: string;
  defaultConfig: AssessmentConfig;
}

export default function AssessmentTypeModal({ isOpen, onClose, onSelectType }: AssessmentTypeModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const assessmentTypes: AssessmentTypeOption[] = [
    {
      type: 'multiple_choice',
      title: 'Multiple Choice',
      description: 'Single or multiple correct answers with configurable options',
      icon: '📋',
      example: 'Which of the following are Python data types? (Select all)',
      defaultConfig: {
        questionText: 'What is the correct answer?',
        questionType: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: 'This is the explanation for the correct answer.',
        points: 1,
        allowRetries: true,
        showFeedback: true,
        partialCredit: false,
        caseSensitive: false
      }
    },
    {
      type: 'true_false',
      title: 'True/False',
      description: 'Simple boolean questions with true or false answers',
      icon: '✅❌',
      example: 'Python is a dynamically typed language. (True/False)',
      defaultConfig: {
        questionText: 'Is this statement true or false?',
        questionType: 'true_false',
        correctAnswer: true,
        explanation: 'This is the explanation for the correct answer.',
        points: 1,
        allowRetries: true,
        showFeedback: true
      }
    },
    {
      type: 'short_answer',
      title: 'Short Answer',
      description: 'Text-based answers with flexible matching options',
      icon: '✏️',
      example: 'What keyword is used to define a function in Python?',
      defaultConfig: {
        questionText: 'Enter your answer:',
        questionType: 'short_answer',
        correctAnswer: 'def',
        explanation: 'The "def" keyword is used to define functions in Python.',
        points: 1,
        allowRetries: true,
        showFeedback: true,
        caseSensitive: false
      }
    }
  ];

  const handleSelectType = (typeOption: AssessmentTypeOption) => {
    onSelectType(typeOption.defaultConfig);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Select Assessment Type</h3>
            <p className="text-sm text-gray-500">Choose the type of question you want to create</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold focus:outline-none"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assessmentTypes.map((typeOption) => (
              <div
                key={typeOption.type}
                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedType === typeOption.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedType(typeOption.type)}
              >
                {/* Type Icon */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{typeOption.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900">{typeOption.title}</h4>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 text-center">
                  {typeOption.description}
                </p>

                {/* Example */}
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Example:</p>
                  <p className="text-sm text-gray-700 italic">"{typeOption.example}"</p>
                </div>

                {/* Features */}
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Configurable scoring
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Retry settings
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Instant feedback
                  </div>
                  {typeOption.type === 'multiple_choice' && (
                    <div className="flex items-center text-xs text-gray-600">
                      <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Partial credit support
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedType === typeOption.type && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedType) {
                const typeOption = assessmentTypes.find(t => t.type === selectedType);
                if (typeOption) {
                  handleSelectType(typeOption);
                }
              }
            }}
            disabled={!selectedType}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Assessment
          </button>
        </div>
      </div>
    </div>
  );
}