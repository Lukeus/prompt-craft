import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  EyeIcon,
  ArrowLeftIcon,
  PencilIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  RocketLaunchIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { usePrompts } from '../hooks/useElectronAPI';

interface PromptVarDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

interface PromptData {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'work' | 'personal' | 'shared';
  tags: string[];
  author?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
  variables?: PromptVarDef[];
}

const PromptView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, render: renderPrompt } = usePrompts();
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [rendered, setRendered] = useState<string>('');

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      if (!id) {
        console.error('PromptView: No ID provided');
        return;
      }
      console.log('PromptView: Fetching prompt with ID:', id);
      setLoading(true);
      try {
        const res = await getById(id);
        console.log('PromptView: API response:', res);
        if (active) {
          if (res.success && res.data) {
            console.log('PromptView: Prompt data received:', res.data);
            const p = res.data as any;
            setPrompt({
              id: p.id,
              name: p.name,
              description: p.description,
              content: p.content,
              category: p.category,
              tags: p.tags ?? [],
              author: p.author,
              version: p.version,
              createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString(),
              updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt).toISOString(),
              variables: p.variables ?? [],
            });

            // Initialize variable inputs with defaults
            const initialVars: Record<string, any> = {};
            (p.variables ?? []).forEach((v: PromptVarDef) => {
              if (v.defaultValue !== undefined) initialVars[v.name] = v.defaultValue;
              else if (v.type === 'boolean') initialVars[v.name] = false;
              else initialVars[v.name] = '';
            });
            setVariables(initialVars);
          } else {
            console.error('PromptView: Prompt not found or API error:', res);
            toast.error(res.error || 'Prompt not found');
            navigate('/prompts');
          }
        }
      } catch (e) {
        console.error('PromptView: Exception while fetching prompt:', e);
        if (active) {
          toast.error('Failed to load prompt: ' + (e instanceof Error ? e.message : String(e)));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetch();
    return () => {
      active = false;
    };
  }, [id, getById, navigate]);

  const handleVarChange = (name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const onRender = async () => {
    if (!id) return;
    setRendering(true);
    try {
      const res = await renderPrompt(id, variables);
      if (res.success) {
        setRendered((res as any).data || '');
        toast.success('Prompt rendered successfully!');
      } else {
        toast.error(res.error || 'Failed to render prompt');
      }
    } catch (e) {
      toast.error('Failed to render prompt');
    } finally {
      setRendering(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (e) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const meta = useMemo(() => {
    if (!prompt) return null;
    return [
      { icon: CalendarIcon, label: 'Created', value: new Date(prompt.createdAt).toLocaleString() },
      { icon: CalendarIcon, label: 'Updated', value: new Date(prompt.updatedAt).toLocaleString() },
      ...(prompt.author ? [{ icon: UserIcon, label: 'Author', value: prompt.author }] : []),
      ...(prompt.version ? [{ icon: TagIcon, label: 'Version', value: prompt.version }] : []),
    ];
  }, [prompt]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading prompt...</div>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <EyeIcon className="w-7 h-7 text-primary-300" />
            {prompt.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/prompts/${prompt.id}/edit`} className="btn-secondary">
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-2">Description</h2>
            <p className="text-gray-300">{prompt.description}</p>

            {prompt.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {prompt.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs rounded bg-dark-800/60 text-gray-300 border border-dark-700/60">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Template</h2>
                  <p className="text-gray-400 text-sm">Raw prompt content with variables</p>
                </div>
                <button
                  onClick={() => copyToClipboard(prompt.content, 'Template')}
                  className="btn-secondary text-xs"
                >
                  <ClipboardIcon className="w-3 h-3 mr-1" />
                  Copy
                </button>
              </div>
            </div>
            <pre className="p-6 text-sm bg-dark-900/70 text-gray-100 overflow-auto border-t border-dark-700/50">
{prompt.content}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">Variables</h2>
            {(!prompt.variables || prompt.variables.length === 0) && (
              <div className="text-gray-400 text-sm">No variables defined for this prompt.</div>
            )}

            {prompt.variables?.map(v => (
              <div key={v.name} className="space-y-1">
                <label className="form-label">
                  {v.name}
                  {v.required && <span className="ml-1 text-red-400">*</span>}
                </label>
                {v.type === 'boolean' ? (
                  <select
                    className="form-input"
                    value={variables[v.name] ? 'true' : 'false'}
                    onChange={(e) => handleVarChange(v.name, e.target.value === 'true')}
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : v.type === 'number' ? (
                  <input
                    type="number"
                    className="form-input"
                    value={variables[v.name] ?? ''}
                    onChange={(e) => handleVarChange(v.name, e.target.value === '' ? '' : Number(e.target.value))}
                  />
                ) : v.type === 'array' ? (
                  <textarea
                    className="form-input"
                    placeholder="Comma-separated values"
                    value={Array.isArray(variables[v.name]) ? (variables[v.name] as any[]).join(', ') : variables[v.name] ?? ''}
                    onChange={(e) => handleVarChange(v.name, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={variables[v.name] ?? ''}
                    onChange={(e) => handleVarChange(v.name, e.target.value)}
                  />
                )}
                {v.description && (
                  <div className="text-xs text-gray-400">{v.description}</div>
                )}
              </div>
            ))}

            <button onClick={onRender} disabled={rendering} className="btn-primary w-full">
              <RocketLaunchIcon className="w-4 h-4 mr-2" />
              {rendering ? 'Rendering…' : 'Render Prompt'}
            </button>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100">Metadata</h2>
            <div className="mt-2 space-y-2 text-sm text-gray-300">
              {meta?.map(m => (
                <div key={m.label} className="flex items-center gap-2">
                  <m.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 w-24">{m.label}</span>
                  <span className="text-gray-100">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {rendered && (
            <div className="space-y-6">
              {/* Raw Output */}
              <div className="glass-card rounded-xl p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-100">Raw Output</h2>
                      <p className="text-gray-400 text-sm">Plain text output with variables filled</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(rendered, 'Rendered output')}
                      className="btn-secondary text-xs"
                    >
                      <ClipboardIcon className="w-3 h-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
                <pre className="p-6 text-sm bg-dark-900/70 text-gray-100 overflow-auto border-t border-dark-700/50">
{rendered}
                </pre>
              </div>

              {/* Formatted Output */}
              <div className="glass-card rounded-xl p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-100">Formatted Output</h2>
                      <p className="text-gray-400 text-sm">Rendered as markdown with formatting</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(rendered, 'Rendered output')}
                      className="btn-secondary text-xs"
                    >
                      <ClipboardIcon className="w-3 h-3 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-dark-900/70 border-t border-dark-700/50">
                  <ReactMarkdown
                    className="prose prose-invert prose-gray max-w-none prose-sm
                               prose-headings:text-gray-100 prose-p:text-gray-200
                               prose-code:text-accent-300 prose-code:bg-dark-800/60 prose-code:px-1 prose-code:rounded
                               prose-pre:bg-dark-800/80 prose-pre:border prose-pre:border-dark-600
                               prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-300
                               prose-strong:text-gray-100 prose-em:text-gray-200
                               prose-ul:text-gray-200 prose-ol:text-gray-200
                               prose-li:text-gray-200 prose-a:text-primary-400"
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {rendered}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PromptView;
