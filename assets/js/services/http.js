/**
 * NetTools BR - HTTP Diagnostic & Connectivity Service
 */

/**
 * Test HTTP / HTTPS Connection to a URL
 * Uses Fetch API with cache busting options
 */
export async function testHttpConnectivity(targetUrl, options = {}) {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const timeoutMs = options.timeoutMs || 10000;
  const method = options.method || 'GET';
  const bypassCache = options.bypassCache !== false;

  let requestUrl = cleanUrl;
  if (bypassCache) {
    const urlObj = new URL(cleanUrl);
    urlObj.searchParams.set('_nettools_cb', Date.now());
    requestUrl = urlObj.toString();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();

  try {
    const response = await fetch(requestUrl, {
      method,
      mode: 'cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });

    const duration = Math.round(performance.now() - startTime);
    clearTimeout(timer);

    return {
      success: true,
      url: cleanUrl,
      finalUrl: response.url,
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText || getHttpStatusText(response.status),
      ok: response.ok,
      type: response.type,
      duration,
      isCorsBlocked: false,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    clearTimeout(timer);
    const duration = Math.round(performance.now() - startTime);

    if (err.name === 'AbortError') {
      return {
        success: false,
        url: cleanUrl,
        isTimeout: true,
        error: `Tempo limite esgotado (${timeoutMs}ms) ao conectar a ${cleanUrl}`,
        duration
      };
    }

    /*
      In modern browsers, a network failure or CORS block both trigger
      a TypeError ("Failed to fetch"). We distinguish network/offline vs CORS.
    */
    const isCorsPotential = err.name === 'TypeError' || err.message.includes('Failed to fetch');

    return {
      success: false,
      url: cleanUrl,
      isCorsPotential,
      error: isCorsPotential
        ? `Não foi possível completar a requisição Fetch. Isso pode ser causado por política de CORS restritiva no destino, bloqueio de certs HTTPS, ou indisponibilidade da porta HTTP.`
        : `Falha na requisição HTTP: ${err.message}`,
      duration
    };
  }
}

/**
 * Standard HTTP Status Text Mapping
 */
export function getHttpStatusText(status) {
  const map = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return map[status] || 'Unknown Status';
}
