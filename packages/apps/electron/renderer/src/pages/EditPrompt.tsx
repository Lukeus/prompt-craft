import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { usePrompts } from '../hooks/useElectronAPI';

interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

interface PromptFormData {
  name: string;
  description: string;
  content: string;
  category: 'work' | 'personal' | 'shared';
  tags: string[];
  author?: string;
  version?: string;
  variables: PromptVariable[];
}

const EditPrompt: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, updatePrompt } = usePrompts();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    content: '',
    category: 'work',
    tags: [],
    author: '',
    version: '',
    variables: []
  });
  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Load existing prompt data
  useEffect(() => {
    if (!id) {
      navigate('/prompts');
      return;
    }

    const loadPrompt = async () => {
      setLoading(true);
      try {
        const res = await getById(id);
        if (res.success && res.data) {
          const p = res.data as any;
          setFormData({
            name: p.name || '',
            description: p.description || '',
            content: p.content || '',
            category: p.category || 'work',
            tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map((t: string) => t.trim()) : []),
            author: p.author || '',
            version: p.version || '',
            variables: Array.isArray(p.variables) ? p.variables : []
          });
        } else {
          toast.error('Prompt not found');
          navigate('/prompts');
        }
      } catch (error) {
        toast.error('Failed to load prompt');
        navigate('/prompts');
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [id, getById, navigate]);

  const handleInputChange = (field: keyof PromptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addVariable = () => {
    const newVar: PromptVariable = {
      name: '',
      type: 'string',
      required: false,
      description: ''
    };
    handleInputChange('variables', [...formData.variables, newVar]);
  };

  const updateVariable = (index: number, field: keyof PromptVariable, value: any) => {
    const updated = [...formData.variables];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange('variables', updated);
  };

  const removeVariable = (index: number) => {
    handleInputChange('variables', formData.variables.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Prompt name is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Prompt description is required');
      return false;
    }
    if (!formData.content.trim()) {
      toast.error('Prompt content is required');
      return false;
    }

    // Validate variables
    for (let i = 0; i < formData.variables.length; i++) {
      const variable = formData.variables[i];
      if (!variable.name.trim()) {
        toast.error(`Variable ${i + 1} name is required`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaving(true);
    try {
      const result = await updatePrompt(id, {
        ...formData,
        updatedAt: new Date().toISOString()
      });

      if (result.success) {
        toast.success('Prompt updated successfully!');
        navigate(`/prompts/${id}`);
      } else {
        toast.error(result.error || 'Failed to update prompt');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading prompt...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <PencilIcon className="w-7 h-7 text-primary-300" />
            Edit Prompt
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/prompts/${id}`} className="btn-secondary">
            <EyeIcon className="w-4 h-4 mr-2" />
            View
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                  placeholder="Enter prompt name"
                />
              </div>

              <div>
                <label className="form-label">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="Describe what this prompt does"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as any)}
                    className="form-input"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Version</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    className="form-input"
                    placeholder="1.0.0"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="form-input"
                  placeholder="Author name"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Content</h2>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="btn-secondary text-sm"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>
            
            {previewMode ? (
              <div className="min-h-[200px] p-4 bg-dark-900/70 rounded-lg border border-dark-700/50">
                <div className="prose prose-invert prose-gray max-w-none prose-sm">
                  {formData.content || 'No content to preview'}
                </div>
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="form-input"
                rows={10}
                placeholder="Enter your prompt content here. Use {{variable_name}} for variables."
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Tags</h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="form-input flex-1"
                  placeholder="Add a tag"
                />
                <button onClick={addTag} className="btn-secondary">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs rounded bg-primary-900/30 text-primary-300 border border-primary-700/30 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-300 transition-colors"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Variables */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Variables</h2>
              <button onClick={addVariable} className="btn-secondary text-sm">
                <PlusIcon className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.variables.map((variable, index) => (
                <div key={index} className="p-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-200">Variable {index + 1}</span>
                    <button
                      onClick={() => removeVariable(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      className="form-input text-sm"
                      placeholder="Variable name"
                    />
                    
                    <select
                      value={variable.type}
                      onChange={(e) => updateVariable(index, 'type', e.target.value as any)}
                      className="form-input text-sm"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                    </select>
                    
                    <textarea
                      value={variable.description || ''}
                      onChange={(e) => updateVariable(index, 'description', e.target.value)}
                      className="form-input text-sm"
                      rows={2}
                      placeholder="Description (optional)"
                    />
                    
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={variable.required}
                        onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                        className="rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
              
              {formData.variables.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No variables defined. Click "Add" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditPrompt;
