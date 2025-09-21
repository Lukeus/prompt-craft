import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// Components
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import PromptsPage from './pages/Prompts';
import SearchPage from './pages/Search';
import MCPPage from './pages/MCP';
import NewPromptPage from './pages/NewPrompt';
import EditPromptPage from './pages/EditPrompt';
import PromptViewPage from './pages/PromptView';

// Hooks
import { useElectronAPI } from './hooks/useElectronAPI';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const electronAPI = useElectronAPI();

  useEffect(() => {
    // Handle navigation events from the main process
    if (electronAPI) {
      electronAPI.navigation.onNavigateTo((route: string) => {
        navigate(route);
      });
    }
  }, [electronAPI, navigate]);

  useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        // Check if we're running in Electron
        if (window.electronEnv?.isElectron) {
          console.log('Running in Electron:', window.electronEnv.electronVersion);
        }

        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg mb-4 mx-auto"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.div>
          <motion.h1 
            className="text-xl font-bold bg-gradient-to-r from-gray-100 via-primary-300 to-accent-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Prompt Craft
          </motion.h1>
          <motion.p 
            className="text-gray-400 text-sm mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Initializing your AI prompt workspace...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="/prompts/new" element={<NewPromptPage />} />
              <Route path="/prompts/:id" element={<PromptViewPage />} />
              <Route path="/prompts/:id/edit" element={<EditPromptPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/mcp" element={<MCPPage />} />
              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Layout>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(31, 41, 55, 0.95)',
            color: '#f9fafb',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
    </>
  );
}

export default App;