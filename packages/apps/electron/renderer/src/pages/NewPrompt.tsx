import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PromptCreationWizard } from '../components/PromptCreationWizard/PromptCreationWizard';
import { PromptFormData } from '../components/PromptCreationWizard/types';
import { usePrompts } from '../hooks/useElectronAPI';

const NewPrompt: React.FC = () => {
  const [showWizard, setShowWizard] = useState(true);
  const navigate = useNavigate();
  const { createPrompt } = usePrompts();

  const handleWizardComplete = async (promptData: PromptFormData) => {
    try {
      const result = await createPrompt({
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
        content: promptData.content,
        tags: promptData.tags,
        variables: promptData.variables.reduce((acc, variable) => {
          acc[variable.name] = {
            type: variable.type,
            description: variable.description || '',
            required: variable.required,
            defaultValue: variable.defaultValue,
            validation: variable.validation,
          };
          return acc;
        }, {} as Record<string, any>),
        author: promptData.author,
        version: promptData.version,
      });

      if (result.success) {
        toast.success('Prompt created successfully!');
        navigate('/prompts');
      } else {
        toast.error(`Failed to create prompt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleWizardClose = () => {
    navigate(-1); // Go back to previous page
  };

  if (!showWizard) {
    return null;
  }

  return (
    <PromptCreationWizard
      onComplete={handleWizardComplete}
      onClose={handleWizardClose}
    />
  );
};

export default NewPrompt;
