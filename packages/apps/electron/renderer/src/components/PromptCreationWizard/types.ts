export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description?: string;
  required: boolean;
  defaultValue?: string | number | boolean | string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // For enum-like values
  };
}

export interface PromptFormData {
  name: string;
  description: string;
  category: 'work' | 'personal' | 'shared';
  tags: string[];
  content: string;
  variables: PromptVariable[];
  author: string;
  version: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

export interface StepProps {
  data: PromptFormData;
  onChange: (updates: Partial<PromptFormData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface TestResult {
  success: boolean;
  renderedContent?: string;
  error?: string;
}

export interface VariableTestValue {
  name: string;
  value: string | number | boolean | string[];
  type: PromptVariable['type'];
}