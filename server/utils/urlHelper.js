/**
 * URL Helper for dynamic frontend and subdomain routing
 */

function getFrontendUrl(subdomain = '') {
  // If a specific subdomain env var is defined (e.g. RIDER_FRONTEND_URL, HUB_FRONTEND_URL)
  if (subdomain) {
    const specificEnv = process.env[`${subdomain.toUpperCase()}_FRONTEND_URL`];
    if (specificEnv) return specificEnv.replace(/\/+$/, '');
  }

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  
  if (!subdomain) return baseUrl;

  try {
    const parsed = new URL(baseUrl);
    const host = parsed.hostname;
    const protocol = parsed.protocol;
    const port = parsed.port ? `:${parsed.port}` : '';

    // If running on localhost / 127.0.0.1
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${subdomain}.localhost${port}`;
    }

    // If host already starts with subdomain
    if (host.startsWith(`${subdomain}.`)) {
      return `${protocol}//${host}${port}`;
    }

    // For standard domains like zypergo.com or app.zypergo.com
    return `${protocol}//${subdomain}.${host}${port}`;
  } catch (e) {
    return baseUrl;
  }
}

module.exports = {
  getFrontendUrl
};
