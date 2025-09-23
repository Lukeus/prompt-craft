import { ipcMain, BrowserWindow, dialog, app } from 'electron';
import { ChildProcess, fork } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { Prompt } from '../../../../core/domain/entities/Prompt';
import { getContainer } from '../../../../core/infrastructure/Container';
import { RepositoryFactory } from '../../../../infrastructure/RepositoryFactory';
import { seedSQLiteDatabase } from '../../../../infrastructure/database/sqliteSeeder';
import { testSQLiteConnection } from '../../../../infrastructure/database/sqliteConnection';

const DIAGNOSTIC_ACTIVITY_LIMIT = 8;
const MCP_LOG_LIMIT = 200;

// Initialize container with SQLite repository for Electron
function initializeContainer() {
  const repository = RepositoryFactory.createSQLite();
  return getContainer({ promptRepository: repository });
}

let container: ReturnType<typeof initializeContainer> | null = null;
let databaseInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializeDatabase(): Promise<void> {
  if (databaseInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('Initializing SQLite database...');
      
      // Test SQLite connection
      const isConnected = await testSQLiteConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to SQLite database');
      }
      
      // Seed database with initial data if empty
      await seedSQLiteDatabase();
      
      // Initialize container after database is ready
      container = initializeContainer();
      
      databaseInitialized = true;
      console.log('SQLite database initialization completed');
    } catch (error) {
      console.error('Database initialization failed:', error);
      databaseInitialized = false;
      initializationPromise = null;
      throw error;
    }
  })();
  
  return initializationPromise;
}

async function getPromptUseCases() {
  await initializeDatabase();
  if (!container) {
    throw new Error('Container not initialized');
  }
  return container.getPromptUseCases();
}

async function collectDiagnosticsData() {
  const useCases = await getPromptUseCases();
  const categoryStats = await useCases.getCategoryStatistics();
  const allPrompts = await useCases.getAllPrompts();

  const total = (categoryStats.total ?? allPrompts.length) as number;
  const stats = {
    total,
    work: categoryStats.work ?? allPrompts.filter(prompt => prompt.category === 'work').length,
    personal: categoryStats.personal ?? allPrompts.filter(prompt => prompt.category === 'personal').length,
    shared: categoryStats.shared ?? allPrompts.filter(prompt => prompt.category === 'shared').length,
  };

  const activity = allPrompts
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, DIAGNOSTIC_ACTIVITY_LIMIT)
    .map(prompt => {
      const promptJson = prompt.toJSON();
      return {
        id: promptJson.id,
        name: promptJson.name,
        description: promptJson.description,
        updatedAt: promptJson.updatedAt,
        category: promptJson.category,
        isFavorite: promptJson.isFavorite ?? false,
        action: promptJson.createdAt === promptJson.updatedAt ? 'created' : 'updated',
      };
    });

  return {
    stats,
    activity,
    timestamp: new Date().toISOString(),
  };
}

interface McpLogEntry {
  id: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system';
  message: string;
}

interface McpState {
  process: ChildProcess | null;
  logs: McpLogEntry[];
  startTime: string | null;
  port: number | null;
  lastError: string | null;
  pid?: number;
}

const mcpState: McpState = {
  process: null,
  logs: [],
  startTime: null,
  port: null,
  lastError: null,
  pid: undefined,
};

function resolveMcpEntrypoint() {
  const prodEntry = path.join(process.resourcesPath, 'dist', 'mcp-server', 'index.js');
  if (fs.existsSync(prodEntry)) {
    return { entry: prodEntry, execArgv: [] as string[] };
  }

  const devTsEntry = path.join(process.cwd(), 'packages/apps/mcp-server/index.ts');
  if (fs.existsSync(devTsEntry)) {
    let tsNodeRegister = 'ts-node/register';
    try {
      tsNodeRegister = require.resolve('ts-node/register/transpile-only');
    } catch (error) {
      try {
        tsNodeRegister = require.resolve('ts-node/register');
      } catch (registerError) {
        appendMcpLog('stderr', 'ts-node register module not found. MCP server cannot start.');
      }
    }

    let tsConfigPathsRegister: string | null = null;
    try {
      tsConfigPathsRegister = require.resolve('tsconfig-paths/register');
    } catch (error) {
      appendMcpLog('system', 'tsconfig-paths/register not found; path aliases may not resolve for MCP server.');
    }

    const execArgv: string[] = ['-r', tsNodeRegister];
    if (tsConfigPathsRegister) {
      execArgv.push('-r', tsConfigPathsRegister);
    }

    return { entry: devTsEntry, execArgv };
  }

  const devJsEntry = path.join(process.cwd(), 'packages/apps/mcp-server/index.js');
  return { entry: devJsEntry, execArgv: [] as string[] };
}

