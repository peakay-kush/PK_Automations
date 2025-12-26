// Simple script to import cloudinary and trigger any URL parsing that could issue the DEP0169 warning
(async () => {
  try {
    const cloudinary = (await import('cloudinary')).v2;
    // try to call a function that would parse env URL if present
    const conf = cloudinary.config();
    console.log('cloudinary config loaded', typeof conf === 'object');
  } catch (e) {
    console.error('failed', e && e.message);
  }
})();