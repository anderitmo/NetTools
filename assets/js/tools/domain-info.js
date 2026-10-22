/**
 * NetTools BR - Domain Info (RDAP) Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { queryRDAP, getExternalWhoisLink } from '../services/rdap.js';
import { HistoryManager } from '../history.js';

export const DomainInfoTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>🌐 Informações de Domínio (RDAP / WHOIS)</span>
        </h1>
        <p class="page-subtitle">
          Consulte o protocolo RDAP (Registration Data Access Protocol) para obter dados oficiais de registro, datas de expiração e servidores DNS de domínios.
        </p>
      </div>

      <div class="card">
        <form id="rdap-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="rdap-domain">Nome do Domínio</label>
              <input type="text" id="rdap-domain" placeholder="ex: registro.br ou google.com" required>
              <span class="form-hint">O RDAP é o padrão técnico moderno que substitui o WHOIS tradicional com dados em formato estruturado (JSON).</span>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="rdap-submit-btn" class="btn btn-primary">
              <span>Consultar RDAP</span>
            </button>
          </div>
        </form>
      </div>

      <div id="rdap-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">ℹ️ RDAP vs WHOIS & Privacidade de Dados</div>
        <div class="analysis-content">
          Diferente do WHOIS via porta 43 (que exige socket TCP inacessível em navegadores sem backend), o RDAP utiliza RESTful HTTP/HTTPS. Em conformidade com regulamentações de privacidade (como LGPD e GDPR), dados pessoais de contatos administrativos e proprietários são omitidos ou mascarados pelos registradores.
        </div>
      </div>
    `;

    const form = document.getElementById('rdap-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const domainInput = document.getElementById('rdap-domain');
    const submitBtn = document.getElementById('rdap-submit-btn');
    const resultsContainer = document.getElementById('rdap-results');

    const domain = Validators.cleanInput(domainInput.value);

    if (!Validators.isValidDomain(domain)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe um nome de domínio válido (ex: registro.br).', 'warning', 'Entrada Inválida');
      return;
    }

    UI.setLoading(submitBtn, true);
    resultsContainer.innerHTML = '';

    HistoryManager.add('domain-info', 'Informações de Domínio (RDAP)', domain);

    try {
      const res = await queryRDAP(domain);

      if (!res.success) {
        if (res.isCorsError) {
          resultsContainer.innerHTML = `
            <div class="card">
              ${UI.renderAlert(res.error, 'warning', 'Limitação de CORS no Navegador')}
              <div style="margin-top: 1rem;">
                <p>O servidor RDAP responsável por este TLD não possui cabeçalhos CORS liberados para chamadas diretas de navegadores de terceiros.</p>
                <p style="margin-top: 0.5rem;">Para consultar com segurança no serviço oficial autoritativo, acesse o link direto:</p>
                <a href="${UI.escapeHTML(res.fallbackWhoisUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top: 0.75rem; display: inline-flex;">
                  🔗 Abrir Consulta Externa no Servidor Autoritativo
                </a>
              </div>
            </div>
          `;
        } else if (res.notFound) {
          resultsContainer.innerHTML = `
            <div class="card">
              ${UI.renderAlert(res.error, 'info', 'Domínio Não Encontrado')}
            </div>
          `;
        } else {
          resultsContainer.innerHTML = `
            <div class="card">
              ${UI.renderAlert(res.error, 'error', 'Erro no Servidor RDAP')}
            </div>
          `;
        }
        return;
      }

      const creationStr = res.events.creation ? new Date(res.events.creation).toLocaleString('pt-BR') : 'Não informado';
      const updatedStr = res.events.updated ? new Date(res.events.updated).toLocaleString('pt-BR') : 'Não informado';
      const expirationStr = res.events.expiration ? new Date(res.events.expiration).toLocaleString('pt-BR') : 'Não informado';

      resultsContainer.innerHTML = `
        <div class="card">
          <div class="result-header">
            <div>
              <h3>Domínio: ${UI.escapeHTML(res.domainName)}</h3>
              <span class="result-meta">
                <span>Registrador: <strong>${UI.escapeHTML(res.registrar)}</strong></span> |
                <span>Tempo: <strong>${res.duration}ms</strong></span> |
                <span>Endpoint: <strong class="mono">${UI.escapeHTML(res.endpoint)}</strong></span>
              </span>
            </div>
            <button class="btn btn-secondary btn-sm copy-btn" data-text="${UI.escapeHTML(res.domainName)}">Copiar Nome</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.25rem;">
            <div class="card" style="background-color: var(--bg-input);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Data de Criação</span>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">${creationStr}</div>
            </div>

            <div class="card" style="background-color: var(--bg-input);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Última Atualização</span>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem;">${updatedStr}</div>
            </div>

            <div class="card" style="background-color: var(--bg-input);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Data de Expiração</span>
              <div style="font-size: 1rem; font-weight: 600; margin-top: 0.25rem; color: var(--accent);">${expirationStr}</div>
            </div>
          </div>

          <div style="margin-top: 1.5rem;">
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">📡 Servidores Autoritativos (Nameservers)</h4>
            ${res.nameservers.length > 0 ? `
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr><th>Hostname Servidor de Nomes</th></tr>
                  </thead>
                  <tbody>
                    ${res.nameservers.map(ns => `<tr><td class="mono"><strong>${UI.escapeHTML(ns)}</strong></td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="form-hint">Nenhum nameserver retornado na resposta.</div>'}
          </div>

          ${res.status && res.status.length > 0 ? `
            <div style="margin-top: 1.5rem;">
              <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--accent);">Status do Domínio (EPP)</h4>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${res.status.map(s => `<span class="status-badge info">${UI.escapeHTML(s)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${UI.renderAnalysis(
            'Resumo do Registro',
            `O domínio ${res.domainName} está ativo na zona do registrador "${res.registrar}". Recomenda-se monitorar a data de expiração (${expirationStr}) para evitar desativação involuntária de serviços DNS.`
          )}
        </div>
      `;

      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          UI.copyToClipboard(btn.getAttribute('data-text'), btn);
        });
      });

    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Erro inesperado ao consultar RDAP: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  }
};
