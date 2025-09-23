import React from 'react';
import {
  CircleStackIcon,
  GlobeAltIcon,
  WifiIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface StatusBarProps {
  onTogglePanel: () => void;
  isPanelOpen: boolean;
  totalPrompts?: number;
  lastSyncedAt?: string | null;
  platformLabel: string;
  isSyncing: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  onTogglePanel,
  isPanelOpen,
  totalPrompts,
  lastSyncedAt,
  platformLabel,
  isSyncing,
}) => (
  <footer className="status-bar" role="contentinfo">
    <button
      type="button"
      className={`status-bar__item ${isPanelOpen ? 'active' : ''}`}
      onClick={onTogglePanel}
    >
      <WifiIcon className="w-4 h-4" />
      <span>{isPanelOpen ? 'Hide diagnostics' : 'Show diagnostics'}</span>
    </button>
    <div className="status-bar__divider" />
    <div className="status-bar__item">
      <CircleStackIcon className="w-4 h-4" />
      <span>{typeof totalPrompts === 'number' ? `${totalPrompts} prompts` : 'Workspace idle'}</span>
    </div>
    <div className="status-bar__item">
      <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin-slow text-primary-200' : ''}`} />
      <span>{isSyncing ? 'Syncing…' : lastSyncedAt ? `Last sync ${lastSyncedAt}` : 'Not yet synced'}</span>
    </div>
    <div className="status-bar__spacer" />
    <div className="status-bar__item">
      <GlobeAltIcon className="w-4 h-4" />
      <span>{platformLabel}</span>
    </div>
  </footer>
);
