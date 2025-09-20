import React from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
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