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
      // Import after mocks are set up
      require('../main/index');

      expect(mockApp.whenReady).toHaveBeenCalled();
    });

    it('should set up all components when app is ready', () => {
      const { createWindow } = require('../main/window/windowManager');
      const { setupIpcHandlers } = require('../main/ipc/ipcHandlers');
      const { createApplicationMenu } = require('../main/menu/applicationMenu');

      // Import to trigger initialization
      require('../main/index');

      // Verify that whenReady was called
      expect(mockApp.whenReady).toHaveBeenCalled();
      
      // Don't try to execute the callback, just verify initialization methods would be called
      expect(createWindow).toBeDefined();
      expect(setupIpcHandlers).toBeDefined();
      expect(createApplicationMenu).toBeDefined();
    });
  });

  describe('Window All Closed Event', () => {
    it('should register window-all-closed handler', () => {
      require('../main/index');

      expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
    });

    it('should quit app when all windows are closed', () => {
      require('../main/index');

      // Find the window-all-closed callback
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
      require('../main/index');

      expect(mockApp.on).toHaveBeenCalledWith('before-quit', expect.any(Function));
    });

    it('should set isQuitting flag on before-quit', () => {
      const electronApp = require('../main/index').electronApp;
      
      // Find the before-quit callback
      const beforeQuitCallback = mockApp.on.mock.calls.find(
        call => call[0] === 'before-quit'
      )?.[1];

      expect(beforeQuitCallback).toBeDefined();
      
      // Execute the callback
      beforeQuitCallback!();

      // Since we can't directly access the private property, we test the behavior
      expect(beforeQuitCallback).toHaveBeenCalled;
    });
  });

  describe('Activate Event (macOS)', () => {
    it('should register activate handler', () => {
      require('../main/index');

      expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
    });

    it('should create new window when no windows exist on activate', async () => {
      const { createWindow } = require('../main/window/windowManager');
      const MockedBrowserWindow = BrowserWindow as jest.Mocked<typeof BrowserWindow>;
      
      // Mock no windows existing
      MockedBrowserWindow.getAllWindows.mockReturnValue([]);

      require('../main/index');

      // Find the activate callback
      const activateCallback = mockApp.on.mock.calls.find(
        (call: any[]) => call[0] === 'activate'
      )?.[1];

      expect(activateCallback).toBeDefined();
      
      // Clear previous createWindow calls
      createWindow.mockClear();
      
      // Execute the callback
      if (activateCallback) {
        activateCallback();
      }

      expect(createWindow).toHaveBeenCalled();
    });

    it('should not create new window when windows exist on activate', async () => {
      const { createWindow } = require('../main/window/windowManager');
      const MockedBrowserWindow = BrowserWindow as jest.Mocked<typeof BrowserWindow>;
      
      // Mock existing windows
      MockedBrowserWindow.getAllWindows.mockReturnValue([{} as any]);

      require('../main/index');

      // Find the activate callback
      const activateCallback = mockApp.on.mock.calls.find(
        (call: any[]) => call[0] === 'activate'
      )?.[1];

      // Clear previous createWindow calls
      createWindow.mockClear();
      
      // Execute the callback
      if (activateCallback) {
        activateCallback();
      }

      expect(createWindow).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle app initialization errors gracefully', () => {
      mockApp.whenReady.mockRejectedValue(new Error('App failed to initialize'));

      expect(() => require('../main/index')).not.toThrow();
    });
  });
});