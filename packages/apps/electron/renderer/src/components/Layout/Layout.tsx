import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850">
      {/* Mobile Top Bar */}
      {isMobile && (
        <MobileTopBar onToggleSidebar={toggleSidebar} />
      )}
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
        />
      )}
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar 
                isCollapsed={false} 
                onToggleCollapse={() => setIsMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden ${isMobile ? 'pt-16' : ''}`}>
        <div className="h-full overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;