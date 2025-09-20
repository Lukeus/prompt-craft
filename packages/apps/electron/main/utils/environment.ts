export const isDev = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const getAppDataPath = (): string => {
  const { app } = require('electron');
  return app.getPath('appData');
};

export const getUserDataPath = (): string => {
  const { app } = require('electron');
  return app.getPath('userData');
};