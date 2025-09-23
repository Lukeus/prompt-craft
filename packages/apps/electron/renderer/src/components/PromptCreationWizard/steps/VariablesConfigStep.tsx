import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VariableIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

import { StepProps, PromptVariable, ValidationError } from '../types';

const VARIABLE_TYPE_OPTIONS = [
  { 
    value: 'string', 
    label: 'Text', 
    description: 'Any text input',
    example: 'TypeScript'
  },
  { 
    value: 'number', 
    label: 'Number', 
    description: 'Numeric values only',
    example: '100'
  },
  { 
    value: 'boolean', 
    label: 'Yes/No', 
    description: 'True or false values',
    example: 'true'
  },
  { 
    value: 'array', 
    label: 'List', 
    description: 'Multiple values separated by commas',
    example: 'item1, item2, item3'
  },
];

export const VariablesConfigStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidationChange,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [expandedVariable, setExpandedVariable] = useState<string | null>(null);
  const lastValidityRef = useRef<boolean | null>(null);

  const validateForm = useCallback(() => {
    const nextErrors: ValidationError[] = [];

    // Validate each variable
    data.variables.forEach((variable, index) => {
      // Name validation
      if (!variable.name.trim()) {
        nextErrors.push({ 
          field: `variable-${index}-name`, 
          message: `Variable ${index + 1}: Name is required` 
        });
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        nextErrors.push({ 
          field: `variable-${index}-name`, 
          message: `Variable ${index + 1}: Name must be a valid identifier (letters, numbers, underscore)` 
        });
      }

      // Check for duplicate names
      const duplicateIndex = data.variables.findIndex(
        (v, i) => i !== index && v.name === variable.name
      );
      if (duplicateIndex !== -1) {
        nextErrors.push({ 
          field: `variable-${index}-name`, 
          message: `Variable ${index + 1}: Duplicate variable name "${variable.name}"` 
        });
      }

      // Validation rules for number type
      if (variable.type === 'number' && variable.validation) {
        if (variable.validation.min !== undefined && variable.validation.max !== undefined) {
          if (variable.validation.min > variable.validation.max) {
            nextErrors.push({ 
              field: `variable-${index}-validation`, 
              message: `Variable ${index + 1}: Minimum value cannot be greater than maximum value` 
            });
          }
        }
      }

      // Validation rules for string type
      if (variable.type === 'string' && variable.validation) {
        if (variable.validation.minLength !== undefined && variable.validation.maxLength !== undefined) {
          if (variable.validation.minLength > variable.validation.maxLength) {
            nextErrors.push({ 
              field: `variable-${index}-validation`, 
              message: `Variable ${index + 1}: Minimum length cannot be greater than maximum length` 
            });
          }
        }

        // Pattern validation
        if (variable.validation.pattern) {
          try {
            new RegExp(variable.validation.pattern);
          } catch (e) {
            nextErrors.push({ 
              field: `variable-${index}-validation`, 
              message: `Variable ${index + 1}: Invalid regex pattern` 
            });
          }
        }
      }
    });

    const nextIsValid = nextErrors.length === 0;
    return { nextErrors, nextIsValid };
  }, [data.variables]);

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

  const addVariable = () => {
    const newVariable: PromptVariable = {
      name: `variable_${data.variables.length + 1}`,
      type: 'string',
      description: '',
      required: true,
    };
    onChange({ variables: [...data.variables, newVariable] });
    setExpandedVariable(newVariable.name);
  };

  const updateVariable = (index: number, updates: Partial<PromptVariable>) => {
    const updatedVariables = [...data.variables];
    updatedVariables[index] = { ...updatedVariables[index], ...updates };
    onChange({ variables: updatedVariables });
  };

  const removeVariable = (index: number) => {
    const updatedVariables = data.variables.filter((_, i) => i !== index);
    onChange({ variables: updatedVariables });
  };

  const renderVariableConfig = (variable: PromptVariable, index: number) => {
    const isExpanded = expandedVariable === variable.name;

    return (
      <motion.div
        key={variable.name}
        layout
        className="border border-dark-600 rounded-lg overflow-hidden"
      >
        <div
          className="p-4 bg-dark-700 cursor-pointer"
          onClick={() => setExpandedVariable(isExpanded ? null : variable.name)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`
                w-3 h-3 rounded-full
                ${variable.required ? 'bg-red-400' : 'bg-gray-400'}
              `} />
              <code className="text-primary-300 font-mono text-sm">
                {`{{${variable.name}}}`}
              </code>
              <span className="text-xs bg-dark-600 px-2 py-1 rounded">
                {VARIABLE_TYPE_OPTIONS.find(t => t.value === variable.type)?.label || variable.type}
              </span>
              {!variable.required && (
                <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">
                  Optional
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {getFieldError(`variable-${index}-name`) && (
                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariable(index);
                }}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <CogIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
          {variable.description && (
            <p className="mt-2 text-sm text-gray-400">{variable.description}</p>
          )}
          {getFieldError(`variable-${index}-name`) && (
            <p className="mt-2 text-sm text-red-400">{getFieldError(`variable-${index}-name`)}</p>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-dark-800 border-t border-dark-600 space-y-4">
                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Variable Name *
                    </label>
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => updateVariable(index, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={variable.type}
                      onChange={(e) => updateVariable(index, { 
                        type: e.target.value as PromptVariable['type'],
                        // Clear validation when type changes
                        validation: undefined,
                        defaultValue: undefined
                      })}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      {VARIABLE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={variable.description || ''}
                    onChange={(e) => updateVariable(index, { description: e.target.value })}
                    placeholder="What is this variable for?"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                {/* Required Toggle */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => updateVariable(index, { required: e.target.checked })}
                      className="w-4 h-4 bg-dark-700 border border-dark-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">Required</span>
                      <p className="text-xs text-gray-400">User must provide a value for this variable</p>
                    </div>
                  </label>
                </div>

                {/* Default Value */}
                {!variable.required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Value
                    </label>
                    {variable.type === 'boolean' ? (
                      <select
                        value={variable.defaultValue?.toString() || ''}
                        onChange={(e) => updateVariable(index, { 
                          defaultValue: e.target.value ? e.target.value === 'true' : undefined 
                        })}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      >
                        <option value="">No default</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : variable.type === 'array' ? (
                      <input
                        type="text"
                        value={Array.isArray(variable.defaultValue) ? variable.defaultValue.join(', ') : variable.defaultValue || ''}
                        onChange={(e) => updateVariable(index, { 
                          defaultValue: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
                        })}
                        placeholder="value1, value2, value3"
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    ) : (
                      <input
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={variable.defaultValue?.toString() || ''}
                        onChange={(e) => updateVariable(index, { 
                          defaultValue: variable.type === 'number' 
                            ? (e.target.value ? Number(e.target.value) : undefined)
                            : (e.target.value || undefined)
                        })}
                        placeholder={VARIABLE_TYPE_OPTIONS.find(t => t.value === variable.type)?.example}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      />
                    )}
                  </div>
                )}

                {/* Validation Rules */}
                <div className="pt-4 border-t border-dark-600">
                  <h5 className="text-sm font-medium text-gray-300 mb-3">Validation Rules</h5>
                  
                  {variable.type === 'string' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Length</label>
                        <input
                          type="number"
                          value={variable.validation?.minLength || ''}
                          onChange={(e) => updateVariable(index, { 
                            validation: { 
                              ...variable.validation, 
                              minLength: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                          min="0"
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Length</label>
                        <input
                          type="number"
                          value={variable.validation?.maxLength || ''}
                          onChange={(e) => updateVariable(index, { 
                            validation: { 
                              ...variable.validation, 
                              maxLength: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                          min="0"
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Pattern (Regex)</label>
                        <input
                          type="text"
                          value={variable.validation?.pattern || ''}
                          onChange={(e) => updateVariable(index, { 
                            validation: { 
                              ...variable.validation, 
                              pattern: e.target.value || undefined 
                            }
                          })}
                          placeholder="^[A-Za-z]+$"
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {variable.type === 'number' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Minimum Value</label>
                        <input
                          type="number"
                          value={variable.validation?.min || ''}
                          onChange={(e) => updateVariable(index, { 
                            validation: { 
                              ...variable.validation, 
                              min: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Maximum Value</label>
                        <input
                          type="number"
                          value={variable.validation?.max || ''}
                          onChange={(e) => updateVariable(index, { 
                            validation: { 
                              ...variable.validation, 
                              max: e.target.value ? Number(e.target.value) : undefined 
                            }
                          })}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                    </div>
                  )}

                  {getFieldError(`variable-${index}-validation`) && (
                    <p className="mt-2 text-sm text-red-400">{getFieldError(`variable-${index}-validation`)}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <VariableIcon className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Variables Configuration
        </h3>
        <p className="text-gray-400">
          Configure your prompt variables with types and validation
        </p>
      </div>

      {data.variables.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-4">
            <VariableIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">No Variables Detected</h4>
          <p className="text-gray-400 mb-6">
            Your prompt doesn't contain any variables, or go back to add some using {`{{variable_name}}`} syntax.
          </p>
          <button
            onClick={addVariable}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Variable Manually
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h4 className="text-lg font-medium text-white">
                Variables ({data.variables.length})
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span>Required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span>Optional</span>
                </div>
              </div>
            </div>
            <button
              onClick={addVariable}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Variable
            </button>
          </div>

          <div className="space-y-3">
            {data.variables.map((variable, index) => renderVariableConfig(variable, index))}
          </div>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
              <InformationCircleIcon className="w-4 h-4 mr-1" />
              Variable Types & Validation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
              <div>
                <p><strong>Text:</strong> Any string input with length limits</p>
                <p><strong>Number:</strong> Numeric values with min/max constraints</p>
              </div>
              <div>
                <p><strong>Yes/No:</strong> Boolean true/false values</p>
                <p><strong>List:</strong> Multiple comma-separated values</p>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
