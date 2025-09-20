import { ipcMain, BrowserWindow } from 'electron';
import { Container } from '@core/infrastructure/Container';
import { PromptUseCases } from '@core/application/usecases/PromptUseCases';
import { Prompt } from '@core/domain/entities/Prompt';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export const setupIpcHandlers = (mainWindow: BrowserWindow | null) => {
  // Initialize the container and use cases
  const container = new Container();
  const promptUseCases = container.resolve<PromptUseCases>('PromptUseCases');

  // Prompt CRUD operations
  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_ALL, async () => {
    try {
      const prompts = await promptUseCases.getAllPrompts();
      return { success: true, data: prompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_ID, async (_, promptId: string) => {
    try {
      const prompt = await promptUseCases.getPromptById(promptId);
      return { success: true, data: prompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_CATEGORY, async (_, category: string) => {
    try {
      const prompts = await promptUseCases.getPromptsByCategory(category);
      return { success: true, data: prompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.SEARCH, async (_, query: string, category?: string) => {
    try {
      const prompts = await promptUseCases.searchPrompts(query, category);
      return { success: true, data: prompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.CREATE, async (_, promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const prompt = await promptUseCases.createPrompt(promptData);
      return { success: true, data: prompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.UPDATE, async (_, promptId: string, promptData: Partial<Prompt>) => {
    try {
      const prompt = await promptUseCases.updatePrompt(promptId, promptData);
      return { success: true, data: prompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.DELETE, async (_, promptId: string) => {
    try {
      await promptUseCases.deletePrompt(promptId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.RENDER, async (_, promptId: string, variables: Record<string, any>) => {
    try {
      const renderedPrompt = await promptUseCases.renderPrompt(promptId, variables);
      return { success: true, data: renderedPrompt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // MCP Server operations
  ipcMain.handle(IPC_CHANNELS.MCP.START_SERVER, async () => {
    try {
      // TODO: Implement MCP server startup
      return { success: true, message: 'MCP Server started' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.STOP_SERVER, async () => {
    try {
      // TODO: Implement MCP server shutdown
      return { success: true, message: 'MCP Server stopped' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.GET_STATUS, async () => {
    try {
      // TODO: Get MCP server status
      return { success: true, data: { running: false, port: 3000 } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Database operations
  ipcMain.handle(IPC_CHANNELS.DATABASE.GET_STATS, async () => {
    try {
      const allPrompts = await promptUseCases.getAllPrompts();
      const stats = {
        total: allPrompts.length,
        work: allPrompts.filter(p => p.category === 'work').length,
        personal: allPrompts.filter(p => p.category === 'personal').length,
        shared: allPrompts.filter(p => p.category === 'shared').length,
      };
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // File operations
  ipcMain.handle(IPC_CHANNELS.FILE.EXPORT_PROMPTS, async (_, filePath: string) => {
    try {
      // TODO: Implement prompt export
      return { success: true, message: `Prompts exported to ${filePath}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE.IMPORT_PROMPTS, async (_, filePath: string) => {
    try {
      // TODO: Implement prompt import
      return { success: true, message: `Prompts imported from ${filePath}` };
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

  // Navigation events (one-way communication)
  ipcMain.on(IPC_CHANNELS.NAVIGATION.GO_TO, (_, route: string) => {
    mainWindow?.webContents.send('navigate-to', route);
  });
};