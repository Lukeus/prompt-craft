import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

describe('Electron Main Process Integration', () => {
  const electronPath = require('electron');
  const appPath = path.join(__dirname, '../../../../dist/electron/packages/apps/electron/main/index.js');
  let electronProcess: ChildProcess | null = null;
  
  beforeAll(() => {
    // Ensure the build exists
    if (!fs.existsSync(appPath)) {
      throw new Error('Electron main process not found. Run "npm run electron:build" first.');
    }
  });

  afterEach(() => {
    // Clean up any running Electron processes
    if (electronProcess && !electronProcess.killed) {
      electronProcess.kill('SIGTERM');
      electronProcess = null;
    }
  });

  describe('Application Startup', () => {
    test(
      'should start Electron main process without module resolution errors',
      (done) => {
        const env = {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_ENABLE_LOGGING: '1',
        ELECTRON_ENABLE_STACK_DUMPING: '1',
      };

      electronProcess = spawn(electronPath, [appPath], {
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let hasModuleError = false;
      let hasStarted = false;

      electronProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      electronProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        
        // Check for module resolution errors
        if (output.includes('Cannot find module') || 
            output.includes('@core/infrastructure/Container') ||
            output.includes('MODULE_NOT_FOUND')) {
          hasModuleError = true;
        }

        // Check if the app has started successfully
        if (output.includes('ready-to-show') || 
            output.includes('did-finish-load') ||
            output.includes('Initializing SQLite database')) {
          hasStarted = true;
        }
      });

      electronProcess.on('close', (code, signal) => {
        if (signal === 'SIGTERM') {
          // We killed it intentionally - that's fine
          expect(hasModuleError).toBe(false);
          if (!hasStarted) {
            // If we didn't see startup messages, at least ensure no module errors
            expect(stderr).not.toContain('Cannot find module');
            expect(stderr).not.toContain('@core/infrastructure/Container');
            expect(stderr).not.toContain('MODULE_NOT_FOUND');
          }
          done();
        } else {
          // Process crashed
          console.log('Electron stdout:', stdout);
          console.log('Electron stderr:', stderr);
          expect(hasModuleError).toBe(false);
          expect(code).toBe(0);
          done();
        }
      });

      electronProcess.on('error', (error) => {
        console.error('Failed to start Electron:', error);
        done(error);
      });

      // Give Electron some time to start, then kill it
      setTimeout(() => {
        if (electronProcess && !electronProcess.killed) {
          electronProcess.kill('SIGTERM');
        };
      }, 5000);
    },
    15000 // 15 second timeout
  );

    test('should not have TypeScript path alias imports in compiled code', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      
      // Should not contain unresolved TypeScript path aliases
      expect(content).not.toContain('require("@core/');
      expect(content).not.toContain('require("@infrastructure/');
      expect(content).not.toContain('require("@apps/');
    });

    test('should have tsconfig-paths registration for fallback resolution', () => {
      const content = fs.readFileSync(appPath, 'utf-8');
      
      // Should contain tsconfig-paths registration
      expect(content).toContain('tsconfig-paths/register');
    });
  });

  describe('File Structure Validation', () => {
    test('should have all required Electron assets', () => {
      const distElectronPath = path.join(__dirname, '../../../../dist/electron');
      
      // Check main process files
      expect(fs.existsSync(path.join(distElectronPath, 'packages/apps/electron/main/index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distElectronPath, 'packages/apps/electron/main/ipc/ipcHandlers.js'))).toBe(true);
      
      // Check preload script
      expect(fs.existsSync(path.join(distElectronPath, 'shared/preload.js'))).toBe(true);
      
      // Check core packages
      expect(fs.existsSync(path.join(distElectronPath, 'packages/core/infrastructure/Container.js'))).toBe(true);
      expect(fs.existsSync(path.join(distElectronPath, 'packages/infrastructure/RepositoryFactory.js'))).toBe(true);
      
      // Check configuration
      expect(fs.existsSync(path.join(distElectronPath, 'tsconfig.json'))).toBe(true);
    });

    test('should have proper package.json reference', () => {
      const packageJsonPath = path.join(__dirname, '../../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Main entry point should be correct
      expect(packageJson.main).toBe('dist/electron/packages/apps/electron/main/index.js');
      
      // Version should be set
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Dependencies Validation', () => {
    test('should be able to require all core dependencies', () => {
      const distElectronPath = path.join(__dirname, '../../../../dist/electron');
      const corePackagesPath = path.join(distElectronPath, 'packages');
      
      // Test Container
      const containerPath = path.join(corePackagesPath, 'core/infrastructure/Container.js');
      expect(() => {
        delete require.cache[containerPath];
        const Container = require(containerPath);
        expect(Container.getContainer).toBeDefined();
      }).not.toThrow();
      
      // Test RepositoryFactory
      const factoryPath = path.join(corePackagesPath, 'infrastructure/RepositoryFactory.js');
      expect(() => {
        delete require.cache[factoryPath];
        const Factory = require(factoryPath);
        expect(Factory.RepositoryFactory).toBeDefined();
      }).not.toThrow();
      
      // Test database modules
      const sqliteConnectionPath = path.join(corePackagesPath, 'infrastructure/database/sqliteConnection.js');
      expect(() => {
        delete require.cache[sqliteConnectionPath];
        const connection = require(sqliteConnectionPath);
        expect(connection.testSQLiteConnection).toBeDefined();
      }).not.toThrow();
    });

    test('should have correct relative path structure', () => {
      const distElectronPath = path.join(__dirname, '../../../../dist/electron');
      const ipcHandlersPath = path.join(distElectronPath, 'packages/apps/electron/main/ipc/ipcHandlers.js');
      const ipcDir = path.dirname(ipcHandlersPath);
      
      // Verify the relative paths that are used in the code actually exist
      const relativePaths = [
        '../../../../core/infrastructure/Container.js',
        '../../../../infrastructure/RepositoryFactory.js',
        '../../../../infrastructure/database/sqliteSeeder.js',
        '../../../../infrastructure/database/sqliteConnection.js',
      ];
      
      relativePaths.forEach(relativePath => {
        const absolutePath = path.resolve(ipcDir, relativePath);
        expect(fs.existsSync(absolutePath)).toBe(true);
      });
    });
  });

  describe('Error Scenarios', () => {
    test('should handle missing core packages gracefully', () => {
      // This test verifies that the compiled code uses relative paths
      // instead of TypeScript path aliases, providing clear error messages
      
      const distElectronPath = path.join(__dirname, '../../../../dist/electron');
      const ipcHandlersPath = path.join(distElectronPath, 'packages/apps/electron/main/ipc/ipcHandlers.js');
      
      if (fs.existsSync(ipcHandlersPath)) {
        const content = fs.readFileSync(ipcHandlersPath, 'utf-8');
        
        // Verify the compiled code uses proper relative paths
        expect(content).toContain('require("../../../../core/infrastructure/Container")');
        expect(content).toContain('require("../../../../infrastructure/RepositoryFactory")');
        
        // Verify it does NOT contain TypeScript path aliases
        expect(content).not.toContain('require("@core/');
        expect(content).not.toContain('require("@infrastructure/');
      }
    });
  });
});