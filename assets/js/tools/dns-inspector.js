/**
 * NetTools BR - DNS Inspector Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { queryDoH } from '../services/dns.js';
import { HistoryManager } from '../history.js';

export const DNSInspectorTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>📋 Inspeção Completa de Registros DNS</span>
        </h1>
        <p class="page-subtitle">
          Execute uma varredura consolidada das principais entradas públicas DNS (A, AAAA, MX, NS, TXT, SOA, CAA, DS) de um domínio.
        </p>
      </div>

      <div class="card">
        <form id="inspector-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="inspector-domain">Domínio do Alvo</label>
              <input type="text" id="inspector-domain" placeholder="ex: github.com ou gov.br" required>
              <span class="form-hint">Informe um nome de domínio público para inspecionar todos os seus registros ativos.</span>
            </div>

            <div class="form-group">
              <label for="inspector-provider">Resolvedor Público</label>
              <select id="inspector-provider">
                <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                <option value="google">Google DNS (8.8.8.8)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="inspector-submit-btn" class="btn btn-primary">
              <span>Iniciar Inspeção DNS</span>
            </button>
          </div>
        </form>
      </div>

      <div id="inspector-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">🛡️ Escopo e Limitações de Segurança</div>
        <div class="analysis-content">
          Esta ferramenta consulta exclusivamente os registros DNS públicos declarados. <strong>Não é executada transferência de zona (AXFR) nem enumeração exaustiva de subdomínios (brute force).</strong> O resultado não garante a visibilidade de subdomínios privados ou zonas DNS internas não expostas publicamente.
        </div>
      </div>
    `;

    const form = document.getElementById('inspector-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const domainInput = document.getElementById('inspector-domain');
    const providerSelect = document.getElementById('inspector-provider');
    const submitBtn = document.getElementById('inspector-submit-btn');
    const resultsContainer = document.getElementById('inspector-results');

    const domain = Validators.cleanInput(domainInput.value);
    const provider = providerSelect.value;

    if (!Validators.isValidDomain(domain)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe um nome de domínio válido (ex: exemplo.com.br).', 'warning', 'Domínio Inválido');
      return;
    }

    UI.setLoading(submitBtn, true, 'Inspecionando Registros...');
    resultsContainer.innerHTML = '';

    HistoryManager.add('dns-inspector', 'Inspeção DNS', domain);

    const typesToInspect = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'DS'];
    const dmarcDomain = `_dmarc.${domain}`;

    try {
      const queries = typesToInspect.map(t => queryDoH(domain, t, provider));
      queries.push(queryDoH(dmarcDomain, 'TXT', provider)); // Query DMARC

      const resultsList = await Promise.all(queries);

      const map = {};
      typesToInspect.forEach((t, i) => {
        map[t] = resultsList[i];
      });
      const dmarcResult = resultsList[typesToInspect.length];

      this.renderReport(resultsContainer, domain, provider, map, dmarcResult);

    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Erro ao inspecionar o domínio: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  },

  renderReport(container, domain, provider, map, dmarcResult) {
    // Filter TXT records to extract SPF
    const txtRecords = map['TXT']?.records || [];
    const spfRecords = txtRecords.filter(r => r.data.includes('v=spf1'));

    // Extract DMARC
    const dmarcRecords = dmarcResult?.records || [];

    // Count total records found
    let totalCount = 0;
    Object.values(map).forEach(res => {
      if (res.records) totalCount += res.records.length;
    });
    if (dmarcRecords.length) totalCount += dmarcRecords.length;

    container.innerHTML = `
      <div class="card">
        <div class="result-header">
          <div>
            <h3>Relatório de Inspeção DNS: ${UI.escapeHTML(domain)}</h3>
            <span class="result-meta">
              <span>Total de Registros Encontrados: <strong>${totalCount}</strong></span> |
              <span>Resolvedor: <strong>${UI.escapeHTML(provider)}</strong></span> |
              <span>Data/Hora: <strong>${new Date().toLocaleString('pt-BR')}</strong></span>
            </span>
          </div>
          <button class="btn btn-secondary btn-sm" id="export-json-btn">Exportar JSON</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
          <!-- IPs (A & AAAA) -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">🌐 Endereços IP (A / AAAA)</h4>
            ${this.renderTableForType(domain, [...(map['A']?.records || []), ...(map['AAAA']?.records || [])])}
          </div>

          <!-- Servidores de E-mail (MX) -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">✉️ Servidores de E-mail (MX)</h4>
            ${this.renderTableForType(domain, map['MX']?.records || [])}
          </div>

          <!-- Servidores de Nomes (NS) -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">📡 Servidores Autoritativos (NS)</h4>
            ${this.renderTableForType(domain, map['NS']?.records || [])}
          </div>

          <!-- SPF & DMARC Security Highlights -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">🛡️ Políticas de Segurança E-mail (SPF & DMARC)</h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div>
                <strong>SPF (Sender Policy Framework):</strong>
                ${spfRecords.length > 0
                  ? `<div class="code-block" style="margin-top:0.25rem;">${UI.escapeHTML(spfRecords[0].data)}</div>`
                  : UI.renderAlert('Nenhum registro SPF (v=spf1) encontrado nas entradas TXT do domínio.', 'warning')}
              </div>
              <div>
                <strong>DMARC (_dmarc.${UI.escapeHTML(domain)}):</strong>
                ${dmarcRecords.length > 0
                  ? `<div class="code-block" style="margin-top:0.25rem;">${UI.escapeHTML(dmarcRecords[0].data)}</div>`
                  : UI.renderAlert(`Nenhum registro DMARC encontrado no host _dmarc.${UI.escapeHTML(domain)}.`, 'warning')}
              </div>
            </div>
          </div>

          <!-- Outros TXT e CAA -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">🔒 Registros CAA & Textos TXT</h4>
            ${this.renderTableForType(domain, [...(map['CAA']?.records || []), ...(map['TXT']?.records || [])])}
          </div>

          <!-- SOA & DNSSEC (DS) -->
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">🔑 Autoridade SOA & DNSSEC (DS)</h4>
            ${this.renderTableForType(domain, [...(map['SOA']?.records || []), ...(map['DS']?.records || [])])}
          </div>
        </div>
      </div>
    `;

    document.getElementById('export-json-btn')?.addEventListener('click', () => {
      const exportData = { domain, provider, map, dmarcResult, timestamp: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dns-inspect-${domain}.json`;
      a.click();
    });
  },

  renderTableForType(domain, records) {
    if (!records || records.length === 0) {
      return '<div class="form-hint">Nenhum registro encontrado para este grupo.</div>';
    }

    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>TTL</th>
              <th>Dados do Registro (RDATA)</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r => `
              <tr>
                <td class="mono"><strong>${UI.escapeHTML(r.name)}</strong></td>
                <td><span class="status-badge info">${UI.formatRRType(r.type)}</span></td>
                <td class="mono">${r.TTL}s</td>
                <td class="mono" style="word-break: break-all;">${UI.escapeHTML(r.data)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};
