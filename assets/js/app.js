/**
 * NetTools BR - Main Entry Point
 */

import { Router } from './router.js';
import { HomeTool } from './tools/home.js';
import { DNSLookupTool } from './tools/dns-lookup.js';
import { ReverseDNSTool } from './tools/reverse-dns.js';
import { DNSInspectorTool } from './tools/dns-inspector.js';
import { DomainInfoTool } from './tools/domain-info.js';
import { ConnectivityTool } from './tools/connectivity.js';
import { EmailValidatorTool } from './tools/email-validator.js';
import { PingTool } from './tools/ping-tool.js';
import { TracerouteTool } from './tools/traceroute-tool.js';

// Global Tool Registry for Search and Navigation
export const TOOLS_REGISTRY = [
  { id: 'home', title: 'Painel Inicial', desc: 'Visão geral de ferramentas e histórico' },
  { id: 'dns-lookup', title: 'DNS Lookup', desc: 'Consultas DNS-over-HTTPS (A, AAAA, MX, NS, TXT, CAA, SOA, DS, etc)' },
  { id: 'reverse-dns', title: 'DNS Reverso', desc: 'Resolução PTR para IPv4 e IPv6' },
  { id: 'dns-inspector', title: 'Inspeção de Registros DNS', desc: 'Visão geral consolidada dos registros públicos' },
  { id: 'domain-info', title: 'Informações de Domínio (RDAP)', desc: 'Consulta de registro RDAP / WHOIS para domínios' },
  { id: 'connectivity', title: 'Conectividade HTTP/HTTPS', desc: 'Testes de acessibilidade web, tempo de resposta e status' },
  { id: 'email-validator', title: 'Validação E-mail e Segurança', desc: 'Verificação de registros MX, SPF, DMARC, DKIM e CAA' },
  { id: 'ping-tool', title: 'Teste de Latência (Ping HTTP)', desc: 'Medição iterativa de latência HTTP/HTTPS' },
  { id: 'traceroute-tool', title: 'Traceroute / Tracert', desc: 'Instruções e diagnóstico de rota' }
];

document.addEventListener('DOMContentLoaded', () => {
  // Theme Management
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const savedTheme = localStorage.getItem('nettools_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nettools_theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Header Tool Search
  const searchInput = document.getElementById('tool-search');
  const searchResults = document.getElementById('search-results');

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        searchResults.style.display = 'none';
        return;
      }

      const matches = TOOLS_REGISTRY.filter(t =>
        t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        searchResults.innerHTML = '<div style="padding:0.75rem; color:var(--text-muted); font-size:0.85rem;">Nenhuma ferramenta encontrada</div>';
      } else {
        searchResults.innerHTML = matches.map(t => `
          <a href="#${t.id}" class="search-result-item">
            <span class="search-result-title">${t.title}</span>
            <span class="search-result-desc">${t.desc}</span>
          </a>
        `).join('');
      }
      searchResults.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
      }
    });

    searchResults.addEventListener('click', () => {
      searchResults.style.display = 'none';
      searchInput.value = '';
    });
  }

  // Placeholder routes until tools are implemented in Phase 2-5
  const createPlaceholder = (title, desc) => ({
    render(container) {
      container.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${desc}</p>
        </div>
        <div class="alert alert-info">
          <span>Esta ferramenta está sendo carregada ou será ativada no próximo passo.</span>
        </div>
      `;
    }
  });

  // Setup Router
  const routes = {
    'home': HomeTool,
    'dns-lookup': DNSLookupTool,
    'reverse-dns': ReverseDNSTool,
    'dns-inspector': DNSInspectorTool,
    'domain-info': DomainInfoTool,
    'connectivity': ConnectivityTool,
    'email-validator': EmailValidatorTool,
    'ping-tool': PingTool,
    'traceroute-tool': TracerouteTool
  };

  window.router = new Router(routes, 'home');
  window.router.init();
});
