#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Post-build script to fix module resolution for Electron
 * Creates proper directory structure and file links for runtime resolution
 */

const distElectronPath = path.join(__dirname, '../dist/electron');

console.log('Running Electron post-build script...');

try {
  // Copy tsconfig.json for runtime path resolution
  const electronTsconfigSrc = path.join(__dirname, '../packages/apps/electron/tsconfig.json');
  const electronTsconfigDest = path.join(distElectronPath, 'tsconfig.json');
  
  if (fs.existsSync(electronTsconfigSrc)) {
    console.log('Copying tsconfig.json for runtime path resolution...');
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(electronTsconfigDest))) {
      fs.mkdirSync(path.dirname(electronTsconfigDest), { recursive: true });
    }
    
    fs.copyFileSync(electronTsconfigSrc, electronTsconfigDest);
    console.log('Copied tsconfig.json to dist/electron/');
  }

  // Copy core and infrastructure packages to the correct location for Electron
  const distPackagesPath = path.join(__dirname, '../dist/packages');
  const electronPackagesPath = path.join(distElectronPath, 'packages');
  
  if (fs.existsSync(distPackagesPath)) {
    console.log('Copying core and infrastructure packages to Electron distribution...');
    
    // Recursively copy the entire packages directory
    const copyRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyRecursive(distPackagesPath, electronPackagesPath);
    console.log('Core and infrastructure packages copied successfully.');
  } else {
    console.warn('dist/packages directory not found. Make sure to run \'npm run build\' first.');
  }
  
  console.log('Electron post-build script completed successfully!');
  console.log('Module resolution configuration and packages added for Windows compatibility.');

} catch (error) {
  console.error('Error in Electron post-build script:', error);
  process.exit(1);
}
