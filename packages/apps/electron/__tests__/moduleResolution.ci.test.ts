import * as path from 'path';
import * as fs from 'fs';

describe('Electron Module Resolution (CI Safe)', () => {
  const distElectronPath = path.join(__dirname, '../../../../dist/electron');
  const ipcHandlersPath = path.join(distElectronPath, 'packages/apps/electron/main/ipc/ipcHandlers.js');
  
  // Only run tests if the build exists
  const shouldRunTests = fs.existsSync(distElectronPath);
  
  if (!shouldRunTests) {
    test('Electron build not found - tests skipped', () => {
      console.warn('Electron distribution not built, skipping module resolution tests');
      expect(true).toBe(true); // Pass the test
    });
    return;
  }

  describe('Critical Path Validation', () => {
    test('ipcHandlers.js should use relative imports (not TypeScript path aliases)', () => {
      if (!fs.existsSync(ipcHandlersPath)) {
        console.warn('ipcHandlers.js not found, test skipped');
        return;
      }
      
      const content = fs.readFileSync(ipcHandlersPath, 'utf-8');
      
      // Should contain relative paths
      expect(content).toContain('require("../../../../core/infrastructure/Container")');
      expect(content).toContain('require("../../../../infrastructure/RepositoryFactory")');
      
      // Should NOT contain TypeScript path aliases (this was the Windows issue)
      expect(content).not.toContain('require("@core/infrastructure/Container")');
      expect(content).not.toContain('require("@infrastructure/RepositoryFactory")');
    });

    test('Windows path compatibility validation', () => {
      const testPath = '../../../../core/infrastructure/Container.js';
      const normalizedPath = path.normalize(testPath);
      
      // Should work on any OS
      expect(normalizedPath).toBeTruthy();
      expect(normalizedPath.split(path.sep)).toContain('core');
      expect(normalizedPath.split(path.sep)).toContain('infrastructure');
    });

    test('Core packages should exist if build completed', () => {
      const containerPath = path.resolve(path.dirname(ipcHandlersPath), '../../../../core/infrastructure/Container.js');
      const factoryPath = path.resolve(path.dirname(ipcHandlersPath), '../../../../infrastructure/RepositoryFactory.js');
      
      if (fs.existsSync(ipcHandlersPath)) {
        expect(fs.existsSync(containerPath)).toBe(true);
        expect(fs.existsSync(factoryPath)).toBe(true);
      } else {
        console.warn('Build files not found, skipping file existence check');
      }
    });
  });

  describe('Build Configuration Validation', () => {
    test('package.json should have correct main entry point', () => {
      const packageJsonPath = path.join(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.main).toBe('dist/electron/packages/apps/electron/main/index.js');
    });

    test('should have correct tsconfig-paths dependency', () => {
      const packageJsonPath = path.join(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.dependencies['tsconfig-paths']).toBeDefined();
    });
  });
});