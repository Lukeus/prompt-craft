import React, { useMemo, useState } from 'react';
import {
  BoltIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

export type DiagnosticLevel = 'info' | 'warn' | 'error';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  message: string;
  level: DiagnosticLevel;
}

export interface ActivityEntry {
  id: string;
  promptName: string;
  description?: string;
  when: string;
  action: 'created' | 'updated';
  category?: string;
}

interface BottomPanelProps {
  onClose: () => void;
  logs: DiagnosticLog[];
  activity: ActivityEntry[];
}

const tabs = [
  { id: 'output', label: 'Output', icon: BoltIcon },
  { id: 'issues', label: 'Issues', icon: ExclamationTriangleIcon },
  { id: 'activity', label: 'Activity', icon: ListBulletIcon },
];

export const BottomPanel: React.FC<BottomPanelProps> = ({ onClose, logs, activity }) => {
  const [activeTab, setActiveTab] = useState<'output' | 'issues' | 'activity'>('output');

  const hasIssues = logs.some((log) => log.level !== 'info');
  const logsByTab = useMemo(() => {
    switch (activeTab) {
      case 'issues':
        return logs.filter((log) => log.level !== 'info');
      case 'output':
      default:
        return logs;
    }
  }, [activeTab, logs]);

  return (
    <section className="bottom-panel" aria-label="Workspace diagnostics">
      <header className="bottom-panel__header">
        <div className="bottom-panel__tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`bottom-panel__tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id as typeof activeTab)}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {id === 'issues' && hasIssues && (
                <span className="bottom-panel__badge">{logs.filter((log) => log.level !== 'info').length}</span>
              )}
              {id === 'activity' && activity.length > 0 && (
                <span className="bottom-panel__badge">{activity.length}</span>
              )}
            </button>
          ))}
        </div>
        <button type="button" className="bottom-panel__close" onClick={onClose}>
          <span className="sr-only">Close panel</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <div className="bottom-panel__body">
        {activeTab === 'activity' ? (
          activity.length === 0 ? (
            <p className="bottom-panel__empty">No recent prompt activity detected.</p>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="bottom-panel__activity">
                <div>
                  <p className="message">
                    <span className={`badge badge-${item.action === 'created' ? 'success' : 'primary'}`}>
                      {item.action === 'created' ? 'Created' : 'Updated'}
                    </span>
                    <span className="name">{item.promptName}</span>
                  </p>
                  <p className="meta">
                    {item.when}
                    {item.category && ` • ${item.category}`}
                    {item.description && ` — ${item.description}`}
                  </p>
                </div>
              </div>
            ))
          )
        ) : logsByTab.length === 0 ? (
          <p className="bottom-panel__empty">
            {activeTab === 'issues' ? 'No workspace issues detected.' : 'Workspace diagnostics will appear here.'}
          </p>
        ) : (
          logsByTab.map((log) => (
            <div key={log.id} className={`bottom-panel__log level-${log.level}`}>
              <p className="timestamp">{log.timestamp}</p>
              <p className="message">{log.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
