/**
 * NetTools BR - DNS-over-HTTPS (DoH) Service
 */

export const DNS_PROVIDERS = {
  cloudflare: {
    name: 'Cloudflare DNS',
    endpoint: 'https://cloudflare-dns.com/dns-query'
  },
  google: {
    name: 'Google Public DNS',
    endpoint: 'https://dns.google/resolve'
  }
};

export const RECORD_TYPES = [
  'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'SRV', 'PTR', 'DS', 'DNSKEY'
];

/**
 * Perform DoH Query
 * @param {string} name Domain or PTR arpa address
 * @param {string} type Record type (A, MX, etc.)
 * @param {string} providerKey 'cloudflare' | 'google'
 * @param {object} options { timeoutMs: 8000 }
 */
export async function queryDoH(name, type = 'A', providerKey = 'cloudflare', options = {}) {
  const provider = DNS_PROVIDERS[providerKey] || DNS_PROVIDERS.cloudflare;
  const timeoutMs = options.timeoutMs || 8000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();

  try {
    let url;
    const headers = { 'Accept': 'application/dns-json' };

    if (providerKey === 'google') {
      url = `${provider.endpoint}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    } else {
      // Cloudflare support application/dns-json
      url = `${provider.endpoint}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    const duration = Math.round(performance.now() - startTime);
    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        error: `Erro HTTP ${response.status} na resposta do provedor ${provider.name}`,
        duration,
        provider: provider.name
      };
    }

    const data = await response.json();

    /*
      DNS RCODE Status Code Meanings:
      0 = NOERROR (Success)
      2 = SERVFAIL (Server Failure)
      3 = NXDOMAIN (Non-Existent Domain)
      5 = REFUSED (Query Refused)
    */
    const statusMap = {
      0: 'NOERROR',
      2: 'SERVFAIL',
      3: 'NXDOMAIN',
      5: 'REFUSED'
    };

    const rcodeStatus = statusMap[data.Status] || `RCODE ${data.Status}`;

    return {
      success: true,
      status: data.Status,
      statusText: rcodeStatus,
      isNXDomain: data.Status === 3,
      isServFail: data.Status === 2,
      records: data.Answer || [],
      authority: data.Authority || [],
      additional: data.Additional || [],
      tc: data.TC, // Truncated
      rd: data.RD, // Recursion Desired
      ra: data.RA, // Recursion Available
      ad: data.AD, // Authentic Data (DNSSEC verified)
      cd: data.CD, // Checking Disabled
      duration,
      provider: provider.name,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    clearTimeout(timer);
    const duration = Math.round(performance.now() - startTime);

    if (err.name === 'AbortError') {
      return {
        success: false,
        error: `Tempo limite esgotado (${timeoutMs}ms) ao consultar ${provider.name}`,
        duration,
        provider: provider.name
      };
    }

    return {
      success: false,
      error: `Falha na conexão de rede ou bloqueio de CORS ao acessar ${provider.name}: ${err.message}`,
      duration,
      provider: provider.name
    };
  }
}
