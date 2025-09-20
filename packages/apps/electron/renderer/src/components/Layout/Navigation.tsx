import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  ServerIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: HomeIcon,
      exact: true,
    },
    {
      name: 'Prompts',
      path: '/prompts',
      icon: DocumentTextIcon,
      exact: false,
    },
    {
      name: 'Search',
      path: '/search',
      icon: MagnifyingGlassIcon,
      exact: true,
    },
    {
      name: 'MCP Server',
      path: '/mcp',
      icon: ServerIcon,
      exact: true,
    },
  ];

  return (
    <nav className="glass backdrop-blur-md border-0 border-b border-dark-700/30 shadow-xl titlebar-drag">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SparklesIcon className="w-4 h-4 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-100 via-primary-300 to-accent-300 bg-clip-text text-transparent">
              Prompt Craft
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex sm:space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end={item.exact}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className="text-xs font-medium text-gray-300 bg-dark-800/50 px-3 py-1 rounded-full border border-dark-700/50">
              TypeScript Powered
            </div>
            
            {/* Settings Button */}
            <motion.button 
              className="p-2 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-dark-800/50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </motion.button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;