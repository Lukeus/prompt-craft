#!/usr/bin/env node

// Bootstrap script to setup path mapping for CLI
const path = require('path');
const tsConfigPaths = require('tsconfig-paths');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '../../..');

// Register path mapping manually to point to compiled output
tsConfigPaths.register({
  baseUrl: projectRoot,
  paths: {
    '@core/*': ['dist/packages/core/*'],
    '@infrastructure/*': ['dist/packages/infrastructure/*'],
    '@apps/*': ['dist/packages/apps/*']
  }
});

// Now require the compiled CLI
require('../../../dist/packages/apps/cli/index.js');
