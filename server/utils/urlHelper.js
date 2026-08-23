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

    // Check if host is an IP address or localhost
    const isIpOrLocal = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.test(host);
    if (isIpOrLocal) {
      // In IP/Local mode, subdomains don't resolve via DNS, use query or path
      return `${baseUrl}/?portal=${subdomain}`;
    }

    // If host already starts with subdomain
    if (host.startsWith(`${subdomain}.`)) {
      return `${protocol}//${host}${port}`;
    }

    // For standard domains like zypergo.com or custom domain
    return `${protocol}//${subdomain}.${host}${port}`;
  } catch (e) {
    return baseUrl;
  }
}

module.exports = {
  getFrontendUrl
};
