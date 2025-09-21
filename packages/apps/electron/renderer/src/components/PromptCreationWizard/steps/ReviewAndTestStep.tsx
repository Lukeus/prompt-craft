import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  PlayIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

import { StepProps, VariableTestValue, TestResult, ValidationError } from '../types';

export const ReviewAndTestStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidationChange,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [testValues, setTestValues] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showRenderedContent, setShowRenderedContent] = useState(true);

  // Initialize test values with defaults
  useEffect(() => {
    const initialTestValues: Record<string, any> = {};
    data.variables.forEach(variable => {
      if (variable.defaultValue !== undefined) {
        initialTestValues[variable.name] = variable.defaultValue;
      } else {
        // Provide sample values based on type
        switch (variable.type) {
          case 'string':
            initialTestValues[variable.name] = variable.name === 'language' ? 'TypeScript' :
                                               variable.name === 'code' ? 'const example = "Hello World";' :
                                               `Sample ${variable.name}`;
            break;
          case 'number':
            initialTestValues[variable.name] = 100;
            break;
          case 'boolean':
            initialTestValues[variable.name] = true;
            break;
          case 'array':
            initialTestValues[variable.name] = ['item1', 'item2', 'item3'];
            break;
        }
      }
    });
    setTestValues(initialTestValues);
  }, [data.variables]);

  const validateForm = useCallback(() => {
    const newErrors: ValidationError[] = [];

    // Basic form validation
    if (!data.name.trim()) {
      newErrors.push({ field: 'name', message: 'Prompt name is required' });
    }
    if (!data.description.trim()) {
      newErrors.push({ field: 'description', message: 'Prompt description is required' });
    }
    if (!data.content.trim()) {
      newErrors.push({ field: 'content', message: 'Prompt content is required' });
    }
    if (!data.author.trim()) {
      newErrors.push({ field: 'author', message: 'Author is required' });
    }

    // Variable validation
    data.variables.forEach((variable, index) => {
      if (!variable.name.trim()) {
        newErrors.push({ field: `variable-${index}`, message: `Variable ${index + 1} name is required` });
      }
    });

    setErrors(newErrors);
    const isValid = newErrors.length === 0;
    onValidationChange(isValid);
    
    return isValid;
  }, [data, onValidationChange]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // Render prompt with test values
  const renderedContent = useMemo(() => {
    let content = data.content;
    
    try {
      // Replace variables with test values
      data.variables.forEach(variable => {
        const value = testValues[variable.name];
        if (value !== undefined && value !== null) {
          const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
          const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
          content = content.replace(regex, stringValue);
        }
      });

      setTestResult({ success: true, renderedContent: content });
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResult({ success: false, error: errorMessage });
      return `Error rendering prompt: ${errorMessage}`;
    }
  }, [data.content, data.variables, testValues]);

  const handleTestValueChange = (variableName: string, value: any) => {
    setTestValues(prev => ({ ...prev, [variableName]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderTestInput = (variable: any) => {
    const value = testValues[variable.name] || '';

    switch (variable.type) {
      case 'boolean':
        return (
          <select
            value={value.toString()}
            onChange={(e) => handleTestValueChange(variable.name, e.target.value === 'true')}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleTestValueChange(variable.name, Number(e.target.value))}
            min={variable.validation?.min}
            max={variable.validation?.max}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        );

      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) => handleTestValueChange(variable.name, e.target.value.split(',').map(s => s.trim()))}
            placeholder="item1, item2, item3"
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        );

      default: // string
        return variable.name === 'code' ? (
          <textarea
            value={value}
            onChange={(e) => handleTestValueChange(variable.name, e.target.value)}
            rows={4}
            minLength={variable.validation?.minLength}
            maxLength={variable.validation?.maxLength}
            pattern={variable.validation?.pattern}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleTestValueChange(variable.name, e.target.value)}
            minLength={variable.validation?.minLength}
            maxLength={variable.validation?.maxLength}
            pattern={variable.validation?.pattern}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        );
    }
  };

  const promptStats = {
    characters: data.content.length,
    words: data.content.split(/\s+/).filter(word => word.length > 0).length,
    variables: data.variables.length,
    requiredVariables: data.variables.filter(v => v.required).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Review & Test
        </h3>
        <p className="text-gray-400">
          Review your prompt and test it with different values
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Prompt Summary */}
        <div className="space-y-6">
          {/* Prompt Overview */}
          <div className="p-6 bg-dark-700 border border-dark-600 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-4">Prompt Summary</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white font-medium">{data.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white capitalize">{data.category}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Author:</span>
                <span className="text-white">{data.author}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Version:</span>
                <span className="text-white">{data.version}</span>
              </div>
              
              <div className="pt-2 border-t border-dark-600">
                <span className="text-gray-400 block mb-1">Description:</span>
                <p className="text-white text-sm">{data.description}</p>
              </div>

              {data.tags.length > 0 && (
                <div className="pt-2 border-t border-dark-600">
                  <span className="text-gray-400 block mb-2">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="p-6 bg-dark-700 border border-dark-600 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-4">Statistics</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-primary-400">{promptStats.characters}</div>
                <div className="text-xs text-gray-400">Characters</div>
              </div>
              
              <div className="text-center p-3 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-secondary-400">{promptStats.words}</div>
                <div className="text-xs text-gray-400">Words</div>
              </div>
              
              <div className="text-center p-3 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{promptStats.variables}</div>
                <div className="text-xs text-gray-400">Variables</div>
              </div>
              
              <div className="text-center p-3 bg-dark-800 rounded-lg">
                <div className="text-2xl font-bold text-red-400">{promptStats.requiredVariables}</div>
                <div className="text-xs text-gray-400">Required</div>
              </div>
            </div>
          </div>

          {/* Variable Test Values */}
          {data.variables.length > 0 && (
            <div className="p-6 bg-dark-700 border border-dark-600 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-white">Test Variables</h4>
                <button
                  onClick={() => setShowRenderedContent(!showRenderedContent)}
                  className={`
                    flex items-center px-3 py-1 text-xs rounded-md transition-all duration-200
                    ${showRenderedContent 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                    }
                  `}
                >
                  <EyeIcon className="w-3 h-3 mr-1" />
                  {showRenderedContent ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
              
              <div className="space-y-4">
                {data.variables.map((variable, index) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <code className="text-primary-300 mr-2">{`{{${variable.name}}}`}</code>
                      <span className="text-xs bg-dark-600 px-2 py-1 rounded">
                        {variable.type}
                      </span>
                      {variable.required && (
                        <span className="text-xs bg-red-600 px-2 py-1 rounded text-white ml-1">
                          Required
                        </span>
                      )}
                    </label>
                    {renderTestInput(variable)}
                    {variable.description && (
                      <p className="mt-1 text-xs text-gray-500">{variable.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Live Preview */}
        <div className="space-y-6">
          {/* Rendered Content */}
          <div className="p-6 bg-dark-700 border border-dark-600 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white flex items-center">
                <PlayIcon className="w-5 h-5 mr-2 text-green-400" />
                Live Preview
              </h4>
              <button
                onClick={() => copyToClipboard(renderedContent)}
                className="flex items-center px-3 py-1 text-xs bg-dark-600 text-gray-300 rounded-md hover:bg-dark-500 transition-colors"
              >
                <ClipboardDocumentIcon className="w-3 h-3 mr-1" />
                Copy
              </button>
            </div>
            
            {testResult?.success ? (
              <div className="p-4 bg-dark-800 border border-dark-600 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-white text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {renderedContent}
                </pre>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center text-red-300 mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Render Error
                </div>
                <p className="text-red-200 text-sm">{testResult?.error}</p>
              </div>
            )}
          </div>

          {/* Original Content */}
          <div className="p-6 bg-dark-700 border border-dark-600 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <DocumentDuplicateIcon className="w-5 h-5 mr-2 text-gray-400" />
              Original Content
            </h4>
            <div className="p-4 bg-dark-800 border border-dark-600 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {data.content}
              </pre>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-red-300 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Issues Found
              </h4>
              <ul className="space-y-1 text-sm text-red-200">
                {errors.map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-red-300">
                Please go back and fix these issues before creating the prompt.
              </p>
            </div>
          )}

          {/* Success Message */}
          {errors.length === 0 && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Ready to Create
              </h4>
              <p className="text-sm text-green-200">
                Your prompt looks good! Click "Create Prompt" to save it to your library.
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
              <InformationCircleIcon className="w-4 h-4 mr-1" />
              Testing Tips
            </h4>
            <ul className="space-y-1 text-sm text-blue-200">
              <li>• Test with different variable combinations</li>
              <li>• Try edge cases and empty values</li>
              <li>• Verify the output makes sense</li>
              <li>• Check that all variables are replaced</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};