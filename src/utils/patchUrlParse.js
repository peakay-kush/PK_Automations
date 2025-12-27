export default function patchUrlParse() {
  // This patch is no longer needed in modern Node/Next.js environments
  // Removing the require('url') call that causes Vercel edge runtime errors
  return;
}
