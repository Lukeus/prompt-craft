import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  SparklesIcon,
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  FolderPlusIcon,
  ClockIcon,
  HeartIcon,
  DocumentTextIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  { label: 'Dashboard', path: '/', icon: CursorArrowRaysIcon, exact: true },
  { label: 'Prompt Library', path: '/prompts', icon: DocumentTextIcon, exact: false },
  { label: 'Advanced Search', path: '/search', icon: SparklesIcon, exact: true },
  { label: 'MCP Control', path: '/mcp', icon: FolderIcon, exact: true },
];

const categoryLinks = [
  { label: 'Workflows', category: 'work', accent: 'primary' },
  { label: 'Personal', category: 'personal', accent: 'accent' },
  { label: 'Shared', category: 'shared', accent: 'success' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showLabels = !isCollapsed;

  const goToNewPrompt = () => navigate('/prompts/new');
  const goToFavorites = () => navigate('/prompts?view=favorites');
  const goToRecent = () => navigate('/prompts?view=recent');

  return (
    <aside className={`workspace-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="workspace-sidebar__header">
        <button type="button" onClick={onToggleCollapse} className="workspace-sidebar__collapse">
          <span className="sr-only">Toggle sidebar</span>
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showLabels && (
          <div className="workspace-sidebar__brand">
            <SparklesIcon className="w-5 h-5" />
            <span>Navigator</span>
          </div>
        )}
      </div>

      <nav className="workspace-sidebar__section">
        {navigationItems.map(({ label, path, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              `workspace-sidebar__item ${isActive ? 'active' : ''}`
            }
            title={!showLabels ? label : undefined}
          >
            <Icon className="w-4 h-4" />
            {showLabels && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="workspace-sidebar__section">
        {showLabels && <p className="workspace-sidebar__section-label">Prompt spaces</p>}
        <div className="workspace-sidebar__section-items">
          {categoryLinks.map(({ label, category, accent }) => (
            <NavLink
              key={category}
              to={{ pathname: '/prompts', search: `?category=${category}` }}
              className={({ isActive }) =>
                `workspace-sidebar__pill workspace-sidebar__pill--${accent} ${
                  isActive && location.search.includes(`category=${category}`) ? 'active' : ''
                }`
              }
              title={!showLabels ? label : undefined}
            >
              <span className="dot" />
              {showLabels && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="workspace-sidebar__section">
        {showLabels && <p className="workspace-sidebar__section-label">Shortcuts</p>}
        <div className="workspace-sidebar__section-items shortcuts">
          <button type="button" className="workspace-sidebar__command" onClick={goToNewPrompt} title={!showLabels ? 'New prompt' : undefined}>
            <FolderPlusIcon className="w-4 h-4" />
            {showLabels && <span>New Prompt</span>}
          </button>
          <button
            type="button"
            className="workspace-sidebar__command"
            onClick={goToFavorites}
            title={!showLabels ? 'Favorites' : undefined}
          >
            <HeartIcon className="w-4 h-4" />
            {showLabels && <span>Favorites</span>}
          </button>
          <button
            type="button"
            className="workspace-sidebar__command"
            onClick={goToRecent}
            title={!showLabels ? 'Recently updated' : undefined}
          >
            <ClockIcon className="w-4 h-4" />
            {showLabels && <span>Recently Updated</span>}
          </button>
        </div>
      </div>

      <div className="workspace-sidebar__footer">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="workspace-sidebar__footer-button"
          type="button"
        >
          <ArrowUpOnSquareIcon className="w-4 h-4" />
          {showLabels && <span>Export</span>}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="workspace-sidebar__footer-button"
          type="button"
        >
          <ArrowDownOnSquareIcon className="w-4 h-4" />
          {showLabels && <span>Import</span>}
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
