/**
 * NetTools BR - DNS Lookup Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { queryDoH, RECORD_TYPES, DNS_PROVIDERS } from '../services/dns.js';
import { HistoryManager } from '../history.js';

export const DNSLookupTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>🔍 Consultas DNS Lookup</span>
        </h1>
        <p class="page-subtitle">
          Execute consultas DNS-over-HTTPS (DoH) oficiais em tempo real com opção de comparação de resolvedores públicos.
        </p>
      </div>

      <div class="card">
        <form id="dns-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="dns-domain">Domínio ou Hostname</label>
              <input type="text" id="dns-domain" placeholder="ex: example.com ou google.com" required>
              <span class="form-hint">Informe um nome de domínio válido (FQDN).</span>
            </div>

            <div class="form-group">
              <label for="dns-type">Tipo de Registro</label>
              <select id="dns-type">
                ${RECORD_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="dns-provider">Resolvedor Principal</label>
              <select id="dns-provider">
                <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                <option value="google">Google DNS (8.8.8.8)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer;">
              <input type="checkbox" id="compare-resolvers">
              <span>Comparar respostas de Cloudflare e Google simultaneamente</span>
            </label>

            <button type="submit" id="dns-submit-btn" class="btn btn-primary">
              <span>Consultar DNS</span>
            </button>
          </div>
        </form>
      </div>

      <div id="dns-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">⚠️ Nota Técnica sobre Resolução DNS</div>
        <div class="analysis-content">
          Uma consulta DNS isolada realizada via DoH reflete a resposta do resolvedor público consultado no momento exato. Devido à propagação DNS, tempos de TTL e políticas de cache regionais, o resultado retornado por um resolvedor pode temporariamente divergir de outros resolvedores ou do servidor autoritativo da zona.
        </div>
      </div>
    `;

    const form = document.getElementById('dns-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const domainInput = document.getElementById('dns-domain');
    const typeSelect = document.getElementById('dns-type');
    const providerSelect = document.getElementById('dns-provider');
    const compareCheck = document.getElementById('compare-resolvers');
    const submitBtn = document.getElementById('dns-submit-btn');
    const resultsContainer = document.getElementById('dns-results');

    const domain = Validators.cleanInput(domainInput.value);
    const type = typeSelect.value;
    const provider = providerSelect.value;
    const shouldCompare = compareCheck.checked;

    if (!Validators.isValidDomain(domain)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, insira um nome de domínio válido (ex: exemplo.com.br).', 'warning', 'Entrada Inválida');
      return;
    }

    UI.setLoading(submitBtn, true);
    resultsContainer.innerHTML = '';

    HistoryManager.add('dns-lookup', 'DNS Lookup', `${domain} [${type}]`);

    try {
      if (shouldCompare) {
        const [resCloudflare, resGoogle] = await Promise.all([
          queryDoH(domain, type, 'cloudflare'),
          queryDoH(domain, type, 'google')
        ]);

        resultsContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
            <div>${this.renderResultBox(resCloudflare, domain, type)}</div>
            <div>${this.renderResultBox(resGoogle, domain, type)}</div>
          </div>
        `;
      } else {
        const res = await queryDoH(domain, type, provider);
        resultsContainer.innerHTML = this.renderResultBox(res, domain, type);
      }
    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Ocorreu um erro inesperado ao processar a consulta: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
      this.attachCopyEvents();
    }
  },

  renderResultBox(res, domain, type) {
    if (!res.success) {
      return `
        <div class="card">
          <div class="result-header">
            <h3>Resolvedor: ${UI.escapeHTML(res.provider)}</h3>
            <span class="status-badge error">Falha HTTP/Conexão</span>
          </div>
          ${UI.renderAlert(res.error, 'error')}
          <p class="form-hint" style="margin-top: 0.5rem;">Tempo decorrido: ${res.duration} ms</p>
        </div>
      `;
    }

    const isNX = res.isNXDomain;
    const hasRecords = res.records && res.records.length > 0;
    const dateFormatted = new Date(res.timestamp).toLocaleString('pt-BR');

    let contentHTML = '';

    if (isNX) {
      contentHTML = UI.renderAlert(`O domínio "${UI.escapeHTML(domain)}" não existe ou não possui zona DNS cadastrada no resolvedor (NXDOMAIN - Code 3).`, 'warning', 'Domínio Inexistente (NXDOMAIN)');
    } else if (!hasRecords) {
      contentHTML = UI.renderAlert(`O domínio existe, porém não retornou nenhum registro do tipo "${UI.escapeHTML(type)}". Status: ${res.statusText}`, 'info', 'Sem Registros para o Tipo Solicitado');
    } else {
      const rows = res.records.map(r => `
        <tr>
          <td class="mono"><strong>${UI.escapeHTML(r.name)}</strong></td>
          <td><span class="status-badge info">${UI.formatRRType(r.type)}</span></td>
          <td class="mono">${r.TTL}s</td>
          <td class="mono" style="word-break: break-all;">${UI.escapeHTML(r.data)}</td>
        </tr>
      `).join('');

      contentHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>TTL</th>
                <th>Dados Retornados (RDATA)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }

    const rawJSON = JSON.stringify(res, null, 2);

    return `
      <div class="card">
        <div class="result-header">
          <div>
            <h3>Resolvedor: ${UI.escapeHTML(res.provider)}</h3>
            <span class="result-meta">
              <span>Status: <strong>${UI.escapeHTML(res.statusText)}</strong></span> |
              <span>Tempo: <strong>${res.duration}ms</strong></span> |
              <span>Data: <strong>${dateFormatted}</strong></span>
            </span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${hasRecords ? `<button class="btn btn-secondary btn-sm copy-btn" data-text="${UI.escapeHTML(res.records.map(r => r.data).join('\n'))}">Copiar Registros</button>` : ''}
          </div>
        </div>

        <div style="margin-top: 1rem;">
          ${contentHTML}
        </div>

        ${UI.renderAnalysis('Interpretação do Resultado', this.getInterpretationText(res, domain, type))}
      </div>
    `;
  },

  getInterpretationText(res, domain, type) {
    if (res.isNXDomain) {
      return `A resposta NXDOMAIN confirma que o nome ${domain} não está registrado ou não possui servidor DNS autoritativo apontado.`;
    }
    if (!res.records || res.records.length === 0) {
      return `A consulta foi bem-sucedida (NOERROR), mas não há entrada publicada para o tipo ${type} no host informado.`;
    }
    if (type === 'A' || type === 'AAAA') {
      return `Os endereços IP retornados indicam os servidores finais ou proxies de borda (ex: CDN) configurados para o host ${domain}.`;
    }
    if (type === 'MX') {
      return `Os servidores MX retornados são responsáveis pelo recebimento de mensagens de e-mail enviadas ao domínio ${domain}.`;
    }
    return `Consulta DNS finalizada com sucesso. Foram retornados ${res.records.length} registro(s) do tipo ${type}.`;
  },

  attachCopyEvents() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        UI.copyToClipboard(text, btn);
      });
    });
  }
};
