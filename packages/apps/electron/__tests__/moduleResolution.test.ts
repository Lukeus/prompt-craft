import * as path from 'path';
import * as fs from 'fs';

describe('Electron Module Resolution', () => {
  const distElectronPath = path.join(__dirname, '../../../../dist/electron');
  const ipcHandlersPath = path.join(distElectronPath, 'packages/apps/electron/main/ipc/ipcHandlers.js');
  
  beforeAll(() => {
    // Ensure the build exists
    if (!fs.existsSync(distElectronPath)) {
      throw new Error('Electron distribution not found. Run "npm run electron:build" first.');
    }
  });

  describe('Built Files Exist', () => {
    test('ipcHandlers.js should exist in distribution', () => {
      expect(fs.existsSync(ipcHandlersPath)).toBe(true);
    });

    test('main index.js should exist in distribution', () => {
      const mainIndexPath = path.join(distElectronPath, 'packages/apps/electron/main/index.js');
      expect(fs.existsSync(mainIndexPath)).toBe(true);
    });

    test('preload.js should exist in distribution', () => {
      const preloadPath = path.join(distElectronPath, 'shared/preload.js');
      expect(fs.existsSync(preloadPath)).toBe(true);
    });
  });

  describe('Core Package Dependencies', () => {
    test('Container.js should exist at correct relative path', () => {
      const ipcDir = path.dirname(ipcHandlersPath);
      const containerPath = path.resolve(ipcDir, '../../../../core/infrastructure/Container.js');
      
      expect(fs.existsSync(containerPath)).toBe(true);
      
      // Verify it's a JavaScript file with exports
      const content = fs.readFileSync(containerPath, 'utf-8');
      expect(content).toContain('exports');
      expect(content).toContain('getContainer');
    });

    test('RepositoryFactory.js should exist at correct relative path', () => {
      const ipcDir = path.dirname(ipcHandlersPath);
      const factoryPath = path.resolve(ipcDir, '../../../../infrastructure/RepositoryFactory.js');
      
      expect(fs.existsSync(factoryPath)).toBe(true);
      
      // Verify it exports RepositoryFactory
      const content = fs.readFileSync(factoryPath, 'utf-8');
      expect(content).toContain('RepositoryFactory');
      expect(content).toContain('createSQLite');
    });

    test('SQLite database files should exist', () => {
      const ipcDir = path.dirname(ipcHandlersPath);
      const sqliteSeederPath = path.resolve(ipcDir, '../../../../infrastructure/database/sqliteSeeder.js');
      const sqliteConnectionPath = path.resolve(ipcDir, '../../../../infrastructure/database/sqliteConnection.js');
      
      expect(fs.existsSync(sqliteSeederPath)).toBe(true);
      expect(fs.existsSync(sqliteConnectionPath)).toBe(true);
    });
  });

  describe('Compiled JavaScript Validation', () => {
    test('ipcHandlers.js should use relative imports (not TypeScript path aliases)', () => {
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8');
      
      // Should contain relative paths
      expect(content).toContain('require("../../../../core/infrastructure/Container")');
      expect(content).toContain('require("../../../../infrastructure/RepositoryFactory")');
      
      // Should NOT contain TypeScript path aliases
      expect(content).not.toContain('require("@core/infrastructure/Container")');
      expect(content).not.toContain('require("@infrastructure/RepositoryFactory")');
    });

    test('main index.js should include tsconfig-paths registration', () => {
      const mainIndexPath = path.join(distElectronPath, 'packages/apps/electron/main/index.js');
      const content = fs.readFileSync(mainIndexPath, 'utf-8');
      
      expect(content).toContain('require("tsconfig-paths/register")');
    });
  });

  describe('Runtime Module Loading (Simulation)', () => {
    test('should be able to require Container from ipcHandlers location', () => {
      const ipcDir = path.dirname(ipcHandlersPath);
      const containerPath = path.resolve(ipcDir, '../../../../core/infrastructure/Container.js');
      
      // This simulates what Node.js would do at runtime
      expect(() => {
        delete require.cache[containerPath]; // Clear cache
        const Container = require(containerPath);
        expect(Container.getContainer).toBeDefined();
        expect(typeof Container.getContainer).toBe('function');
      }).not.toThrow();
    });

    test('should be able to require RepositoryFactory from ipcHandlers location', () => {
      const ipcDir = path.dirname(ipcHandlersPath);
      const factoryPath = path.resolve(ipcDir, '../../../../infrastructure/RepositoryFactory.js');
      
      expect(() => {
        delete require.cache[factoryPath]; // Clear cache
        const RepositoryFactory = require(factoryPath);
        expect(RepositoryFactory.RepositoryFactory).toBeDefined();
        expect(RepositoryFactory.RepositoryFactory.createSQLite).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Windows Path Compatibility', () => {
    test('relative paths should work on Windows-style paths', () => {
      // Simulate Windows path structure
      const windowsIpcPath = 'C:\\\\app\\\\dist\\\\electron\\\\packages\\\\apps\\\\electron\\\\main\\\\ipc\\\\ipcHandlers.js';
      const windowsIpcDir = path.dirname(windowsIpcPath.replace(/\\\\\\\\/g, path.sep));
      const relativeContainerPath = path.resolve(windowsIpcDir, '../../../../core/infrastructure/Container.js');
      
      // The relative resolution should work regardless of OS
      expect(relativeContainerPath).toContain('core');
      expect(relativeContainerPath).toContain('infrastructure');
      expect(relativeContainerPath).toContain('Container.js');
    });

    test('path separators should be normalized', () => {
      const testPath = '../../../../core/infrastructure/Container.js';
      const normalizedPath = path.normalize(testPath);
      
      // Should work on any OS
      expect(normalizedPath).toBeTruthy();
      expect(normalizedPath.split(path.sep)).toContain('core');
      expect(normalizedPath.split(path.sep)).toContain('infrastructure');
    });
  });
});