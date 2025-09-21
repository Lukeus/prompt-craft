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
  // The Electron app now uses the existing core packages structure
  // No special copying needed - everything is handled by TypeScript compilation
  
  console.log('Electron post-build script completed successfully!');
  console.log('Using existing core packages structure - no additional copying needed.');

} catch (error) {
  console.error('Error in Electron post-build script:', error);
  process.exit(1);
}
