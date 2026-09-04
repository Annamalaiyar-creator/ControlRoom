// CommonJS wrapper for iisnode compatibility
const path = require('path');
const distModules = path.resolve(__dirname, 'node_modules');
if (process.env.NODE_PATH) {
  process.env.NODE_PATH = distModules + path.delimiter + process.env.NODE_PATH;
} else {
  process.env.NODE_PATH = distModules;
}
require('module').Module._initPaths();

import('../server/index.js')
  .then(() => {
    console.log('[IISNODE] Control Room server loaded successfully via dynamic import.');
  })
  .catch((err) => {
    console.error('[IISNODE ERROR] Failed to load server:', err);
  });
