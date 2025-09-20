import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  BriefcaseIcon, 
  HeartIcon, 
  ShareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  FolderIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useDatabase, usePrompts } from '../hooks/useElectronAPI';

interface PromptStats {
  total: number;
  work: number;
  personal: number;
  shared: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<PromptStats>({ total: 0, work: 0, personal: 0, shared: 0 });
  const [recentPrompts, setRecentPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { getStats } = useDatabase();
  const { getAllPrompts } = usePrompts();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch statistics
        const statsResponse = await getStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }

        // Fetch recent prompts
        const promptsResponse = await getAllPrompts();
        if (promptsResponse.success) {
          const sortedPrompts = promptsResponse.data
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 6);
          setRecentPrompts(sortedPrompts);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Prompts',
      value: stats.total,
      icon: DocumentTextIcon,
      color: 'from-primary-500 to-primary-600',
      change: stats.total > 0 ? '+100% this month' : 'No prompts yet',
      link: '/prompts'
    },
    {
      title: 'Work Prompts',
      value: stats.work,
      icon: BriefcaseIcon,
      color: 'from-blue-500 to-blue-600',
      change: 'Professional templates',
      link: '/prompts?category=work'
    },
    {
      title: 'Personal Prompts',
      value: stats.personal,
      icon: HeartIcon,
      color: 'from-accent-500 to-accent-600',
      change: 'Creative & hobby',
      link: '/prompts?category=personal'
    },
    {
      title: 'Shared Prompts',
      value: stats.shared,
      icon: ShareIcon,
      color: 'from-success-500 to-success-600',
      change: 'Community driven',
      link: '/prompts?category=shared'
    }
  ];

  const quickActions = [
    {
      title: 'Craft New Prompt',
      description: 'Build & test cutting-edge prompts',
      icon: PlusIcon,
      color: 'from-primary-500 to-primary-600',
      link: '/prompts/new'
    },
    {
      title: 'Work Arsenal',
      description: 'Enterprise-grade prompt templates',
      icon: BriefcaseIcon,
      color: 'from-blue-500 to-blue-600',
      link: '/prompts?category=work'
    },
    {
      title: 'AI-Powered Search',
      description: 'Intelligent prompt discovery',
      icon: MagnifyingGlassIcon,
      color: 'from-accent-500 to-accent-600',
      link: '/search'
    },
    {
      title: 'Command Center',
      description: 'Mission control for all prompts',
      icon: FolderIcon,
      color: 'from-success-500 to-success-600',
      link: '/prompts'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <motion.div 
        className="text-center sm:text-left animate-slide-up"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent-600/20 to-primary-600/20 border border-accent-500/30 rounded-full text-sm font-semibold text-accent-300 backdrop-blur-sm animate-pulse">
            <SparklesIcon className="w-4 h-4 mr-2" />
            🧪 Desktop Experience
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-dark-800/50 border border-dark-600/50 rounded-full text-xs font-medium text-gray-400">
            <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
            Electron Powered
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance mb-6">
          <span className="bg-gradient-to-r from-gray-100 via-primary-300 to-accent-400 bg-clip-text text-transparent">
            Supercharge Your 
          </span>
          <span className="bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent">
            AI Workflow
          </span>
        </h1>
        
        <p className="text-xl text-gray-200 max-w-3xl text-balance leading-relaxed mb-4">
          The most powerful prompt management system ever built.
        </p>
        <p className="text-lg text-gray-400 max-w-3xl text-balance leading-relaxed">
          Organize, test, and deploy prompts with TypeScript precision. 
          <span className="text-primary-400 font-medium">Real-time testing</span>, 
          <span className="text-accent-400 font-medium">smart categorization</span>, and 
          <span className="text-success-400 font-medium">seamless workflows</span>.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-center sm:justify-start">
          <Link to="/prompts/new" className="btn-primary">
            <SparklesIcon className="w-5 h-5 mr-2" />
            Start Crafting
          </Link>
          <Link to="/prompts" className="btn-secondary">
            <FolderIcon className="w-5 h-5 mr-2" />
            Explore Library
          </Link>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={stat.link} className="block">
              <div className="stat-card group">
                <div className="stat-card-content">
                  <div className={`stat-icon-container bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="stat-content">
                    <p className="stat-number">{stat.value}</p>
                    <p className="stat-label">{stat.title}</p>
                    <p className="stat-change">{stat.change}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="glass-card rounded-xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2 text-accent-400" />
              Quick Actions
            </h2>
            <p className="text-sm text-gray-400 mt-1">Jump into your most common workflows</p>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-300 font-medium">Ready to Go</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <Link to={action.link} className="action-card group">
                <div className={`action-icon bg-gradient-to-br ${action.color}`}>
                  <action.icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">{action.title}</h3>
                  <p className="action-desc">{action.description}</p>
                </div>
                <ArrowRightIcon className="action-arrow" />
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Prompts */}
      {recentPrompts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-100">Recent Prompts</h2>
            <Link to="/prompts" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                className="glass-light rounded-xl p-6 hover:bg-dark-700/30 transition-all duration-200 cursor-pointer"
              >
                <Link to={`/prompts/${prompt.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      prompt.category === 'work' ? 'bg-blue-500/20 text-blue-400' :
                      prompt.category === 'personal' ? 'bg-accent-500/20 text-accent-400' :
                      'bg-success-500/20 text-success-400'
                    }`}>
                      {prompt.category === 'work' ? <BriefcaseIcon className="w-5 h-5" /> :
                       prompt.category === 'personal' ? <HeartIcon className="w-5 h-5" /> :
                       <ShareIcon className="w-5 h-5" />}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prompt.category === 'work' ? 'bg-blue-500/20 text-blue-400' :
                      prompt.category === 'personal' ? 'bg-accent-500/20 text-accent-400' :
                      'bg-success-500/20 text-success-400'
                    }`}>
                      {prompt.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-200 mb-2 line-clamp-2">{prompt.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-3">{prompt.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                    {prompt.tags?.length > 0 && (
                      <span>{prompt.tags.length} tags</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {recentPrompts.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-sm font-medium text-gray-200 mb-2">No prompts yet</h3>
          <p className="text-sm text-gray-400 mb-6">Get started by creating your first prompt.</p>
          <Link to="/prompts/new" className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create New Prompt
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;