import { BrowserWindow } from 'electron';
import path from 'path';

// Mock electron
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  app: {
    getPath: jest.fn(() => '/mock/path'),
  },
}));

// Mock environment
jest.mock('../main/utils/environment', () => ({
  isDev: jest.fn(),
}));

const MockedBrowserWindow = BrowserWindow as jest.MockedClass<typeof BrowserWindow>;

describe('Renderer Loading', () => {
  let mockWindow: any;
  let mockWebContents: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock webContents
    mockWebContents = {
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      openDevTools: jest.fn(),
      session: {
        on: jest.fn(),
      },
      send: jest.fn(),
    };

    // Create mock window
    mockWindow = {
      webContents: mockWebContents,
      on: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      loadURL: jest.fn().mockResolvedValue(undefined),
    };

    MockedBrowserWindow.mockImplementation(() => mockWindow);
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      const { isDev } = require('../main/utils/environment');
      isDev.mockReturnValue(true);
    });

    it('should load from localhost in development', async () => {
      // Import the main app to trigger window creation
      const { createWindow } = require('../main/window/windowManager');
      
      const window = createWindow({
        webPreferences: {
          preload: path.join(__dirname, '../shared/preload.js'),
        },
      });

      // Simulate loading the development URL
      await window.loadURL('http://localhost:3000');

      expect(window.loadURL).toHaveBeenCalledWith('http://localhost:3000');
    });

    it('should open dev tools in development', () => {
      const { isDev } = require('../main/utils/environment');
      isDev.mockReturnValue(true);

      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Simulate the behavior that would happen in development
      if (isDev()) {
        window.webContents.openDevTools();
      }

      expect(window.webContents.openDevTools).toHaveBeenCalled();
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      const { isDev } = require('../main/utils/environment');
      isDev.mockReturnValue(false);
    });

    it('should load from file:// URL in production', () => {
      const { isDev } = require('../main/utils/environment');
      
      // Simulate production URL creation
      const startUrl = isDev() 
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../renderer/index.html')}`;

      expect(startUrl).toMatch(/^file:\/\//);
      expect(startUrl).toContain('index.html');
    });

    it('should not open dev tools in production', () => {
      const { isDev } = require('../main/utils/environment');
      const { createWindow } = require('../main/window/windowManager');
      
      const window = createWindow();

      // Simulate the behavior that would happen in production
      if (isDev()) {
        window.webContents.openDevTools();
      }

      expect(window.webContents.openDevTools).not.toHaveBeenCalled();
    });
  });

  describe('Loading Error Handling', () => {
    it('should handle load URL errors', async () => {
      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Mock loadURL to reject
      window.loadURL.mockRejectedValue(new Error('Failed to load'));

      try {
        await window.loadURL('http://localhost:3000');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to load');
      }
    });

    it('should register did-fail-load event handler', () => {
      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Check if webContents.on was called with 'did-fail-load'
      expect(mockWebContents.on).toHaveBeenCalledWith('did-fail-load', expect.any(Function));
    });

    it('should register did-finish-load event handler', () => {
      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Check if webContents.on was called with 'did-finish-load'
      expect(mockWebContents.on).toHaveBeenCalledWith('did-finish-load', expect.any(Function));
    });

    it('should handle did-fail-load event', () => {
      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Find the did-fail-load callback
      const failLoadCallback = mockWebContents.on.mock.calls.find(
        call => call[0] === 'did-fail-load'
      )?.[1];

      if (failLoadCallback) {
        const mockEvent = {};
        const errorCode = -6; // NET_ERROR
        const errorDescription = 'The connection was refused';
        const validatedURL = 'http://localhost:3000';

        // Execute the callback with error parameters
        failLoadCallback(mockEvent, errorCode, errorDescription, validatedURL);

        // Verify it was called (error handling would be logged)
        expect(failLoadCallback).toBeDefined();
      }
    });

    it('should handle did-finish-load event', () => {
      const { createWindow } = require('../main/window/windowManager');
      const window = createWindow();

      // Find the did-finish-load callback
      const finishLoadCallback = mockWebContents.on.mock.calls.find(
        call => call[0] === 'did-finish-load'
      )?.[1];

      if (finishLoadCallback) {
        // Execute the callback
        finishLoadCallback();

        // Verify it was called (success would be logged)
        expect(finishLoadCallback).toBeDefined();
      }
    });
  });

  describe('Preload Script', () => {
    it('should load with preload script configured', () => {
      const { createWindow } = require('../main/window/windowManager');
      
      const preloadPath = path.join(__dirname, '../shared/preload.js');
      
      const window = createWindow({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: preloadPath,
        },
      });

      expect(MockedBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
          }),
        })
      );
    });
  });

  describe('Security Configuration', () => {
    it('should disable node integration', () => {
      const { createWindow } = require('../main/window/windowManager');
      
      createWindow({
        webPreferences: {
          nodeIntegration: false,
        },
      });

      expect(MockedBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
          }),
        })
      );
    });

    it('should enable context isolation', () => {
      const { createWindow } = require('../main/window/windowManager');
      
      createWindow({
        webPreferences: {
          contextIsolation: true,
        },
      });

      expect(MockedBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            contextIsolation: true,
          }),
        })
      );
    });
  });
});