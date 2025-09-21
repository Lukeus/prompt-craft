import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  MagnifyingGlassIcon, 
  ServerIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';
  const showLabels = !isCollapsed || isHovered;

  return (
    <motion.div 
      className={`${sidebarWidth} transition-all duration-300 ease-in-out flex flex-col bg-gradient-to-b from-dark-900 via-dark-850 to-dark-900 border-r border-dark-700/30 shadow-2xl backdrop-blur-sm`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isCollapsed && !isHovered ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-700/30">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            animate={{ opacity: showLabels ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            {showLabels && (
              <motion.h1 
                className="text-lg font-bold bg-gradient-to-r from-gray-100 via-primary-300 to-accent-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                Prompt Craft
              </motion.h1>
            )}
          </motion.div>
          
          {onToggleCollapse && (
            <motion.button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-primary-400 rounded-lg hover:bg-dark-800/50 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
              end={item.exact}
              title={!showLabels ? item.name : undefined}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                {showLabels && (
                  <motion.span
                    className="truncate"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </div>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Status & Settings */}
      <div className="p-4 border-t border-dark-700/30 space-y-4">
        {/* Status Indicator */}
        {showLabels && (
          <motion.div 
            className="text-xs font-medium text-gray-300 bg-dark-800/50 px-3 py-2 rounded-lg border border-dark-700/50 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              <span>TypeScript Powered</span>
            </div>
          </motion.div>
        )}
        
        {/* Settings Button */}
        <motion.button 
          className="sidebar-nav-link w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={!showLabels ? 'Settings' : undefined}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="w-5 h-5" />
            </div>
            {showLabels && (
              <motion.span
                className="truncate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                Settings
              </motion.span>
            )}
          </div>
        </motion.button>

        {/* Collapse Toggle for Mobile */}
        {!onToggleCollapse && (
          <motion.button 
            className="sidebar-nav-link w-full lg:hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0">
                <Bars3Icon className="w-5 h-5" />
              </div>
              {showLabels && (
                <motion.span
                  className="truncate"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  Menu
                </motion.span>
              )}
            </div>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;