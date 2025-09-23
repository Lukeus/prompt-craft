import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';

import Sidebar from './Sidebar';
import MobileTopBar from './MobileTopBar';
import { ActivityBar } from './ActivityBar';
import { BottomPanel, DiagnosticLog, ActivityEntry } from './BottomPanel';
import { StatusBar } from './StatusBar';
import { CommandPalette, CommandPaletteItem } from '../CommandPalette/CommandPalette';
import { useElectronAPI, useDiagnostics, useMCP } from '../../hooks/useElectronAPI';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const electronAPI = useElectronAPI();
  const { getSnapshot, onUpdated } = useDiagnostics();
  const { onStatusChanged, getStatus } = useMCP();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLog[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [totalPrompts, setTotalPrompts] = useState<number | undefined>(undefined);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [platformLabel, setPlatformLabel] = useState('Desktop');

  const appendLog = useCallback(
    (message: string, level: DiagnosticLog['level'] = 'info') => {
      const entry: DiagnosticLog = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        level,
      };
      setDiagnosticLogs((prev) => [entry, ...prev].slice(0, 40));
    },
    []
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get('q') ?? '');
    setIsCommandPaletteOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const focusOnShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', focusOnShortcut);
    return () => window.removeEventListener('keydown', focusOnShortcut);
  }, []);

  useEffect(() => {
    const handleCommandPaletteShortcut = (event: KeyboardEvent) => {
      const isMac = navigator.platform?.toLowerCase().includes('mac');
      const primary = isMac ? event.metaKey : event.ctrlKey;
      if (primary && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleCommandPaletteShortcut);
    return () => window.removeEventListener('keydown', handleCommandPaletteShortcut);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydratePlatform = async () => {
      if (electronAPI?.system?.getPlatform) {
        try {
          const platformResult = await electronAPI.system.getPlatform();
          if (isMounted && platformResult.success && platformResult.data) {
            setPlatformLabel(platformResult.data);
            return;
          }
        } catch (error) {
          appendLog(`Unable to determine platform: ${error instanceof Error ? error.message : 'Unknown error'}`, 'warn');
        }
      }

      if (isMounted && typeof navigator !== 'undefined' && navigator.platform) {
        setPlatformLabel(navigator.platform);
      }
    };

    hydratePlatform();

    return () => {
      isMounted = false;
    };
  }, [electronAPI, appendLog]);

  const applyDiagnosticsSnapshot = useCallback((payload: any) => {
    const stats = payload?.stats ?? { total: 0, work: 0, personal: 0, shared: 0 };
    const activity: ActivityEntry[] = Array.isArray(payload?.activity)
      ? payload.activity.map((item: any) => ({
          id: item.id,
          promptName: item.name,
          description: item.description,
          when: new Date(item.updatedAt).toLocaleString(),
          action: item.action ?? 'updated',
          category: item.category,
        }))
      : [];

    setTotalPrompts(stats.total ?? 0);
    setActivityEntries(activity);
    setLastSyncedAt(
      payload?.timestamp
        ? new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );

    return {
      total: stats.total ?? 0,
      activityCount: activity.length,
    };
  }, []);

  useEffect(() => {
    let unsubscribeDiagnostics: (() => void) | undefined;
    let isMounted = true;

    const bootstrapDiagnostics = async () => {
      if (!getSnapshot) {
        return;
      }

      setIsSyncing(true);

      try {
        const response = await getSnapshot();
        if (!isMounted) return;

        if (response.success && response.data) {
          const summary = applyDiagnosticsSnapshot(response.data);
          appendLog(
            `Workspace diagnostics synced (${summary.total} prompts, ${summary.activityCount} recent).`,
            'info'
          );
        } else if (response.error) {
          appendLog(`Diagnostics snapshot failed: ${response.error}`, 'warn');
        }
      } catch (error) {
        if (!isMounted) return;
        appendLog(
          `Diagnostics snapshot error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'error'
        );
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    bootstrapDiagnostics();

    if (onUpdated) {
      unsubscribeDiagnostics = onUpdated((payload) => {
        const summary = applyDiagnosticsSnapshot(payload);
        const sourceLabel = payload?.source ?? 'broadcast';
        appendLog(
          `Diagnostics updated via ${sourceLabel} (${summary.total} prompts).`,
          sourceLabel.includes('error') ? 'warn' : 'info'
        );
      });
    }

    return () => {
      isMounted = false;
      unsubscribeDiagnostics?.();
    };
  }, [getSnapshot, onUpdated, applyDiagnosticsSnapshot, appendLog]);

  useEffect(() => {
    const unsubscribe = onStatusChanged((status: any) => {
      const statusLabel = status?.running ? 'online' : 'offline';
      const portInfo = status?.port ? ` on port ${status.port}` : '';
      appendLog(`MCP server is ${statusLabel}${portInfo}.`, status?.running ? 'info' : 'warn');
    });

    return () => {
      unsubscribe?.();
    };
  }, [onStatusChanged, appendLog]);

  useEffect(() => {
    const primeStatus = async () => {
      try {
        const response = await getStatus();
        if (response.success && response.data) {
          const status = response.data;
          const statusLabel = status.running ? 'online' : 'offline';
          const portInfo = status.port ? ` on port ${status.port}` : '';
          appendLog(`MCP server currently ${statusLabel}${portInfo}.`, status.running ? 'info' : 'warn');
        }
      } catch (error) {
        appendLog(
          `Unable to determine MCP server status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'warn'
        );
      }
    };

    primeStatus();
  }, [getStatus, appendLog]);

  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  const closeMobileNavigation = () => setIsMobileSidebarOpen(false);
  const togglePanel = () => setIsPanelOpen((prev) => !prev);

  const triggerSearchNavigation = useCallback(() => {
    const trimmed = searchValue.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set('q', trimmed);
    }
    navigate(`/prompts${params.toString() ? `?${params.toString()}` : ''}`);
  }, [navigate, searchValue]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      triggerSearchNavigation();
    }

    if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  const sectionTitle = useMemo(() => {
    switch (true) {
      case location.pathname === '/':
        return 'Dashboard';
      case location.pathname.startsWith('/prompts'):
        return 'Prompt Library';
      case location.pathname.startsWith('/search'):
        return 'Advanced Search';
      case location.pathname.startsWith('/mcp'):
        return 'MCP Control';
      default:
        return 'Workspace';
    }
  }, [location.pathname]);

  const commandItems = useMemo<CommandPaletteItem[]>(() => {
    return [
      {
        id: 'navigate-dashboard',
        title: 'Go to Dashboard',
        description: 'Navigate to the workspace overview.',
        shortcut: '⌘ 1',
        group: 'Navigation',
        action: () => navigate('/'),
      },
      {
        id: 'navigate-prompts',
        title: 'Open Prompt Library',
        description: 'Browse, search, and manage prompts.',
        shortcut: '⌘ 2',
        group: 'Navigation',
        action: () => navigate('/prompts'),
      },
      {
        id: 'navigate-favorites',
        title: 'Show Favorite Prompts',
        description: 'Jump directly to saved favorites.',
        group: 'Navigation',
        action: () => navigate('/prompts?view=favorites'),
      },
      {
        id: 'new-prompt',
        title: 'Create New Prompt',
        description: 'Launch the multi-step prompt creation wizard.',
        shortcut: '⌘ N',
        group: 'Prompts',
        action: () => navigate('/prompts/new'),
      },
      {
        id: 'focus-search',
        title: 'Focus Quick Search',
        description: 'Move focus to the quick search field.',
        shortcut: '⌘ K',
        group: 'Workspace',
        action: () => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        },
      },
      {
        id: 'toggle-diagnostics',
        title: isPanelOpen ? 'Hide Diagnostics Panel' : 'Show Diagnostics Panel',
        description: 'Toggle the bottom diagnostics console.',
        group: 'Workspace',
        action: () => setIsPanelOpen(prev => !prev),
      },
      {
        id: 'toggle-sidebar',
        title: isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
        description: 'Toggle the prompt navigator sidebar.',
        group: 'Workspace',
        action: toggleSidebar,
      },
    ];
  }, [navigate, isPanelOpen, isSidebarCollapsed, toggleSidebar]);

  return (
    <div className="app-shell">
      {!isMobile && <ActivityBar onToggleSidebar={toggleSidebar} />}

      <div className="workspace-shell">
        {isMobile && <MobileTopBar onToggleSidebar={toggleSidebar} />}

        <div className={`workspace-layout ${isPanelOpen ? 'with-panel' : ''}`}>
          {!isMobile && (
            <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
          )}

          <main className="workspace-main" role="main">
            <header className="command-bar">
              <div className="command-bar__section">
                {isMobile && (
                  <button
                    type="button"
                    className="command-bar__button"
                    onClick={toggleSidebar}
                    aria-label="Toggle navigation"
                  >
                    <Bars3BottomLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <div className="command-bar__title">
                  <span className="eyebrow">Prompt Craft</span>
                  <h2>{sectionTitle}</h2>
                </div>
              </div>

              <div className="command-bar__section">
                <div className="command-bar__search">
                  <MagnifyingGlassIcon className="icon" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Quick search prompts or commands"
                    aria-label="Global search"
                  />
                  <kbd className="meta">⌘</kbd>
                  <kbd>K</kbd>
                </div>
                <button
                  type="button"
                  className="command-bar__button"
                  aria-label="Open command palette"
                  onClick={() => setIsCommandPaletteOpen(true)}
                >
                  <CommandLineIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="workspace-content">
              <motion.div
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="workspace-scroll"
              >
                <div className="workspace-container">{children}</div>
              </motion.div>
              <AnimatePresence>
                {isPanelOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BottomPanel
                      onClose={togglePanel}
                      logs={diagnosticLogs}
                      activity={activityEntries}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>

        <StatusBar
          onTogglePanel={togglePanel}
          isPanelOpen={isPanelOpen}
          totalPrompts={totalPrompts}
          lastSyncedAt={lastSyncedAt}
          platformLabel={platformLabel}
          isSyncing={isSyncing}
        />
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandItems}
      />

      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileNavigation}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <ActivityBar onToggleSidebar={closeMobileNavigation} isMobile />
              <Sidebar isCollapsed={false} onToggleCollapse={closeMobileNavigation} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
