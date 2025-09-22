import { EventEmitter } from 'events';

// Mock Electron
const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn(),
};

const mockBrowserWindow = {
  webContents: {
    send: jest.fn(),
  },
};

jest.mock('electron', () => ({
  ipcMain: mockIpcMain,
  BrowserWindow: jest.fn(),
  dialog: {},
  app: {
    getVersion: jest.fn(() => '1.0.3'),
  },
}));

// Mock the Container and dependencies
const mockContainer = {
  getPromptUseCases: jest.fn(),
};

const mockPromptUseCases = {
  getAllPrompts: jest.fn(),
  getPromptById: jest.fn(),
  getPromptsByCategory: jest.fn(),
  searchPrompts: jest.fn(),
  createPrompt: jest.fn(),
  updatePrompt: jest.fn(),
  deletePrompt: jest.fn(),
  renderPrompt: jest.fn(),
  getCategoryStatistics: jest.fn(),
};

const mockRepositoryFactory = {
  RepositoryFactory: {
    createSQLite: jest.fn(() => ({})),
  },
};

jest.mock('@core/infrastructure/Container', () => ({
  getContainer: jest.fn(() => mockContainer),
}));

jest.mock('@infrastructure/RepositoryFactory', () => mockRepositoryFactory);

jest.mock('@infrastructure/database/sqliteSeeder', () => ({
  seedSQLiteDatabase: jest.fn(),
}));

jest.mock('@infrastructure/database/sqliteConnection', () => ({
  testSQLiteConnection: jest.fn(() => Promise.resolve(true)),
}));

// Mock IPC channels
const mockIpcChannels = {
  PROMPTS: {
    GET_ALL: 'prompts:get-all',
    GET_BY_ID: 'prompts:get-by-id',
    GET_BY_CATEGORY: 'prompts:get-by-category',
    SEARCH: 'prompts:search',
    CREATE: 'prompts:create',
    UPDATE: 'prompts:update',
    DELETE: 'prompts:delete',
    RENDER: 'prompts:render',
  },
  DATABASE: {
    GET_STATS: 'database:get-stats',
  },
  MCP: {
    START_SERVER: 'mcp:start-server',
    STOP_SERVER: 'mcp:stop-server',
    GET_STATUS: 'mcp:get-status',
  },
  SYSTEM: {
    GET_APP_VERSION: 'system:get-app-version',
    GET_PLATFORM: 'system:get-platform',
  },
  NAVIGATION: {
    GO_TO: 'navigation:go-to',
  },
};

jest.mock('@apps/electron/shared/ipcChannels', () => ({
  IPC_CHANNELS: mockIpcChannels,
}));

// Import after mocking
import { setupIpcHandlers } from '../main/ipc/ipcHandlers';

