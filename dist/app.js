// CommonJS wrapper for iisnode compatibility
import('../server/index.js')
  .then(() => {
    console.log('[IISNODE] Control Room server loaded successfully via dynamic import.');
  })
  .catch((err) => {
    console.error('[IISNODE ERROR] Failed to load server:', err);
  });
