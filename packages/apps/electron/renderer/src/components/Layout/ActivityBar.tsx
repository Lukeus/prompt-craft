import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ServerStackIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface ActivityBarProps {
  onToggleSidebar: () => void;
  isMobile?: boolean;
}

const activityLinks = [
  { icon: HomeIcon, path: '/', label: 'Dashboard', exact: true },
  { icon: DocumentTextIcon, path: '/prompts', label: 'Prompts', exact: false },
  { icon: MagnifyingGlassIcon, path: '/search', label: 'Search', exact: true },
  { icon: ServerStackIcon, path: '/mcp', label: 'MCP Server', exact: true },
];

export const ActivityBar: React.FC<ActivityBarProps> = ({ onToggleSidebar, isMobile }) => {
  return (
    <aside className={`activity-bar ${isMobile ? 'mobile' : ''}`}>
      <div className="activity-bar__top">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="activity-bar__logo"
          aria-label="Toggle sidebar"
        >
          <span className="activity-bar__logo-icon">PC</span>
        </button>

        <nav className="activity-bar__nav">
          {activityLinks.map(({ icon: Icon, path, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `activity-bar__item ${isActive ? 'active' : ''}`
              }
              title={label}
            >
              <Icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="activity-bar__bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `activity-bar__item settings ${isActive ? 'active' : ''}`
          }
          title="Settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </NavLink>
      </div>
    </aside>
  );
};
