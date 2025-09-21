import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  BriefcaseIcon,
  HeartIcon,
  ShareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { usePrompts } from '../hooks/useElectronAPI';

interface Prompt {
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
  variables?: any[];
}

type FilterCategory = 'all' | 'work' | 'personal' | 'shared';
type SortOption = 'updated' | 'created' | 'name' | 'category';

const Prompts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>(
    (searchParams.get('category') as FilterCategory) || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [showFilters, setShowFilters] = useState(false);
  
  const { getAllPrompts, searchPrompts, getPromptsByCategory } = usePrompts();

  // Fetch prompts based on current filters
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        let response;
        
        if (searchQuery) {
          response = await searchPrompts(searchQuery, categoryFilter === 'all' ? undefined : categoryFilter);
        } else if (categoryFilter === 'all') {
          response = await getAllPrompts();
        } else {
          response = await getPromptsByCategory(categoryFilter);
        }
        
        if (response.success) {
          setPrompts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [searchQuery, categoryFilter]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    setSearchParams(params);
  }, [searchQuery, categoryFilter, setSearchParams]);

  // Sort prompts
  const sortedPrompts = useMemo(() => {
    const sorted = [...prompts];
    
    switch (sortBy) {
      case 'updated':
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'created':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sorted;
    }
  }, [prompts, sortBy]);

  const categoryStats = useMemo(() => {
    return {
      all: prompts.length,
      work: prompts.filter(p => p.category === 'work').length,
      personal: prompts.filter(p => p.category === 'personal').length,
      shared: prompts.filter(p => p.category === 'shared').length,
    };
  }, [prompts]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return BriefcaseIcon;
      case 'personal': return HeartIcon;
      case 'shared': return ShareIcon;
      default: return DocumentTextIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'personal': return 'text-accent-400 bg-accent-500/20 border-accent-500/30';
      case 'shared': return 'text-success-400 bg-success-500/20 border-success-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            {categoryFilter === 'all' ? 'All Prompts' : 
             categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1) + ' Prompts'}
          </h1>
          <p className="text-gray-400">
            {sortedPrompts.length} prompt{sortedPrompts.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-900/30 text-primary-300' : ''}`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          <Link to="/prompts/new" className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            New Prompt
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts by name, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Category Filters */}
              <div>
                <label className="form-label mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {([['all', 'All'], ['work', 'Work'], ['personal', 'Personal'], ['shared', 'Shared']] as const).map(([key, label]) => {
                    const Icon = key === 'all' ? DocumentTextIcon : getCategoryIcon(key);
                    const isActive = categoryFilter === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setCategoryFilter(key)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-900/30 text-primary-300 ring-1 ring-primary-700/30'
                            : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                        <span className="ml-2 px-2 py-0.5 bg-dark-700/50 rounded text-xs">
                          {categoryStats[key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="form-label mb-3">Sort by</label>
                <div className="flex flex-wrap gap-2">
                  {([['updated', 'Last Updated'], ['created', 'Date Created'], ['name', 'Name'], ['category', 'Category']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        sortBy === key
                          ? 'bg-accent-900/30 text-accent-300 ring-1 ring-accent-700/30'
                          : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Prompts Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          </motion.div>
        ) : sortedPrompts.length > 0 ? (
          <motion.div
            key="prompts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {sortedPrompts.map((prompt, index) => {
              const Icon = getCategoryIcon(prompt.category);
              const categoryColor = getCategoryColor(prompt.category);
              
              return (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-light rounded-xl p-6 hover:bg-dark-700/30 transition-all duration-200 group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                      {prompt.category}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-200 mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
                    {prompt.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                    {prompt.description}
                  </p>

                  {/* Tags */}
                  {prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {prompt.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-dark-800/50 text-gray-400 text-xs rounded"
                        >
                          <TagIcon className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{prompt.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </div>
                    {prompt.author && (
                      <div className="flex items-center">
                        <UserIcon className="w-3 h-3 mr-1" />
                        {prompt.author}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-700/30">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/prompts/${prompt.id}`}
                        className="flex items-center px-3 py-1.5 bg-primary-900/30 text-primary-300 text-sm rounded-lg hover:bg-primary-800/40 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/prompts/${prompt.id}/edit`}
                        className="flex items-center px-3 py-1.5 bg-dark-800/50 text-gray-300 text-sm rounded-lg hover:bg-dark-700/60 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                    
                    <button className="flex items-center px-3 py-1.5 bg-red-900/20 text-red-400 text-sm rounded-lg hover:bg-red-800/30 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              {searchQuery ? 'No prompts found' : 'No prompts yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? `No prompts match "${searchQuery}". Try adjusting your search or filters.`
                : 'Get started by creating your first prompt.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              )}
              <Link to="/prompts/new" className="btn-primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create New Prompt
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Prompts;
