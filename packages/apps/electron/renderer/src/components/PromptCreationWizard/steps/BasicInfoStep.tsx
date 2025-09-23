import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  InformationCircleIcon, 
  TagIcon, 
  UserIcon,
  DocumentTextIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

import { StepProps, ValidationError } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'work', label: 'Work', description: 'Software engineering, code review, debugging' },
  { value: 'personal', label: 'Personal', description: 'Creative writing, music, visual art' },
  { value: 'shared', label: 'Shared', description: 'General purpose, brainstorming' },
];

export const BasicInfoStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidationChange,
}) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [tagInput, setTagInput] = useState('');

  const lastValidityRef = useRef<boolean | null>(null);

  const validateForm = useCallback(() => {
    const nextErrors: ValidationError[] = [];

    if (!data.name.trim()) {
      nextErrors.push({ field: 'name', message: 'Prompt name is required' });
    } else if (data.name.length < 3) {
      nextErrors.push({ field: 'name', message: 'Name must be at least 3 characters' });
    } else if (data.name.length > 100) {
      nextErrors.push({ field: 'name', message: 'Name must be less than 100 characters' });
    }

    if (!data.description.trim()) {
      nextErrors.push({ field: 'description', message: 'Description is required' });
    } else if (data.description.length < 10) {
      nextErrors.push({ field: 'description', message: 'Description must be at least 10 characters' });
    } else if (data.description.length > 500) {
      nextErrors.push({ field: 'description', message: 'Description must be less than 500 characters' });
    }

    if (!data.author.trim()) {
      nextErrors.push({ field: 'author', message: 'Author is required' });
    }

    const nextIsValid = nextErrors.length === 0;
    return { nextErrors, nextIsValid };
  }, [data]);

  useEffect(() => {
    const { nextErrors, nextIsValid } = validateForm();

    setErrors(prevErrors => {
      const hasChanged =
        prevErrors.length !== nextErrors.length ||
        prevErrors.some((error, index) => {
          const nextError = nextErrors[index];
          if (!nextError) return true;
          return error.field !== nextError.field || error.message !== nextError.message;
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

  const handleTagAdd = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !data.tags.includes(trimmedTag)) {
      onChange({ tags: [...data.tags, trimmedTag] });
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleTagAdd(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && data.tags.length > 0) {
      handleTagRemove(data.tags[data.tags.length - 1]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
          <InformationCircleIcon className="w-8 h-8 text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Basic Information
        </h3>
        <p className="text-gray-400">
          Let's start with the basic details of your prompt
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Prompt Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <DocumentTextIcon className="inline w-4 h-4 mr-1" />
              Prompt Name *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Code Review Assistant"
              className={`
                w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2
                ${getFieldError('name') 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/50'
                }
              `}
            />
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
            )}
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <UserIcon className="inline w-4 h-4 mr-1" />
              Author *
            </label>
            <input
              type="text"
              value={data.author}
              onChange={(e) => onChange({ author: e.target.value })}
              placeholder="Your name"
              className={`
                w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2
                ${getFieldError('author') 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/50'
                }
              `}
            />
            {getFieldError('author') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('author')}</p>
            )}
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Version
            </label>
            <input
              type="text"
              value={data.version}
              onChange={(e) => onChange({ version: e.target.value })}
              placeholder="1.0.0"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/50"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FolderIcon className="inline w-4 h-4 mr-1" />
              Category *
            </label>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-dark-700/50
                    ${data.category === option.value 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-dark-600'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={data.category === option.value}
                    onChange={(e) => onChange({ category: e.target.value as any })}
                    className="sr-only"
                  />
                  <div className={`
                    w-4 h-4 rounded-full border-2 mr-3 transition-all duration-200
                    ${data.category === option.value 
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-gray-400'
                    }
                  `}>
                    {data.category === option.value && (
                      <div className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">{option.label}</div>
                    <div className="text-sm text-gray-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what this prompt does and when to use it..."
          rows={4}
          className={`
            w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 resize-none transition-all duration-200 focus:outline-none focus:ring-2
            ${getFieldError('description') 
              ? 'border-red-500 focus:ring-red-500/50' 
              : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500/50'
            }
          `}
        />
        {getFieldError('description') && (
          <p className="mt-1 text-sm text-red-400">{getFieldError('description')}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {data.description.length}/500 characters
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <TagIcon className="inline w-4 h-4 mr-1" />
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-full"
            >
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="ml-2 text-primary-400 hover:text-primary-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Type a tag and press Enter or comma"
          className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/50"
        />
        <p className="mt-1 text-sm text-gray-500">
          Press Enter or comma to add tags. Common tags: debugging, review, testing, creative
        </p>
      </div>
    </motion.div>
  );
};
