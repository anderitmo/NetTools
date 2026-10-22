/**
 * NetTools BR - RDAP (Registration Data Access Protocol) Service
 */

// Official RDAP Bootstrap / Public Server Endpoints
const RDAP_SERVERS = {
  br: 'https://rdap.registro.br/domain/',
  org: 'https://rdap.publicinterestregistry.net/rdap/org/domain/',
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  io: 'https://rdap.identitydigital.services/rdap/domain/',
  dev: 'https://rdap.nic.google/domain/',
  app: 'https://rdap.nic.google/domain/',
  page: 'https://rdap.nic.google/domain/',
  fallback: 'https://rdap.org/domain/'
};

/**
 * Determine best RDAP endpoint or fallback
 */
export function getRDAPEndpoint(domain) {
  const parts = domain.toLowerCase().trim().split('.');
  const tld = parts[parts.length - 1];

  if (tld === 'br') return RDAP_SERVERS.br;
  if (RDAP_SERVERS[tld]) return RDAP_SERVERS[tld];
  return RDAP_SERVERS.fallback;
}

/**
 * Perform RDAP Domain Query
 */
export async function queryRDAP(domain) {
  const cleanDomain = domain.toLowerCase().trim();
  const endpoint = getRDAPEndpoint(cleanDomain);
  const targetUrl = `${endpoint}${encodeURIComponent(cleanDomain)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  const startTime = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/rdap+json, application/json'
      },
      signal: controller.signal
    });

    const duration = Math.round(performance.now() - startTime);
    clearTimeout(timer);

    if (response.status === 404) {
      return {
        success: false,
        notFound: true,
        error: `O domínio "${cleanDomain}" não foi encontrado na base RDAP do TLD correspondente (disponível para registro ou inexistente).`,
        duration,
        endpoint
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `O servidor RDAP respondeu com o código HTTP ${response.status}.`,
        duration,
        endpoint
      };
    }

    const data = await response.json();

    // Parse RDAP fields safely
    const registrar = extractRegistrar(data);
    const events = extractEvents(data);
    const nameservers = extractNameservers(data);
    const status = data.status || [];
    const dnssec = data.secureDNS || null;

    return {
      success: true,
      domainName: data.ldhName || cleanDomain,
      handle: data.handle || '',
      registrar,
      events,
      nameservers,
      status,
      dnssec,
      raw: data,
      duration,
      endpoint,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    clearTimeout(timer);
    const duration = Math.round(performance.now() - startTime);

    const isCors = err.name === 'TypeError' || err.message.includes('Failed to fetch');

    return {
      success: false,
      isCorsError: isCors,
      error: isCors
        ? `A consulta RDAP direta no navegador para o TLD de "${cleanDomain}" foi bloqueada por restrição de CORS pelo servidor RDAP de origem.`
        : `Erro na requisição RDAP: ${err.message}`,
      duration,
      endpoint,
      fallbackWhoisUrl: getExternalWhoisLink(cleanDomain)
    };
  }
}

function extractRegistrar(data) {
  if (!data.entities) return 'Não informado';
  const registrarEntity = data.entities.find(e => e.roles && e.roles.includes('registrar'));
  if (!registrarEntity) return 'Não informado';

  if (registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
    const fnArray = registrarEntity.vcardArray[1].find(item => item[0] === 'fn');
    if (fnArray) return fnArray[3];
  }
  return registrarEntity.handle || 'Não informado';
}

function extractEvents(data) {
  const events = { creation: null, updated: null, expiration: null };
  if (!data.events) return events;

  data.events.forEach(e => {
    if (e.eventAction === 'registration') events.creation = e.eventDate;
    if (e.eventAction === 'last changed' || e.eventAction === 'last update') events.updated = e.eventDate;
    if (e.eventAction === 'expiration') events.expiration = e.eventDate;
  });

  return events;
}

function extractNameservers(data) {
  if (!data.nameservers) return [];
  return data.nameservers.map(ns => ns.ldhName || ns.handle).filter(Boolean);
}

export function getExternalWhoisLink(domain) {
  const clean = domain.toLowerCase().trim();
  if (clean.endsWith('.br')) {
    return `https://registro.br/tecnologia/ferramentas/whois/?search=${encodeURIComponent(clean)}`;
  }
  return `https://www.whois.com/whois/${encodeURIComponent(clean)}`;
}
