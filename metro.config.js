// metro.config.js
// Fix: force react-native-svg to resolve from compiled lib/commonjs instead of src/
// (Metro prefers the "react-native" package.json field which points to src/index.ts;
//  src/ then tries to import '../lib/SvgTouchableMixin' which doesn't exist relative to src/)
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Override the react-native-svg entry to use the pre-compiled CommonJS bundle
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/react-native-svg/lib/commonjs/index.js'
      ),
      type: 'sourceFile',
    };
  }
  // Fall through to the default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
