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
  
  console.log('Electron post-build script completed successfully!');
  console.log('Module resolution configuration added for Windows compatibility.');

} catch (error) {
  console.error('Error in Electron post-build script:', error);
  process.exit(1);
}