function appendMcpLog(type: McpLogEntry['type'], message: string) {
  const entry: McpLogEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    type,
    message,
  };
  mcpState.logs = [...mcpState.logs, entry].slice(-MCP_LOG_LIMIT);
}

export function setupIpcHandlers(mainWindow: BrowserWindow | null) {
  const emitDiagnosticsUpdate = async (source: string) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    try {
      const payload = await collectDiagnosticsData();
      mainWindow.webContents.send(IPC_CHANNELS.DIAGNOSTICS.UPDATED, {
        ...payload,
        source,
      });
    } catch (error) {
      console.error('Failed to broadcast diagnostics update:', error);
    }
  };

  const emitMcpStatus = (source: string, error?: string) => {
    if (error) {
      appendMcpLog('system', error);
      mcpState.lastError = error;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.MCP.SERVER_STATUS_CHANGED, {
        running: Boolean(mcpState.process),
        pid: mcpState.pid,
        port: mcpState.port ?? undefined,
        startTime: mcpState.startTime ?? undefined,
        logs: mcpState.logs,
        error: mcpState.lastError ?? undefined,
        source,
      });
    }
  };

  // Start database initialization (but don't wait for it)
  initializeDatabase()
    .then(() => emitDiagnosticsUpdate('database:ready'))
    .catch(error => {
      console.error('Failed to initialize SQLite database:', error);
    });
  // Prompt CRUD operations
  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_ALL, async () => {
    try {
      const useCases = await getPromptUseCases();
      const prompts = await useCases.getAllPrompts();
      return { success: true, data: prompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DIAGNOSTICS.GET_SNAPSHOT, async () => {
    try {
      const payload = await collectDiagnosticsData();
      return { success: true, data: payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_ID, async (_, promptId: string) => {
    try {
      const useCases = await getPromptUseCases();
      const prompt = await useCases.getPromptById(promptId);
      if (prompt) {
        return { success: true, data: prompt };
      } else {
        return { success: false, error: 'Prompt not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_CATEGORY, async (_, category: string) => {
    try {
      const useCases = await getPromptUseCases();
      const prompts = await useCases.getPromptsByCategory(category as any);
      return { success: true, data: prompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.SEARCH, async (_, query: string, category?: string) => {
    try {
      const useCases = await getPromptUseCases();
      const searchCriteria: any = {};
      
      if (query) {
        searchCriteria.query = query;
      }
      if (category) {
        searchCriteria.category = category;
      }
      
      const results = await useCases.searchPrompts(searchCriteria);
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.CREATE, async (_, promptData: any) => {
    try {
      const useCases = await getPromptUseCases();
      const newPrompt = await useCases.createPrompt(promptData);
      await emitDiagnosticsUpdate('prompts:create');
      return { success: true, data: newPrompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.UPDATE, async (_, id: string, promptData: any) => {
    try {
      const useCases = await getPromptUseCases();
      const updateDto = { id, ...promptData };
      const updatedPrompt = await useCases.updatePrompt(updateDto);
      await emitDiagnosticsUpdate('prompts:update');
      return { success: true, data: updatedPrompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.DELETE, async (_, id: string) => {
    try {
      const useCases = await getPromptUseCases();
      const deleted = await useCases.deletePrompt(id);
      
      if (!deleted) {
        return { success: false, error: 'Prompt not found' };
      }
      
      await emitDiagnosticsUpdate('prompts:delete');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.RENDER, async (_, id: string, variables: Record<string, any>) => {
    try {
      const useCases = await getPromptUseCases();
      const renderDto = { id, variableValues: variables };
      const result = await useCases.renderPrompt(renderDto);
      return { success: true, data: result.rendered, errors: result.errors };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.SET_FAVORITE, async (_, id: string, isFavorite: boolean) => {
    try {
      const useCases = await getPromptUseCases();
      const prompt = await useCases.setFavorite({ id, isFavorite });
      await emitDiagnosticsUpdate('prompts:favorites');
      return { success: true, data: prompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DATABASE.GET_STATS, async () => {
    try {
      const useCases = await getPromptUseCases();
      const stats = await useCases.getCategoryStatistics();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // MCP Server operations
  ipcMain.handle(IPC_CHANNELS.MCP.START_SERVER, async () => {
    if (mcpState.process) {
      const message = 'MCP server is already running.';
      appendMcpLog('system', message);
      emitMcpStatus('mcp:start:duplicate');
      return { success: false, error: message };
    }

    try {
      const { entry, execArgv } = resolveMcpEntrypoint();
      appendMcpLog('system', `Starting MCP server using ${path.basename(entry)}...`);

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? 'production',
      };

      if (entry.endsWith('.ts')) {
        env.TS_NODE_PROJECT = env.TS_NODE_PROJECT || path.join(process.cwd(), 'tsconfig.json');
        env.TS_NODE_TRANSPILE_ONLY = env.TS_NODE_TRANSPILE_ONLY || 'true';
        if (!env.TS_NODE_COMPILER_OPTIONS) {
          env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ moduleResolution: 'Node', module: 'CommonJS' });
        } else {
          try {
            const existing = JSON.parse(env.TS_NODE_COMPILER_OPTIONS);
            if (!existing.module) {
              existing.module = 'CommonJS';
            }
            if (!existing.moduleResolution) {
              existing.moduleResolution = 'Node';
            }
            env.TS_NODE_COMPILER_OPTIONS = JSON.stringify(existing);
          } catch (error) {
            env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ moduleResolution: 'Node', module: 'CommonJS' });
          }
        }
      }

      const child = fork(entry, [], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        execArgv,
        env,
      });

      mcpState.process = child;
      mcpState.pid = child.pid ?? undefined;
      mcpState.startTime = new Date().toISOString();
      mcpState.lastError = null;

      child.stdout?.on('data', (data) => {
        appendMcpLog('stdout', data.toString());
        emitMcpStatus('mcp:stdout');
      });

      child.stderr?.on('data', (data) => {
        appendMcpLog('stderr', data.toString());
        emitMcpStatus('mcp:stderr');
      });

      child.on('exit', (code, signal) => {
        const message = `MCP server exited (code ${code ?? 'null'}, signal ${signal ?? 'null'})`;
        appendMcpLog('system', message);
        mcpState.process = null;
        mcpState.pid = undefined;
        mcpState.startTime = null;
        if (code && code !== 0) {
          mcpState.lastError = message;
        }
        emitMcpStatus('mcp:exit');
      });

      emitMcpStatus('mcp:start');
      return { success: true, data: { pid: child.pid }, message: 'MCP server starting' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start MCP server';
      appendMcpLog('stderr', message);
      mcpState.process = null;
      mcpState.pid = undefined;
      mcpState.startTime = null;
      mcpState.lastError = message;
      emitMcpStatus('mcp:error', message);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.STOP_SERVER, async () => {
    if (!mcpState.process) {
      const message = 'MCP server is not running.';
      appendMcpLog('system', message);
      emitMcpStatus('mcp:stop:noop');
      return { success: false, error: message };
    }

    const child = mcpState.process;

    return await new Promise((resolve) => {
      appendMcpLog('system', 'Stopping MCP server...');
      emitMcpStatus('mcp:stop');

      const finalize = (success: boolean, error?: string) => {
        mcpState.process = null;
        mcpState.pid = undefined;
        mcpState.startTime = null;
        if (error) {
          mcpState.lastError = error;
          appendMcpLog('stderr', error);
        } else {
          appendMcpLog('system', 'MCP server stopped.');
        }
        emitMcpStatus('mcp:stop:complete');
        resolve(success ? { success: true, message: 'MCP server stopped' } : { success: false, error: error || 'Failed to stop MCP server' });
      };

      const timeout = setTimeout(() => {
        if (mcpState.process) {
          child.kill('SIGKILL');
        }
      }, 4000);

      child.once('exit', () => {
        clearTimeout(timeout);
        finalize(true);
      });

      try {
        child.kill();
      } catch (error) {
        clearTimeout(timeout);
        const message = error instanceof Error ? error.message : 'Failed to stop MCP server';
        finalize(false, message);
      }
    });
  });

  ipcMain.handle(IPC_CHANNELS.MCP.GET_STATUS, async () => {
    try {
      return {
        success: true,
        data: {
          running: Boolean(mcpState.process),
          pid: mcpState.pid,
          port: mcpState.port ?? undefined,
          startTime: mcpState.startTime ?? undefined,
          logs: mcpState.logs,
          error: mcpState.lastError ?? undefined,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // System operations
  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_APP_VERSION, async () => {
    try {
      const { app } = require('electron');
      return { success: true, data: app.getVersion() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_PLATFORM, async () => {
    try {
      return { success: true, data: process.platform };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Navigation events
  ipcMain.on(IPC_CHANNELS.NAVIGATION.GO_TO, (_, route: string) => {
    mainWindow?.webContents.send('navigate-to', route);
  });
};
