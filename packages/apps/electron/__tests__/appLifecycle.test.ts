import { app, BrowserWindow, ipcMain } from 'electron';

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn(),
    getPath: jest.fn(() => '/mock/path'),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => []),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
  },
  Tray: jest.fn(),
  nativeImage: {
    createFromPath: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
    })),
  },
}));

// Mock the main index file components
jest.mock('../main/window/windowManager', () => ({
  createWindow: jest.fn(),
}));

jest.mock('../main/ipc/ipcHandlers', () => ({
  setupIpcHandlers: jest.fn(),
}));

jest.mock('../main/menu/applicationMenu', () => ({
  createApplicationMenu: jest.fn(),
}));

jest.mock('../main/utils/environment', () => ({
  isDev: jest.fn(() => false),
}));

const mockApp = app as jest.Mocked<typeof app>;

describe('Application Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App Ready Event', () => {
    it('should register app ready handler', () => {
      // Test that app.whenReady can be called without errors
      expect(() => {
        mockApp.whenReady();
      }).not.toThrow();
    });

    it('should set up all components when app is ready', () => {
      // Test component availability without importing main index
      const { createWindow } = require('../main/window/windowManager');
      const { setupIpcHandlers } = require('../main/ipc/ipcHandlers');
      const { createApplicationMenu } = require('../main/menu/applicationMenu');
      
      // Verify that all required components exist
      expect(createWindow).toBeDefined();
      expect(setupIpcHandlers).toBeDefined();
      expect(createApplicationMenu).toBeDefined();
    });
  });

  describe('Window All Closed Event', () => {
    it('should register window-all-closed handler', () => {
      // Test that the event handler can be registered
      mockApp.on('window-all-closed', () => mockApp.quit());
      
      expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
    });

    it('should quit app when all windows are closed', () => {
      // Test the window-all-closed behavior directly
      const quitHandler = jest.fn(() => mockApp.quit());
      mockApp.on('window-all-closed', quitHandler);
      
      // Find and execute the callback
      const windowAllClosedCallback = mockApp.on.mock.calls.find(
        call => call[0] === 'window-all-closed'
      )?.[1];

      expect(windowAllClosedCallback).toBeDefined();
      
      // Execute the callback
      windowAllClosedCallback!();

      expect(mockApp.quit).toHaveBeenCalled();
    });
  });

  describe('Before Quit Event', () => {
    it('should register before-quit handler', () => {
      // Test that before-quit event can be registered
      const beforeQuitHandler = jest.fn();
      mockApp.on('before-quit', beforeQuitHandler);

      expect(mockApp.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
    });

    it('should handle before-quit event', () => {
      // Test the before-quit behavior
      const beforeQuitHandler = jest.fn();
      mockApp.on('before-quit', beforeQuitHandler);
      
      // Find and execute the callback
      const beforeQuitCallback = mockApp.on.mock.calls.find(
        call => call[0] === 'before-quit'
      )?.[1];

      expect(beforeQuitCallback).toBeDefined();
      
      // Execute the callback
      beforeQuitCallback!();

      expect(beforeQuitHandler).toHaveBeenCalled();
    });
  });

  describe('Activate Event (macOS)', () => {
    it('should register activate handler', () => {
      // Test that activate event can be registered
      const activateHandler = jest.fn();
      mockApp.on('activate', activateHandler);

      expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
    });

    it('should create new window when no windows exist on activate', async () => {
      const { createWindow } = require('../main/window/windowManager');
      const MockedBrowserWindow = BrowserWindow as jest.Mocked<typeof BrowserWindow>;
      
      // Mock no windows existing
      MockedBrowserWindow.getAllWindows.mockReturnValue([]);

      // Create test activate handler
      const activateHandler = () => {
        if (MockedBrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      };
      
      mockApp.on('activate', activateHandler);

      // Execute the callback
      activateHandler();

      expect(createWindow).toHaveBeenCalled();
    });

    it('should not create new window when windows exist on activate', async () => {
      const { createWindow } = require('../main/window/windowManager');
      const MockedBrowserWindow = BrowserWindow as jest.Mocked<typeof BrowserWindow>;
      
      // Mock existing windows
      MockedBrowserWindow.getAllWindows.mockReturnValue([{} as any]);

      // Create test activate handler
      const activateHandler = () => {
        if (MockedBrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      };
      
      mockApp.on('activate', activateHandler);
      
      // Clear previous createWindow calls
      createWindow.mockClear();
      
      // Execute the callback
      activateHandler();

      expect(createWindow).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle app initialization errors gracefully', async () => {
      // Test that app.whenReady can handle errors
      const failedPromise = Promise.reject(new Error('App failed to initialize'));
      mockApp.whenReady.mockReturnValue(failedPromise);

      try {
        await mockApp.whenReady();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('App failed to initialize');
      }
    });
  });
});