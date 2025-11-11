// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude expo-sqlite from web builds to avoid WASM bundling issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    // Return a mock module for web
    return {
      type: 'empty',
    };
  }
  
  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
