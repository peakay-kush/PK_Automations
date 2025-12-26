export function buildCloudinaryUrlFromFullUrl(fullUrl, { width, quality = '100', format = null, fill = false, fit = false, gravity = 'auto' } = {}) {
  // expects a Cloudinary secure_url like https://res.cloudinary.com/<cloud>/image/upload/v123/.../public_id.ext
  if (!fullUrl || !fullUrl.includes('/upload/')) return fullUrl;
  const parts = fullUrl.split('/upload/');
  const prefix = parts[0] + '/upload/';
  const rest = parts[1];

  const params = [];
  if (fill) params.push(`c_fill,g_${gravity}`);
  else if (fit) params.push(`c_fit`);
  if (quality) params.push(`q_${quality}`);
  if (width) params.push(`w_${width}`);
  if (format) params.push(`f_${format}`);

  const trans = params.length ? params.join(',') + '/' : '';
  return `${prefix}${trans}${rest}`;
}

export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}