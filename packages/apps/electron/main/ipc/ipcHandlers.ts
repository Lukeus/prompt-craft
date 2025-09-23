import { ipcMain, BrowserWindow, dialog, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { Prompt } from '../../../../core/domain/entities/Prompt';
import { getContainer } from '../../../../core/infrastructure/Container';
import { RepositoryFactory } from '../../../../infrastructure/RepositoryFactory';
import { seedSQLiteDatabase } from '../../../../infrastructure/database/sqliteSeeder';
import { testSQLiteConnection } from '../../../../infrastructure/database/sqliteConnection';

const DIAGNOSTIC_ACTIVITY_LIMIT = 8;

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
    try {
      const status = { running: true, port: 3000 };
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.MCP.SERVER_STATUS_CHANGED, status);
      }
      return { success: true, data: status, message: 'MCP Server started (mock)' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.STOP_SERVER, async () => {
    try {
      const status = { running: false, port: 3000 };
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.MCP.SERVER_STATUS_CHANGED, status);
      }
      return { success: true, data: status, message: 'MCP Server stopped (mock)' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.GET_STATUS, async () => {
    try {
      return { success: true, data: { running: false, port: 3000 } };
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
