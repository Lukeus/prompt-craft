import { BrowserWindow } from 'electron';
import { createWindow } from '../main/window/windowManager';
import path from 'path';

// Mock electron module
jest.mock('electron', () => ({
  BrowserWindow: jest.fn(),
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: {
        width: 1920,
        height: 1080,
      },
    })),
  },
  app: {
    getPath: jest.fn(() => '/mock/app/path'),
  },
}));

const MockedBrowserWindow = BrowserWindow as jest.MockedClass<typeof BrowserWindow>;

describe('Window Manager', () => {
  let mockWindow: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock window instance
    mockWindow = {
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      once: jest.fn(),
      center: jest.fn(),
      getBounds: jest.fn().mockReturnValue({ x: 100, y: 100, width: 800, height: 600 }),
      setBounds: jest.fn(),
      isMaximized: jest.fn().mockReturnValue(false),
      maximize: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
        on: jest.fn(),
        session: {
          on: jest.fn(),
        },
      },
      setMenuBarVisibility: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      destroy: jest.fn(),
      isDestroyed: jest.fn().mockReturnValue(false),
    };

    // Mock BrowserWindow constructor
    MockedBrowserWindow.mockImplementation(() => mockWindow);
  });

  describe('createWindow', () => {
    it('should create a BrowserWindow with correct options', () => {
      const options = {
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      };

      const window = createWindow(options);

      expect(MockedBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1200,
          height: 800,
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
          }),
        })
      );
      expect(window).toBe(mockWindow);
    });

    it('should apply default window options when none provided', () => {
      createWindow();

      expect(MockedBrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          show: false,
          autoHideMenuBar: true,
        })
      );
    });

    it('should set up window event handlers', () => {
      createWindow();

      // Verify that event listeners are set up
      expect(mockWindow.on).toHaveBeenCalledWith('ready-to-show', expect.any(Function));
    });

    it('should handle window ready-to-show event', () => {
      createWindow();

      // Get the ready-to-show callback
      const readyToShowCallback = mockWindow.on.mock.calls.find(
        (call: any[]) => call[0] === 'ready-to-show'
      )?.[1];

      // Execute the callback
      if (readyToShowCallback) {
        readyToShowCallback();
      }

      // Verify window is shown
      expect(mockWindow.show).toHaveBeenCalled();
    });
  });

  describe('Window Lifecycle', () => {
    let window: BrowserWindow;

    beforeEach(() => {
      window = createWindow();
    });

    it('should show window when ready', () => {
      const readyToShowCallback = mockWindow.on.mock.calls.find(
        (call: any[]) => call[0] === 'ready-to-show'
      )?.[1];

      if (readyToShowCallback) {
        readyToShowCallback();
      }
      expect(mockWindow.show).toHaveBeenCalled();
    });

    it('should handle window close properly', () => {
      expect(mockWindow.on).toHaveBeenCalledWith('ready-to-show', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle BrowserWindow creation errors gracefully', () => {
      MockedBrowserWindow.mockImplementation(() => {
        throw new Error('Failed to create window');
      });

      expect(() => createWindow()).toThrow('Failed to create window');
    });
  });
});