describe('IPC Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.getPromptUseCases.mockResolvedValue(mockPromptUseCases);
  });

  describe('Setup', () => {
    test('should setup all IPC handlers', () => {
      const mockMainWindow = mockBrowserWindow as any;
      
      setupIpcHandlers(mockMainWindow);
      
      // Verify all handlers are registered
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:get-all', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:get-by-id', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:get-by-category', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:search', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:create', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:update', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:delete', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('prompts:render', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('database:get-stats', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('mcp:start-server', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('mcp:stop-server', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('mcp:get-status', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('system:get-app-version', expect.any(Function));
      expect(mockIpcMain.handle).toHaveBeenCalledWith('system:get-platform', expect.any(Function));
      expect(mockIpcMain.on).toHaveBeenCalledWith('navigation:go-to', expect.any(Function));
    });
  });

  describe('Prompt Operations', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      // Extract handlers from mock calls
      handlers = {};
      mockIpcMain.handle.mock.calls.forEach(([channel, handler]) => {
        handlers[channel] = handler;
      });
    });

    test('GET_ALL should return all prompts', async () => {
      const mockPrompts = [
        { id: '1', name: 'Test Prompt 1' },
        { id: '2', name: 'Test Prompt 2' },
      ];
      mockPromptUseCases.getAllPrompts.mockResolvedValue(mockPrompts);

      const result = await handlers['prompts:get-all']();

      expect(result).toEqual({ success: true, data: mockPrompts });
      expect(mockPromptUseCases.getAllPrompts).toHaveBeenCalled();
    });

    test('GET_ALL should handle errors', async () => {
      const error = new Error('Database error');
      mockPromptUseCases.getAllPrompts.mockRejectedValue(error);

      const result = await handlers['prompts:get-all']();

      expect(result).toEqual({ success: false, error: 'Database error' });
    });

    test('GET_BY_ID should return specific prompt', async () => {
      const mockPrompt = { id: '1', name: 'Test Prompt' };
      mockPromptUseCases.getPromptById.mockResolvedValue(mockPrompt);

      const result = await handlers['prompts:get-by-id'](null, '1');

      expect(result).toEqual({ success: true, data: mockPrompt });
      expect(mockPromptUseCases.getPromptById).toHaveBeenCalledWith('1');
    });

    test('GET_BY_ID should handle not found', async () => {
      mockPromptUseCases.getPromptById.mockResolvedValue(null);

      const result = await handlers['prompts:get-by-id'](null, '999');

      expect(result).toEqual({ success: false, error: 'Prompt not found' });
    });

    test('CREATE should create new prompt', async () => {
      const promptData = { name: 'New Prompt', content: 'Test content' };
      const createdPrompt = { id: '123', ...promptData };
      mockPromptUseCases.createPrompt.mockResolvedValue(createdPrompt);

      const result = await handlers['prompts:create'](null, promptData);

      expect(result).toEqual({ success: true, data: createdPrompt });
      expect(mockPromptUseCases.createPrompt).toHaveBeenCalledWith(promptData);
    });

    test('DELETE should delete prompt', async () => {
      mockPromptUseCases.deletePrompt.mockResolvedValue(true);

      const result = await handlers['prompts:delete'](null, '123');

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockPromptUseCases.deletePrompt).toHaveBeenCalledWith('123');
    });

    test('DELETE should handle not found', async () => {
      mockPromptUseCases.deletePrompt.mockResolvedValue(false);

      const result = await handlers['prompts:delete'](null, '999');

      expect(result).toEqual({ success: false, error: 'Prompt not found' });
    });

    test('RENDER should render prompt with variables', async () => {
      const renderResult = {
        rendered: 'Hello John!',
        errors: [],
      };
      mockPromptUseCases.renderPrompt.mockResolvedValue(renderResult);

      const result = await handlers['prompts:render'](null, '123', { name: 'John' });

      expect(result).toEqual({
        success: true,
        data: 'Hello John!',
        errors: [],
      });
      expect(mockPromptUseCases.renderPrompt).toHaveBeenCalledWith({
        id: '123',
        variableValues: { name: 'John' },
      });
    });
  });

  describe('System Operations', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      handlers = {};
      mockIpcMain.handle.mock.calls.forEach(([channel, handler]) => {
        handlers[channel] = handler;
      });
    });

    test('GET_APP_VERSION should return app version', async () => {
      const result = await handlers['system:get-app-version']();

      expect(result).toEqual({ success: true, data: '1.0.3' });
    });

    test('GET_PLATFORM should return platform', async () => {
      const result = await handlers['system:get-platform']();

      expect(result).toEqual({ success: true, data: process.platform });
    });
  });

  describe('MCP Operations', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      handlers = {};
      mockIpcMain.handle.mock.calls.forEach(([channel, handler]) => {
        handlers[channel] = handler;
      });
    });

    test('START_SERVER should return mock response', async () => {
      const result = await handlers['mcp:start-server']();

      expect(result).toEqual({ success: true, message: 'MCP Server started (mock)' });
    });

    test('STOP_SERVER should return mock response', async () => {
      const result = await handlers['mcp:stop-server']();

      expect(result).toEqual({ success: true, message: 'MCP Server stopped (mock)' });
    });

    test('GET_STATUS should return mock status', async () => {
      const result = await handlers['mcp:get-status']();

      expect(result).toEqual({ success: true, data: { running: false, port: 3000 } });
    });
  });

  describe('Database Operations', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      handlers = {};
      mockIpcMain.handle.mock.calls.forEach(([channel, handler]) => {
        handlers[channel] = handler;
      });
    });

    test('GET_STATS should return category statistics', async () => {
      const mockStats = {
        total: 10,
        categories: { work: 5, personal: 3, shared: 2 },
      };
      mockPromptUseCases.getCategoryStatistics.mockResolvedValue(mockStats);

      const result = await handlers['database:get-stats']();

      expect(result).toEqual({ success: true, data: mockStats });
      expect(mockPromptUseCases.getCategoryStatistics).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    test('GO_TO should send navigation message to renderer', () => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      const navigationHandler = mockIpcMain.on.mock.calls.find(
        ([channel]) => channel === 'navigation:go-to'
      )[1];

      navigationHandler(null, '/prompts/new');

      expect(mockBrowserWindow.webContents.send).toHaveBeenCalledWith(
        'navigate-to',
        '/prompts/new'
      );
    });
  });

  describe('Error Handling', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      setupIpcHandlers(mockBrowserWindow as any);
      
      handlers = {};
      mockIpcMain.handle.mock.calls.forEach(([channel, handler]) => {
        handlers[channel] = handler;
      });
    });

    test('should handle non-Error exceptions', async () => {
      mockPromptUseCases.getAllPrompts.mockRejectedValue('String error');

      const result = await handlers['prompts:get-all']();

      expect(result).toEqual({ success: false, error: 'Unknown error' });
    });

    test('should handle undefined exceptions', async () => {
      mockPromptUseCases.getAllPrompts.mockRejectedValue(undefined);

      const result = await handlers['prompts:get-all']();

      expect(result).toEqual({ success: false, error: 'Unknown error' });
    });
  });
});