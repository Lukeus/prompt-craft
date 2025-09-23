import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { usePrompts } from '../hooks/useElectronAPI';

interface Prompt {
  id: string;
  name: string;
  description: string;
  category: 'work' | 'personal' | 'shared';
  tags: string[];
  author?: string;
  updatedAt: string;
}

type CategoryFilter = 'all' | 'work' | 'personal' | 'shared';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchPrompts } = usePrompts();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<CategoryFilter>((searchParams.get('category') as CategoryFilter) ?? 'all');
  const [author, setAuthor] = useState(searchParams.get('author') ?? '');
  const [tagsInput, setTagsInput] = useState(searchParams.get('tags') ?? '');
  const [results, setResults] = useState<Prompt[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(() => {
    return Boolean(searchParams.get('q') || searchParams.get('category') || searchParams.get('tags') || searchParams.get('author'));
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setCategory((searchParams.get('category') as CategoryFilter) ?? 'all');
    setAuthor(searchParams.get('author') ?? '');
    setTagsInput(searchParams.get('tags') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const controller = setTimeout(async () => {
      const activeQuery = (searchParams.get('q') ?? '').trim();
      const activeCategory = (searchParams.get('category') as CategoryFilter) ?? 'all';
      const activeAuthor = (searchParams.get('author') ?? '').trim();
      const activeTags = (searchParams.get('tags') ?? '').trim();

      if (!activeQuery && activeCategory === 'all' && !activeAuthor && !activeTags) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await searchPrompts(activeQuery, activeCategory === 'all' ? undefined : activeCategory);
        if (response.success && Array.isArray(response.data)) {
          const filtered = response.data.filter((prompt: Prompt) => {
            const matchesAuthor = activeAuthor ? prompt.author?.toLowerCase().includes(activeAuthor.toLowerCase()) : true;
            const tagList = activeTags ? activeTags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];
            const matchesTags = tagList.length === 0 || tagList.every(tag => prompt.tags?.map(t => t.toLowerCase()).includes(tag));
            return matchesAuthor && matchesTags;
          });
          setResults(filtered);
          setHasSearched(true);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search prompts');
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(controller);
  }, [searchParams, searchPrompts]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'all') params.set('category', category);
    if (author.trim()) params.set('author', author.trim());
    if (tagsInput.trim()) params.set('tags', tagsInput.trim());
    setSearchParams(params);
  };

  const handleClear = () => {
    setQuery('');
    setCategory('all');
    setAuthor('');
    setTagsInput('');
    setSearchParams(new URLSearchParams());
  };

  const categoryCounts = useMemo(() => {
    return {
      all: results.length,
      work: results.filter(prompt => prompt.category === 'work').length,
      personal: results.filter(prompt => prompt.category === 'personal').length,
      shared: results.filter(prompt => prompt.category === 'shared').length,
    };
  }, [results]);

  const navigateToPrompt = (promptId: string) => {
    navigate(`/prompts/${promptId}`);
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600/20 to-accent-600/20 border border-primary-500/30 rounded-full text-sm font-semibold text-primary-300 backdrop-blur-sm">
          <SparklesIcon className="w-4 h-4 mr-2" />
          AI-Powered Discovery
        </div>
        <h1 className="text-4xl font-bold text-balance">
          <span className="bg-gradient-to-r from-gray-100 via-primary-300 to-accent-400 bg-clip-text text-transparent">
            Search Your Prompt Library
          </span>
        </h1>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Filter by keywords, categories, tags, and authors to pinpoint exactly the right prompt.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 space-y-6"
      >
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search prompts by name, description, or content..."
            className="w-full pl-12 pr-12 py-4 bg-dark-800/60 border border-dark-600/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="text-sm font-medium text-gray-300 mb-1 flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Category
            </label>
            <div className="flex items-center gap-2">
              {(['all', 'work', 'personal', 'shared'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${category === option
                      ? 'bg-primary-600/20 text-primary-200 border border-primary-500/50'
                      : 'bg-dark-800/40 text-gray-400 border border-dark-600/50 hover:text-gray-200'}
                  `}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                  <span className="ml-1 text-xs text-gray-500">({categoryCounts[option] ?? 0})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Filter by author"
              className="w-full px-3 py-2 bg-dark-800/40 border border-dark-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-300 mb-1 flex items-center">
              <TagIcon className="w-4 h-4 mr-2" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="e.g. code-review, documentation"
              className="w-full px-3 py-2 bg-dark-800/40 border border-dark-600/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-all duration-200"
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center px-4 py-2 bg-dark-800/60 text-gray-300 rounded-lg hover:bg-dark-700/60 transition-all duration-200"
          >
            Clear
          </button>
          {isSearching && (
            <div className="inline-flex items-center px-3 py-1 bg-dark-800/60 text-gray-400 rounded-full text-sm">
              <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
              Searching prompts...
            </div>
          )}
        </div>
      </motion.form>

      <AnimatePresence>
        {hasSearched && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-100 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2 text-accent-400" />
                  Search Results
                </h2>
                <p className="text-sm text-gray-400">
                  {results.length} prompt{results.length === 1 ? '' : 's'} found
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/prompts')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-dark-800/60 border border-dark-600/50 rounded-lg text-gray-200 hover:bg-dark-700/60"
              >
                View All Prompts
                <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
              </button>
            </div>

            {error && (
              <div className="glass-card rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
                {error}
              </div>
            )}

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map(prompt => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="glass-card rounded-xl p-6 hover:bg-dark-700/40 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                        prompt.category === 'work'
                          ? 'bg-blue-500/20 text-blue-200'
                          : prompt.category === 'personal'
                          ? 'bg-accent-500/20 text-accent-200'
                          : 'bg-success-500/20 text-success-200'
                      }`}>
                        {prompt.category}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToPrompt(prompt.id)}
                        className="text-sm text-primary-300 hover:text-primary-200"
                      >
                        View
                      </button>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-100 line-clamp-2">
                        {prompt.name}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {prompt.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                      </div>
                      {prompt.tags?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {prompt.tags.slice(0, 4).map((tag, index) => (
                            <span
                              key={`${prompt.id}-tag-${tag}-${index}`}
                              className="inline-flex items-center px-2 py-1 bg-dark-800/60 border border-dark-600/60 text-xs text-gray-300 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {prompt.tags.length > 4 && (
                            <span className="text-xs text-gray-500">+{prompt.tags.length - 4} more</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              !error && (
                <div className="glass-card rounded-xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                    <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">No results found</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Try adjusting your search terms or filters to broaden the results.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setSearchParams(new URLSearchParams())}
                      className="px-4 py-2 bg-dark-800/60 text-gray-300 rounded-lg hover:bg-dark-700/60"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/prompts/new')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500"
                    >
                      Create New Prompt
                    </button>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}

        {!hasSearched && !isSearching && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-12 text-center space-y-4"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100">Ready to discover prompts</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Enter a search above or explore all prompts to find the perfect starting point for your next AI interaction.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
