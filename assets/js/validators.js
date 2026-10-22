/**
 * NetTools BR - Validators & Utility Functions
 */

export const Validators = {
  isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    const clean = domain.trim().toLowerCase().replace(/\.$/, '');
    if (clean.length > 253) return false;
    // Hostname / domain regex pattern
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(clean);
  },

  isValidIPv4(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const clean = ip.trim();
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(clean);
  },

  isValidIPv6(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const clean = ip.trim();
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,3}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,2}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv6Regex.test(clean);
  },

  isValidIP(ip) {
    return this.isValidIPv4(ip) || this.isValidIPv6(ip);
  },

  isValidURL(urlStr) {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },

  cleanInput(str) {
    return (str || '').trim();
  }
};

/**
 * Convert IPv4 to PTR in-addr.arpa format
 * e.g. 8.8.4.4 -> 4.4.8.8.in-addr.arpa
 */
export function ipv4ToArpa(ip) {
  const parts = ip.trim().split('.');
  return parts.reverse().join('.') + '.in-addr.arpa';
}

/**
 * Convert IPv6 to PTR ip6.arpa format with full nibble expansion
 * e.g. 2001:4860:4860::8888 -> 8.8.8.8.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.6.8.4.0.6.8.4.1.0.0.2.ip6.arpa
 */
export function ipv6ToArpa(ip) {
  let clean = ip.trim().toLowerCase();

  // Expand :: shorthand
  if (clean.includes('::')) {
    const parts = clean.split('::');
    const head = parts[0] ? parts[0].split(':') : [];
    const tail = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - (head.length + tail.length);
    const middle = Array(missing).fill('0');
    const full = [...head, ...middle, ...tail];
    clean = full.join(':');
  }

  const blocks = clean.split(':').map(b => b.padStart(4, '0'));
  const fullHex = blocks.join('');
  const nibbles = fullHex.split('').reverse();
  return nibbles.join('.') + '.ip6.arpa';
}

/**
 * Format bytes to readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
