import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bars3Icon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MobileTopBarProps {
  onToggleSidebar: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ onToggleSidebar }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 lg:hidden">
      <div className="glass backdrop-blur-md border-0 border-b border-dark-700/30 shadow-xl">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Hamburger Menu Button */}
            <motion.button
              onClick={onToggleSidebar}
              className="p-2 text-gray-300 hover:text-primary-400 rounded-lg hover:bg-dark-800/50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bars3Icon className="w-6 h-6" />
            </motion.button>

            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SparklesIcon className="w-4 h-4 text-white" />
              </motion.div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-100 via-primary-300 to-accent-300 bg-clip-text text-transparent">
                Prompt Craft
              </h1>
            </div>

            {/* Status Indicator */}
            <div className="text-xs font-medium text-gray-300 bg-dark-800/50 px-3 py-1 rounded-full border border-dark-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">TypeScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTopBar;