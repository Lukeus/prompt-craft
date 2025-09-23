import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
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
  isFavorite?: boolean;
}

type FilterCategory = 'all' | 'work' | 'personal' | 'shared';
type SortOption = 'updated' | 'created' | 'name' | 'category';
type ViewFilter = 'all' | 'favorites' | 'recent';

const Prompts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]); // Keep all prompts for client-side search fallback
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  // Actual query used for searching - only updated on Enter press or explicit search
  const [activeSearchQuery, setActiveSearchQuery] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>(
    (searchParams.get('category') as FilterCategory) || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>(
    (searchParams.get('view') as ViewFilter) || 'all'
  );
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  
  const { getAllPrompts, searchPrompts, getPromptsByCategory, setFavorite } = usePrompts();

  // Handle Enter key press to trigger search
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setActiveSearchQuery(searchQuery);
  };
  
  // Handle search input key press
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Load all prompts on first mount for client-side search fallback
  useEffect(() => {
    const loadAllPrompts = async () => {
      try {
        const response = await getAllPrompts();
        if (response.success) {
          setAllPrompts(response.data || []);
        }
      } catch (error) {
        console.error('Failed to load all prompts:', error);
      }
    };
    
    loadAllPrompts();
  }, [getAllPrompts]);

  // Fetch prompts based on current filters (using active search query)
  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        let response;
        let useClientSideSearch = false;
        
        if (activeSearchQuery) {
          response = await searchPrompts(activeSearchQuery, categoryFilter === 'all' ? undefined : categoryFilter);
          
          // If backend search fails or returns no results, use client-side search
          if (!response.success || !response.data || response.data.length === 0) {
            useClientSideSearch = true;
          }
        } else if (categoryFilter === 'all') {
          response = await getAllPrompts();
        } else {
          response = await getPromptsByCategory(categoryFilter);
        }
        
        if (useClientSideSearch && activeSearchQuery) {
          // Client-side search fallback
          const searchLower = activeSearchQuery.toLowerCase();
          let filtered = allPrompts.filter(prompt => {
            const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter;
            const matchesSearch = 
              prompt.name.toLowerCase().includes(searchLower) ||
              prompt.description.toLowerCase().includes(searchLower) ||
              prompt.content.toLowerCase().includes(searchLower) ||
              (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
              (prompt.author && prompt.author.toLowerCase().includes(searchLower));
            
            return matchesCategory && matchesSearch;
          });
          
          setPrompts(filtered);
        } else if (response && response.success) {
          setPrompts(response.data || []);
        } else {
          setPrompts([]);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [activeSearchQuery, categoryFilter, allPrompts]);

  useEffect(() => {
    const nextView = (searchParams.get('view') as ViewFilter) || 'all';
    if (nextView !== viewFilter) {
      setViewFilter(nextView);
    }
  }, [searchParams, viewFilter]);

  // Update URL params when filters change (only on active search query)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSearchQuery) params.set('q', activeSearchQuery);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (viewFilter !== 'all') params.set('view', viewFilter);
    setSearchParams(params, { replace: true });
  }, [activeSearchQuery, categoryFilter, viewFilter, setSearchParams]);

  const filteredPrompts = useMemo(() => {
    let next = [...prompts];

    if (viewFilter === 'favorites') {
      next = next.filter((prompt) => Boolean(prompt.isFavorite));
    }

    if (viewFilter === 'recent') {
      next = next
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 20);
    }

    return next;
  }, [prompts, viewFilter]);

  // Sort prompts
  const sortedPrompts = useMemo(() => {
    const sorted = [...filteredPrompts];
    
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
  }, [filteredPrompts, sortBy]);

  const categoryStats = useMemo(() => {
    return {
      all: filteredPrompts.length,
      work: filteredPrompts.filter(p => p.category === 'work').length,
      personal: filteredPrompts.filter(p => p.category === 'personal').length,
      shared: filteredPrompts.filter(p => p.category === 'shared').length,
    };
  }, [filteredPrompts]);

  const updateViewFilter = (nextView: ViewFilter) => {
    setViewFilter(nextView);
  };

  const viewLabel = useMemo(() => {
    switch (viewFilter) {
      case 'favorites':
        return 'Favorite Prompts';
      case 'recent':
        return 'Recently Updated';
      default:
        return null;
    }
  }, [viewFilter]);

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

  const handleToggleFavorite = async (prompt: Prompt) => {
    if (favoritePendingId) {
      return;
    }

    setFavoritePendingId(prompt.id);
    const targetState = !prompt.isFavorite;

    try {
      const response = await setFavorite(prompt.id, targetState);
      if (response.success) {
        setPrompts(prev => prev.map(item => item.id === prompt.id ? { ...item, isFavorite: targetState } : item));
        toast.success(
          targetState
            ? `Added "${prompt.name}" to favorites.`
            : `Removed "${prompt.name}" from favorites.`,
          { id: `favorite-${prompt.id}` }
        );
      } else if (response.error) {
        toast.error(response.error, { id: `favorite-${prompt.id}` });
      }
    } catch (error) {
      toast.error('Failed to update favorite status.', { id: `favorite-${prompt.id}` });
    } finally {
      setFavoritePendingId(null);
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
            {viewLabel
              ? viewLabel
              : categoryFilter === 'all'
                ? 'All Prompts'
                : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1) + ' Prompts'}
          </h1>
          <p className="text-gray-400">
            {sortedPrompts.length} prompt{sortedPrompts.length !== 1 ? 's' : ''} found
            {activeSearchQuery && ` for "${activeSearchQuery}"`}
            {!activeSearchQuery && viewFilter !== 'all' && ` in ${viewLabel?.toLowerCase()}`}
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
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts by name, description, or content... (Press Enter to search)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (viewFilter !== 'all') {
                updateViewFilter('all');
              }
            }}
            onKeyPress={handleSearchKeyPress}
            className="form-input pl-10 pr-20"
            autoComplete="off"
            spellCheck={false}
          />
          {searchQuery && (
            <>
              <button
                type="submit"
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-300 transition-colors"
                title="Search"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearchQuery('');
                  updateViewFilter('all');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                title="Clear search"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </form>

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

              <div>
                <label className="form-label mb-3">Quick views</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['all', 'All'],
                    ['favorites', 'Favorites'],
                    ['recent', 'Recent'],
                  ] as const).map(([key, label]) => {
                    const isActive = viewFilter === key;
                    const Icon = key === 'favorites' ? HeartIcon : key === 'recent' ? ClockIcon : DocumentTextIcon;
                    return (
                      <button
                        key={key}
                        onClick={() => updateViewFilter(key as ViewFilter)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-success-900/30 text-success-300 ring-1 ring-success-700/30'
                            : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(prompt)}
                        disabled={favoritePendingId === prompt.id}
                        aria-pressed={prompt.isFavorite ? 'true' : 'false'}
                        className={`rounded-full border border-transparent p-2 transition-colors duration-200 ${
                          prompt.isFavorite
                            ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                            : 'text-gray-400 hover:text-amber-200 hover:border-amber-500/20 hover:bg-amber-500/10'
                        } ${favoritePendingId === prompt.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {prompt.isFavorite ? (
                          <StarSolidIcon className="w-4 h-4" />
                        ) : (
                          <StarOutlineIcon className="w-4 h-4" />
                        )}
                        <span className="sr-only">
                          {prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        </span>
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
                        {prompt.category}
                      </span>
                    </div>
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
              {activeSearchQuery ? 'No prompts found' : 'No prompts yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeSearchQuery 
                ? `No prompts match "${activeSearchQuery}". Try adjusting your search or filters.`
                : 'Get started by creating your first prompt.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeSearchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSearchQuery('');
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
