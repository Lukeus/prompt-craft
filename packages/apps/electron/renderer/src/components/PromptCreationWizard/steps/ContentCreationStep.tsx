import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  EyeIcon,
  CodeBracketIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import { StepProps, ValidationError, PromptVariable } from '../types';

const CONTENT_TEMPLATES = [
  {
    name: 'Code Review',
    content: `Please review the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
- Code quality and best practices
- Performance considerations
- Security issues
- Maintainability

Please provide specific feedback and suggestions for improvement.`
  },
  {
    name: 'Bug Analysis',
    content: `I'm experiencing a bug in my {{language}} application. Here's the relevant code:

\`\`\`{{language}}
{{code}}
\`\`\`

Error message: {{error_message}}

Expected behavior: {{expected_behavior}}
Actual behavior: {{actual_behavior}}

Please help me identify the root cause and suggest a fix.`
  },
  {
    name: 'Creative Writing',
    content: `Write a {{genre}} story with the following parameters:

Setting: {{setting}}
Main character: {{character}}
Theme: {{theme}}
Length: approximately {{word_count}} words

Make it engaging and follow the conventions of the {{genre}} genre.`
  }
];

export const ContentCreationStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidationChange,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const lastValidityRef = useRef<boolean | null>(null);

  // Extract variables from content
  const detectedVariables = useMemo(() => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    
    while ((match = variableRegex.exec(data.content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    
    return matches;
  }, [data.content]);

  // Auto-update variables based on content
  useEffect(() => {
    const existingVariableNames = data.variables.map(v => v.name);
    const newVariables: PromptVariable[] = [];
    
    detectedVariables.forEach(varName => {
      if (!existingVariableNames.includes(varName)) {
        newVariables.push({
          name: varName,
          type: 'string',
          description: `Variable for ${varName}`,
          required: true,
        });
      }
    });
    
    // Remove variables that are no longer in content
    const updatedVariables = data.variables.filter(v => 
      detectedVariables.includes(v.name)
    );
    
    if (newVariables.length > 0 || updatedVariables.length !== data.variables.length) {
      onChange({ variables: [...updatedVariables, ...newVariables] });
    }
  }, [detectedVariables, data.variables, onChange]);

  const validateForm = useCallback(() => {
    const nextErrors: ValidationError[] = [];

    // Content validation
    if (!data.content.trim()) {
      nextErrors.push({ field: 'content', message: 'Prompt content is required' });
    } else if (data.content.length < 20) {
      nextErrors.push({ field: 'content', message: 'Content must be at least 20 characters' });
    } else if (data.content.length > 5000) {
      nextErrors.push({ field: 'content', message: 'Content must be less than 5000 characters' });
    }

    // Check for unmatched braces
    const openBraces = (data.content.match(/\{\{/g) || []).length;
    const closeBraces = (data.content.match(/\}\}/g) || []).length;
    if (openBraces !== closeBraces) {
      nextErrors.push({ 
        field: 'content', 
        message: 'Unmatched variable braces. Make sure all {{variable}} have matching opening and closing braces.' 
      });
    }

    const nextIsValid = nextErrors.length === 0;
    return { nextErrors, nextIsValid };
  }, [data.content]);

  useEffect(() => {
    const { nextErrors, nextIsValid } = validateForm();

    setErrors(prevErrors => {
      const hasChanged =
        prevErrors.length !== nextErrors.length ||
        prevErrors.some((error, index) => {
          const candidate = nextErrors[index];
          if (!candidate) return true;
          return error.field !== candidate.field || error.message !== candidate.message;
        });

      return hasChanged ? nextErrors : prevErrors;
    });

    if (lastValidityRef.current !== nextIsValid) {
      lastValidityRef.current = nextIsValid;
      onValidationChange(nextIsValid);
    }
  }, [validateForm, onValidationChange]);

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  const handleTemplateSelect = (template: typeof CONTENT_TEMPLATES[0]) => {
    onChange({ content: template.content });
    setSelectedTemplate(template.name);
  };

  const renderContentPreview = () => {
    if (!data.content) return null;
    
    // Highlight variables in preview
    const highlightedContent = data.content.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="bg-primary-500/30 text-primary-300 px-1 rounded">{{$1}}</span>'
    );
    
    return (
      <div 
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: highlightedContent.replace(/\n/g, '<br/>') }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-500/20 rounded-full mb-4">
          <DocumentTextIcon className="w-8 h-8 text-secondary-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Content Creation
        </h3>
        <p className="text-gray-400">
          Write your prompt content with dynamic variables
        </p>
      </div>

      {/* Template Selection */}
      {!data.content && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-400" />
            Quick Start Templates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTENT_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateSelect(template)}
                className="p-4 bg-dark-700 border border-dark-600 rounded-lg text-left hover:border-primary-500 hover:bg-dark-700/70 transition-all duration-200"
              >
                <h5 className="font-medium text-white mb-2">{template.name}</h5>
                <p className="text-sm text-gray-400 line-clamp-3">
                  {template.content.substring(0, 100)}...
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              <DocumentTextIcon className="inline w-4 h-4 mr-1" />
              Prompt Content *
            </label>
            <div className="flex items-center space-x-2">
              {selectedTemplate && (
                <span className="text-xs text-primary-400">
                  Using template: {selectedTemplate}
                </span>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`
                  flex items-center px-3 py-1 text-xs rounded-md transition-all duration-200
                  ${showPreview 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                  }
                `}
              >
                <EyeIcon className="w-3 h-3 mr-1" />
                Preview
              </button>
            </div>
          </div>

          <textarea
            value={data.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder={`Write your prompt here...

Use {{variable_name}} for dynamic content that can be customized later.

Example:
Please review this {{language}} code:
{{code}}

Focus on {{focus_areas}} and provide specific feedback.`}
            rows={showPreview ? 12 : 20}
            className={`
              w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 resize-none transition-all duration-200 focus:outline-none focus:ring-2 font-mono text-sm
              ${getFieldError('content') 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/50'
              }
            `}
          />
          
          {getFieldError('content') && (
            <p className="mt-1 text-sm text-red-400">{getFieldError('content')}</p>
          )}
          
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>{data.content.length}/5000 characters</span>
            {detectedVariables.length > 0 && (
              <span className="text-primary-400">
                {detectedVariables.length} variable{detectedVariables.length !== 1 ? 's' : ''} detected
              </span>
            )}
          </div>
        </div>

        {/* Preview & Variables */}
        <div className="space-y-6">
          {/* Preview */}
          {showPreview && data.content && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                Content Preview
              </h4>
              <div className="p-4 bg-dark-700 border border-dark-600 rounded-lg max-h-64 overflow-y-auto">
                {renderContentPreview()}
              </div>
            </div>
          )}

          {/* Detected Variables */}
          {detectedVariables.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <CodeBracketIcon className="w-4 h-4 mr-1" />
                Detected Variables
              </h4>
              <div className="space-y-2">
                {detectedVariables.map((variable, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-dark-700 border border-dark-600 rounded-lg"
                  >
                    <code className="text-primary-300 text-sm">
                      {`{{${variable}}}`}
                    </code>
                    <span className="text-xs text-gray-500">
                      Auto-configured in next step
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                These variables will be automatically configured in the next step. You can modify their types and validation rules.
              </p>
            </div>
          )}

          {/* Variable Syntax Help */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
              <CodeBracketIcon className="w-4 h-4 mr-1" />
              Variable Syntax
            </h4>
            <div className="space-y-2 text-sm text-blue-200">
              <p><code className="text-blue-300">{`{{variable_name}}`}</code> - Simple variable</p>
              <p><code className="text-blue-300">{`{{user_input}}`}</code> - User provides value</p>
              <p><code className="text-blue-300">{`{{language}}`}</code> - Programming language</p>
              <p><code className="text-blue-300">{`{{code}}`}</code> - Code snippet</p>
            </div>
          </div>

          {/* Content Tips */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-300 mb-2 flex items-center">
              <LightBulbIcon className="w-4 h-4 mr-1" />
              Writing Tips
            </h4>
            <ul className="space-y-1 text-sm text-yellow-200">
              <li>• Be specific about what you want</li>
              <li>• Use variables for dynamic content</li>
              <li>• Include context and examples</li>
              <li>• Structure your request clearly</li>
              <li>• Test with different variable values</li>
            </ul>
          </div>

          {/* Validation Warnings */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-red-300 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Content Issues
              </h4>
              <ul className="space-y-1 text-sm text-red-200">
                {errors.map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
