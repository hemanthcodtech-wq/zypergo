/**
 * Utility to reliably resolve image URLs across local development and production.
 * Handles data URLs (instant previews), blob URLs, relative /uploads URLs, and absolute remote URLs.
 */
export function getImageUrl(url) {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  
  // Data URLs or local object blob URLs (for immediate preview before/during upload)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Already a full HTTP/HTTPS URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative path (like /uploads/file-123.png)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://zypergo.com';
  const cleanBase = backendUrl.replace(/\/+$/, '');
  const cleanPath = url.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}
