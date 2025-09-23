import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BoltIcon,
  CircleStackIcon,
  ClockIcon,
  CpuChipIcon,
  PowerIcon,
  ServerIcon,
  StopIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useMCP } from '../hooks/useElectronAPI';

interface McpLogEntry {
  id: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system';
  message: string;
}

interface McpStatus {
  running: boolean;
  pid?: number;
  port?: number;
  startTime?: string;
  logs?: McpLogEntry[];
  error?: string;
}

const MCPPage: React.FC = () => {
  const navigate = useNavigate();
  const { startServer, stopServer, getStatus, onStatusChanged } = useMCP();

  const [status, setStatus] = useState<McpStatus>({ running: false, logs: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrapStatus = async () => {
      try {
        const response = await getStatus();
        if (!isMounted) return;
        if (response.success && response.data) {
          setStatus({
            running: response.data.running,
            pid: response.data.pid,
            port: response.data.port,
            startTime: response.data.startTime,
            logs: response.data.logs ?? [],
            error: response.data.error,
          });
        }
      } catch (error) {
        if (isMounted) {
          toast.error(`Failed to load MCP status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapStatus();
    const unsubscribe = onStatusChanged((payload: any) => {
      setStatus({
        running: payload.running,
        pid: payload.pid,
        port: payload.port,
        startTime: payload.startTime,
        logs: payload.logs ?? [],
        error: payload.error,
      });
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [getStatus, onStatusChanged]);

  useEffect(() => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [status.logs]);

  const handleStart = async () => {
    setIsBusy(true);
    try {
      const response = await startServer();
      if (response.success) {
        toast.success('Starting MCP server...');
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error(`Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    setIsBusy(true);
    try {
      const response = await stopServer();
      if (response.success) {
        toast.success('Stopping MCP server...');
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error(`Failed to stop MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBusy(false);
    }
  };

  const runningBadge = useMemo(() => {
    return status.running ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-success-500/20 text-success-200 text-xs font-semibold">
        <BoltIcon className="w-4 h-4 mr-1" />
        Running
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-200 text-xs font-semibold">
        <PowerIcon className="w-4 h-4 mr-1" />
        Stopped
      </span>
    );
  }, [status.running]);

  const formattedStartTime = status.startTime
    ? new Date(status.startTime).toLocaleString()
    : '—';

  const logEntries = status.logs ?? [];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-primary-600/20 border border-primary-500/30 rounded-full text-sm font-semibold text-primary-200 mb-3">
              <ServerIcon className="w-4 h-4 mr-2" />
              Model Context Protocol
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">MCP Server Control</h1>
            <p className="text-gray-400 max-w-2xl">
              Manage the Prompt Craft MCP server. Start or stop the service, monitor logs, and view runtime status directly from the desktop app.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {runningBadge}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                disabled={status.running || isBusy}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status.running || isBusy
                    ? 'bg-dark-800/60 text-gray-500 cursor-not-allowed'
                    : 'bg-success-600 text-white hover:bg-success-500'
                }`}
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Start
              </button>
              <button
                onClick={handleStop}
                disabled={!status.running || isBusy}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !status.running || isBusy
                    ? 'bg-dark-800/60 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                <StopIcon className="w-4 h-4 mr-2" />
                Stop
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-100 flex items-center">
            <CpuChipIcon className="w-5 h-5 mr-2 text-primary-300" />
            Runtime Details
          </h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Process ID</span>
              <span className="font-mono text-gray-100">{status.pid ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Start time</span>
              <span className="text-gray-100">{formattedStartTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Transport</span>
              <span className="text-gray-100">STDIO</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Port</span>
              <span className="text-gray-100">{status.port ?? '—'}</span>
            </div>
            {status.error && (
              <div className="flex items-center gap-2 text-red-300">
                <BoltIcon className="w-4 h-4" />
                <span>{status.error}</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 space-y-3"
        >
          <h2 className="text-lg font-semibold text-gray-100 flex items-center">
            <CircleStackIcon className="w-5 h-5 mr-2 text-primary-300" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/prompts')}
              className="w-full px-4 py-2 bg-dark-800/60 text-gray-200 rounded-lg hover:bg-dark-700/60 text-left"
            >
              View Prompt Library
            </button>
            <a
              href="https://modelcontextprotocol.io/"
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-2 bg-dark-800/60 text-gray-200 rounded-lg hover:bg-dark-700/60"
            >
              MCP Documentation
            </a>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            Server runs using the MCP SDK over stdio. Use the CLI to connect as a client.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-100">Live Logs</h2>
            <span className="text-xs text-gray-500">{logEntries.length} entries</span>
          </div>
          <div
            ref={logContainerRef}
            className="flex-1 bg-dark-900/60 border border-dark-700/50 rounded-xl p-4 overflow-auto text-xs font-mono text-gray-300 max-h-80"
          >
            {isLoading && <div className="text-gray-500">Loading status…</div>}
            {!isLoading && logEntries.length === 0 && (
              <div className="text-gray-500">No log output yet. Start the server to see logs.</div>
            )}
            <AnimatePresence>
              {logEntries.map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-1"
                >
                  <span className="text-gray-500">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span
                    className={`uppercase text-[10px] px-2 py-0.5 rounded ${
                      entry.type === 'stderr'
                        ? 'text-red-300'
                        : entry.type === 'stdout'
                        ? 'text-primary-300'
                        : 'text-gray-400'
                    }`}
                  >
                    {entry.type}
                  </span>{' '}
                  <span className="whitespace-pre-wrap text-gray-200">{entry.message.trim()}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MCPPage;
