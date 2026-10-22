/**
 * NetTools BR - HTTP Diagnostics & Connectivity Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { testHttpConnectivity } from '../services/http.js';
import { HistoryManager } from '../history.js';

export const ConnectivityTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>📡 Diagnóstico de Conectividade HTTP / HTTPS</span>
        </h1>
        <p class="page-subtitle">
          Teste a disponibilidade de endpoints web, analise o tempo de resposta do servidor e identifique políticas de redirecionamento ou bloqueios de CORS.
        </p>
      </div>

      <div class="card">
        <form id="connectivity-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 3;">
              <label for="conn-url">URL / Hostname do Serviço Web</label>
              <input type="text" id="conn-url" placeholder="ex: https://github.com ou http://exemplo.com.br" required>
              <span class="form-hint">Se o protocolo não for informado, https:// será adicionado automaticamente.</span>
            </div>

            <div class="form-group" style="flex: 1;">
              <label for="conn-method">Método HTTP</label>
              <select id="conn-method">
                <option value="GET">GET</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="conn-submit-btn" class="btn btn-primary">
              <span>Testar Conectividade</span>
            </button>
          </div>
        </form>
      </div>

      <div id="conn-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">⚠️ Esclarecimentos Técnicos Importantes</div>
        <div class="analysis-content">
          <ul style="padding-left: 1.25rem; margin-top: 0.25rem; display: flex; flex-direction: column; gap: 0.25rem;">
            <li><strong>CORS vs Disponibilidade:</strong> Erro de CORS ("Failed to fetch") significa que o servidor respondeu ou recusou a origem web, mas NÃO prova que o servidor está offline.</li>
            <li><strong>Acesso a Cabeçalhos:</strong> Por questões de segurança, o navegador omite cabeçalhos HTTP que não possuem permissão explícita no campo <code>Access-Control-Expose-Headers</code> do servidor.</li>
            <li><strong>Tempo da Requisição:</strong> O tempo medido inclui o aperto de mão TCP/TLS, transferência e overhead do navegador — não deve ser confundido com o ping ICMP da camada de rede.</li>
          </ul>
        </div>
      </div>
    `;

    const form = document.getElementById('connectivity-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const urlInput = document.getElementById('conn-url');
    const methodSelect = document.getElementById('conn-method');
    const submitBtn = document.getElementById('conn-submit-btn');
    const resultsContainer = document.getElementById('conn-results');

    let rawUrl = Validators.cleanInput(urlInput.value);
    const method = methodSelect.value;

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = `https://${rawUrl}`;
    }

    if (!Validators.isValidURL(rawUrl)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe uma URL ou hostname válido.', 'warning', 'URL Inválida');
      return;
    }

    UI.setLoading(submitBtn, true);
    resultsContainer.innerHTML = '';

    HistoryManager.add('connectivity', 'Conectividade HTTP', rawUrl);

    try {
      const res = await testHttpConnectivity(rawUrl, { method });

      const dateFormatted = new Date().toLocaleString('pt-BR');

      if (!res.success) {
        resultsContainer.innerHTML = `
          <div class="card">
            <div class="result-header">
              <h3>URL: ${UI.escapeHTML(res.url)}</h3>
              <span class="status-badge error">Falha na Requisição</span>
            </div>

            <div style="margin-top: 1rem;">
              ${UI.renderAlert(res.error, 'warning', 'Atenção: Falha de Conexão / CORS')}
            </div>

            ${UI.renderAnalysis(
              'Interpretação do Diagnóstico',
              `A requisição HTTP para ${res.url} não pôde ser completada via Fetch API no navegador (tempo: ${res.duration}ms). Se o servidor estiver ativo, isso geralmente ocorre devido a restrições de Cross-Origin Resource Sharing (CORS) ou políticas de certificado TLS.`
            )}
          </div>
        `;
        return;
      }

      const statusBadgeClass = res.ok ? 'success' : (res.status >= 400 ? 'error' : 'warning');

      resultsContainer.innerHTML = `
        <div class="card">
          <div class="result-header">
            <div>
              <h3>URL Consultado: ${UI.escapeHTML(res.url)}</h3>
              <span class="result-meta">
                <span>Status HTTP: <strong class="mono">${res.status} ${UI.escapeHTML(res.statusText)}</strong></span> |
                <span>Tempo de Resposta: <strong>${res.duration}ms</strong></span> |
                <span>Data: <strong>${dateFormatted}</strong></span>
              </span>
            </div>
            <span class="status-badge ${statusBadgeClass}">${res.status} ${UI.escapeHTML(res.statusText)}</span>
          </div>

          <div class="table-container" style="margin-top: 1.25rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Propriedade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>URL Solicitada</td>
                  <td class="mono">${UI.escapeHTML(res.url)}</td>
                </tr>
                <tr>
                  <td>URL Final (Pós Redirecionamentos)</td>
                  <td class="mono">${UI.escapeHTML(res.finalUrl)}</td>
                </tr>
                <tr>
                  <td>Houve Redirecionamento?</td>
                  <td><strong>${res.redirected ? 'Sim (301/302)' : 'Não'}</strong></td>
                </tr>
                <tr>
                  <td>Método Utilizado</td>
                  <td><span class="status-badge info">${UI.escapeHTML(method)}</span></td>
                </tr>
                <tr>
                  <td>Tipo de Resposta Fetch</td>
                  <td class="mono">${UI.escapeHTML(res.type)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${UI.renderAnalysis(
            'Resultado do Teste de Conectividade',
            res.ok
              ? `O servidor respondeu com sucesso (HTTP ${res.status}). A conexão Web/HTTPS está ativa e acessível em ${res.duration}ms.`
              : `O servidor foi alcançado com sucesso em ${res.duration}ms, porém retornou o código HTTP ${res.status} (${res.statusText}). Verifique as rotas ou credenciais de acesso do servidor web.`
          )}
        </div>
      `;

    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Erro inesperado: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  }
};
