'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/SupabaseProvider';
import type { AssessmentConfig, AssessmentAttempt } from '@/types';

interface AssessmentRendererProps {
  sectionId: string;
  chapterId: string;
  assessmentConfig: AssessmentConfig;
}

export default function AssessmentRenderer({ 
  sectionId, 
  chapterId, 
  assessmentConfig 
}: AssessmentRendererProps) {
  const { user } = useSupabase();
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; pointsEarned: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user, sectionId]);

  const fetchAttempts = async () => {
    try {
      const response = await fetch(`/api/assessments/attempts?chapterId=${chapterId}&sectionId=${sectionId}`);
      if (response.ok) {
        const data = await response.json();
        setAttempts(data.attempts || []);
      }
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
    }
  };

  const canAttempt = () => {
    if (assessmentConfig.allowRetries === true) return true;
    if (assessmentConfig.allowRetries === false) return attempts.length === 0;
    if (typeof assessmentConfig.allowRetries === 'number') {
      return attempts.length < assessmentConfig.allowRetries;
    }
    return attempts.length === 0;
  };

  const submitAnswer = async () => {
    if (!user || !userAnswer || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assessments/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId,
          sectionId,
          userAnswer,
          assessmentConfig
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastResult({
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned
        });
        setShowResult(assessmentConfig.showFeedback);
        await fetchAttempts();
        if (!assessmentConfig.allowRetries || assessmentConfig.allowRetries === false) {
          // Don't clear answer if no retries allowed
        } else {
          setUserAnswer(null);
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    switch (assessmentConfig.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {assessmentConfig.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type={assessmentConfig.partialCredit ? 'checkbox' : 'radio'}
                  name="multiple-choice"
                  value={option}
                  checked={
                    assessmentConfig.partialCredit 
                      ? (userAnswer as string[])?.includes(option)
                      : userAnswer === option
                  }
                  onChange={(e) => {
                    if (assessmentConfig.partialCredit) {
                      const currentAnswers = (userAnswer as string[]) || [];
                      if (e.target.checked) {
                        setUserAnswer([...currentAnswers, option]);
                      } else {
                        setUserAnswer(currentAnswers.filter(a => a !== option));
                      }
                    } else {
                      setUserAnswer(option);
                    }
                  }}
                  disabled={!canAttempt()}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="true-false"
                  value={option.toLowerCase()}
                  checked={userAnswer === (option === 'True')}
                  onChange={() => setUserAnswer(option === 'True')}
                  disabled={!canAttempt()}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <textarea
            value={userAnswer || ''}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={!canAttempt()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter your answer..."
          />
        );

      default:
        return <div className="text-red-500">Unsupported question type</div>;
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      {/* Question Header */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">❓</span>
        <span className="text-sm font-medium text-blue-700">
          Assessment ({assessmentConfig.points} {assessmentConfig.points === 1 ? 'point' : 'points'})
        </span>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          {assessmentConfig.questionText}
        </h3>
      </div>

      {/* Answer Input */}
      <div className="mb-6">
        {renderQuestionInput()}
      </div>

      {/* Submit Button */}
      {canAttempt() && (
        <div className="mb-4">
          <button
            onClick={submitAnswer}
            disabled={!userAnswer || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      )}

      {/* Results and Feedback */}
      {showResult && lastResult && (
        <div className={`p-4 rounded-md mb-4 ${
          lastResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {lastResult.isCorrect ? '✅' : '❌'}
            </span>
            <span className={`font-medium ${
              lastResult.isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            <span className="text-sm text-gray-600">
              ({lastResult.pointsEarned}/{assessmentConfig.points} points)
            </span>
          </div>
          {assessmentConfig.explanation && (
            <div className="mt-2 text-sm text-gray-700">
              <strong>Explanation:</strong> {assessmentConfig.explanation}
            </div>
          )}
        </div>
      )}

      {/* Attempt History */}
      {attempts.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Previous Attempts ({attempts.length})
          </h4>
          <div className="space-y-2">
            {attempts.slice(-3).map((attempt, index) => (
              <div key={attempt.id} className="flex items-center space-x-2 text-sm">
                <span className={attempt.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {attempt.isCorrect ? '✅' : '❌'}
                </span>
                <span className="text-gray-600">
                  Attempt {attempt.attemptNumber}: {attempt.pointsEarned}/{attempt.maxPoints} points
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(attempt.attemptedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          
          {!canAttempt() && (
            <div className="mt-3 text-sm text-orange-600 bg-orange-50 p-2 rounded">
              {typeof assessmentConfig.allowRetries === 'number' 
                ? `Maximum attempts reached (${assessmentConfig.allowRetries})`
                : 'No retries allowed'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}