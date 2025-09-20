import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export const setupIpcHandlers = (mainWindow: BrowserWindow | null) => {
  // Mock data for testing
  const mockPrompts = [
    {
      id: '1',
      name: 'Code Review Assistant',
      description: 'A prompt for conducting thorough code reviews',
      content: 'Please review this code for {{language}} and provide feedback on {{aspects}}.',
      category: 'work',
      tags: ['code-review', 'development'],
      author: 'Test User',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variables: []
    },
    {
      id: '2',
      name: 'Creative Writing Helper',
      description: 'Assist with creative writing projects',
      content: 'Help me write a {{genre}} story about {{topic}} with {{tone}} tone.',
      category: 'personal',
      tags: ['writing', 'creative'],
      author: 'Test User',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variables: []
    }
  ];

  // Prompt CRUD operations
  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_ALL, async () => {
    try {
      return { success: true, data: mockPrompts };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROMPTS.GET_BY_ID, async (_, promptId: string) => {
    try {
      const prompt = mockPrompts.find(p => p.id === promptId);
      if (prompt) {
        return { success: true, data: prompt };
      } else {
        return { success: false, error: 'Prompt not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DATABASE.GET_STATS, async () => {
    try {
      const stats = {
        total: mockPrompts.length,
        work: mockPrompts.filter((p: any) => p.category === 'work').length,
        personal: mockPrompts.filter((p: any) => p.category === 'personal').length,
        shared: mockPrompts.filter((p: any) => p.category === 'shared').length,
      };
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // MCP Server operations
  ipcMain.handle(IPC_CHANNELS.MCP.START_SERVER, async () => {
    try {
      return { success: true, message: 'MCP Server started (mock)' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MCP.STOP_SERVER, async () => {
    try {
      return { success: true, message: 'MCP Server stopped (mock)' };
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
