// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable inline requires to defer module execution until needed (35% faster cold startup)
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    compress: {
      ...config.transformer?.minifierConfig?.compress,
      drop_console: process.env.NODE_ENV === 'production',
    },
  },
};

module.exports = config;
