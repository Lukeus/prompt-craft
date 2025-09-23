import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Step components
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ContentCreationStep } from './steps/ContentCreationStep';
import { VariablesConfigStep } from './steps/VariablesConfigStep';
import { ReviewAndTestStep } from './steps/ReviewAndTestStep';

// Types
import { PromptFormData, WizardStep } from './types';

interface PromptCreationWizardProps {
  onClose: () => void;
  onComplete: (promptData: PromptFormData) => void;
  initialData?: Partial<PromptFormData>;
}

const STEPS: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Set up the prompt name, description, and category',
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Write your prompt content with variable placeholders',
  },
  {
    id: 'variables-config',
    title: 'Variables Configuration',
    description: 'Define variables and their types for dynamic content',
  },
  {
    id: 'review-test',
    title: 'Review & Test',
    description: 'Review your prompt and test it with sample values',
  },
];

export const PromptCreationWizard: React.FC<PromptCreationWizardProps> = ({
  onClose,
  onComplete,
  initialData = {},
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    category: 'work',
    tags: [],
    content: '',
    variables: [],
    author: '',
    version: '1.0.0',
    ...initialData,
  });
  
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: true, // Variables are optional by default
    3: false,
  });

  const currentStep = STEPS[currentStepIndex];

  const updateFormData = useCallback((updates: Partial<PromptFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStepValidation = useCallback((stepIndex: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [stepIndex]: isValid }));
  }, []);

  const isStepValid = useCallback((index: number) => {
    return Boolean(stepValidation[index]);
  }, [stepValidation]);

  const canNavigateToStep = useCallback((targetIndex: number) => {
    if (targetIndex === currentStepIndex) {
      return true;
    }

    if (targetIndex < currentStepIndex) {
      return true;
    }

    for (let index = 0; index < targetIndex; index += 1) {
      if (!isStepValid(index)) {
        return false;
      }
    }

    return true;
  }, [currentStepIndex, isStepValid]);

  const handleNext = useCallback(() => {
    if (!isStepValid(currentStepIndex)) {
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, isStepValid]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex === currentStepIndex) {
      return;
    }

    if (!canNavigateToStep(stepIndex)) {
      return;
    }

    setCurrentStepIndex(stepIndex);
  }, [currentStepIndex, canNavigateToStep]);

  const handleComplete = useCallback(() => {
    if (!isStepValid(currentStepIndex)) {
      return;
    }
    onComplete(formData);
  }, [formData, isStepValid, onComplete]);

  const canProceed = isStepValid(currentStepIndex);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <BasicInfoStep
            data={formData}
            onChange={updateFormData}
            onValidationChange={(isValid) => updateStepValidation(0, isValid)}
          />
        );
      case 1:
        return (
          <ContentCreationStep
            data={formData}
            onChange={updateFormData}
            onValidationChange={(isValid) => updateStepValidation(1, isValid)}
          />
        );
      case 2:
        return (
          <VariablesConfigStep
            data={formData}
            onChange={updateFormData}
            onValidationChange={(isValid) => updateStepValidation(2, isValid)}
          />
        );
      case 3:
        return (
          <ReviewAndTestStep
            data={formData}
            onChange={updateFormData}
            onValidationChange={(isValid) => updateStepValidation(3, isValid)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Wizard Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl bg-dark-800/95 backdrop-blur-xl rounded-2xl border border-dark-600 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-600">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Create New Prompt
              </h2>
              <p className="text-gray-400 text-sm">
                Step {currentStepIndex + 1} of {STEPS.length}: {currentStep.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 border-b border-dark-600">
            <div className="flex items-center space-x-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center flex-1"
                >
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!canNavigateToStep(index)}
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200
                      ${index === currentStepIndex
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : index < currentStepIndex
                        ? 'border-green-500 bg-green-500 text-white'
                        : canNavigateToStep(index)
                        ? 'border-dark-400 text-gray-400 hover:border-dark-300'
                        : 'border-dark-600 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-3 transition-colors duration-200
                        ${index < currentStepIndex ? 'bg-green-500' : 'bg-dark-600'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-3 text-center">
              <h3 className="font-semibold text-white">{currentStep.title}</h3>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-h-[400px]"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-dark-600">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-200
                ${isFirstStep
                  ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  : 'bg-dark-700 text-white hover:bg-dark-600 hover:scale-105'
                }
              `}
            >
              Previous
            </button>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">
                {currentStepIndex + 1} / {STEPS.length}
              </span>
            </div>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={!canProceed}
                className={`
                  px-8 py-2 rounded-lg font-medium transition-all duration-200
                  ${canProceed
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 hover:scale-105 shadow-lg hover:shadow-primary-500/25'
                    : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Create Prompt
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200
                  ${canProceed
                    ? 'bg-primary-600 text-white hover:bg-primary-500 hover:scale-105'
                    : 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Next
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PromptCreationWizard;
