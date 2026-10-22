/**
 * NetTools BR - Ping / Latency Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { testHttpConnectivity } from '../services/http.js';
import { HistoryManager } from '../history.js';

export const PingTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>⏱️ Teste de Latência (Ping HTTP / Modalidade ICMP)</span>
        </h1>
        <p class="page-subtitle">
          Medição iterativa de tempo de resposta HTTP/HTTPS com estatísticas avançadas de latência.
        </p>
      </div>

      <!-- Mode Selector Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
        <button id="tab-http" class="btn btn-primary btn-sm">Modalidade HTTP / HTTPS</button>
        <button id="tab-icmp" class="btn btn-secondary btn-sm">Modalidade ICMP (Nativo)</button>
      </div>

      <!-- HTTP Mode Panel -->
      <div id="panel-http" class="card">
        <form id="ping-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="ping-target">URL / Hostname do Destino</label>
              <input type="text" id="ping-target" placeholder="ex: https://cloudflare.com ou google.com" required>
              <span class="form-hint">Mede a latência de ida e volta (RTT) executando requisições HTTP sequenciais.</span>
            </div>

            <div class="form-group" style="flex: 1;">
              <label for="ping-count">Quantidade de Amostras</label>
              <select id="ping-count">
                <option value="4">4 tentativas</option>
                <option value="8">8 tentativas</option>
                <option value="12">12 tentativas</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="ping-submit-btn" class="btn btn-primary">
              <span>Iniciar Ping HTTP</span>
            </button>
          </div>
        </form>
      </div>

      <!-- ICMP Mode Panel (Disabled Notice) -->
      <div id="panel-icmp" class="card" style="display: none;">
        ${UI.renderAlert(
          'O protocolo ICMP (Internet Control Message Protocol) opera na camada de rede (L3) do modelo OSI e exige soquetes RAW de baixo nível.',
          'warning',
          'Limitação Técnica do Navegador'
        )}
        <div style="margin-top: 1rem; color: var(--text-secondary); line-height: 1.6;">
          <p>Navegadores web modernos executam scripts em uma sandbox de segurança estrita e <strong>não possuem API para enviar pacotes ICMP Echo Request</strong>.</p>
          <p style="margin-top: 0.5rem;">Como esta aplicação opera 100% no cliente sem backend próprio para mascarar os testes, a funcionalidade de ping ICMP verdadeiro não é simular ou retornar valores fictícios.</p>
          <p style="margin-top: 0.5rem;"><strong>Recomendação:</strong> Utilize a modalidade "Ping HTTP" acima para medir a resposta da camada de aplicação web, ou execute o comando <code>ping &lt;host&gt;</code> no terminal do seu sistema operacional.</p>
        </div>
      </div>

      <div id="ping-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">ℹ️ Diferença entre Ping ICMP e Ping HTTP</div>
        <div class="analysis-content">
          O <strong>Ping ICMP</strong> mede a latência pura de rede da camada 3. O <strong>Ping HTTP</strong> mede o tempo total da camada de aplicação (Handshake TCP + Negociação de Certificado TLS + Processamento do Servidor Web HTTP). Por isso, tempos de Ping HTTP costumam ser superiores ao Ping ICMP.
        </div>
      </div>
    `;

    // Tab Switching Logic
    const tabHttp = document.getElementById('tab-http');
    const tabIcmp = document.getElementById('tab-icmp');
    const panelHttp = document.getElementById('panel-http');
    const panelIcmp = document.getElementById('panel-icmp');
    const resultsContainer = document.getElementById('ping-results');

    tabHttp.addEventListener('click', () => {
      tabHttp.className = 'btn btn-primary btn-sm';
      tabIcmp.className = 'btn btn-secondary btn-sm';
      panelHttp.style.display = 'block';
      panelIcmp.style.display = 'none';
      resultsContainer.style.display = 'block';
    });

    tabIcmp.addEventListener('click', () => {
      tabIcmp.className = 'btn btn-primary btn-sm';
      tabHttp.className = 'btn btn-secondary btn-sm';
      panelIcmp.style.display = 'block';
      panelHttp.style.display = 'none';
      resultsContainer.style.display = 'none';
    });

    const form = document.getElementById('ping-form');
    form.addEventListener('submit', (e) => this.handlePing(e));
  },

  async handlePing(e) {
    e.preventDefault();
    const targetInput = document.getElementById('ping-target');
    const countSelect = document.getElementById('ping-count');
    const submitBtn = document.getElementById('ping-submit-btn');
    const resultsContainer = document.getElementById('ping-results');

    let target = Validators.cleanInput(targetInput.value);
    const count = parseInt(countSelect.value, 10);

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    if (!Validators.isValidURL(target)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe um destino válido.', 'warning', 'URL Inválida');
      return;
    }

    UI.setLoading(submitBtn, true, 'Realizando Ping...');
    resultsContainer.innerHTML = `
      <div class="card">
        <h3>Executando teste de latência em ${UI.escapeHTML(target)}...</h3>
        <p class="form-hint">Aguarde o envio das ${count} amostras de requisição.</p>
        <div style="margin-top: 1rem;" id="ping-progress"></div>
      </div>
    `;

    HistoryManager.add('ping-tool', 'Ping HTTP', target);

    const samples = [];
    const progressEl = document.getElementById('ping-progress');

    for (let i = 1; i <= count; i++) {
      if (progressEl) {
        progressEl.innerHTML = `<span class="spinner"></span> Enviando pacote ${i} de ${count}...`;
      }

      const res = await testHttpConnectivity(target, { bypassCache: true });
      samples.push(res);

      // Short delay between probes
      await new Promise(r => setTimeout(r, 300));
    }

    UI.setLoading(submitBtn, false);
    this.renderPingReport(resultsContainer, target, samples);
  },

  renderPingReport(container, target, samples) {
    const totalSent = samples.length;
    const successfulProbes = samples.filter(s => s.success);
    const failedProbes = samples.filter(s => !s.success);

    const lossPercentage = Math.round((failedProbes.length / totalSent) * 100);

    let minMs = 0, maxMs = 0, avgMs = 0;

    if (successfulProbes.length > 0) {
      const times = successfulProbes.map(s => s.duration);
      minMs = Math.min(...times);
      maxMs = Math.max(...times);
      avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }

    container.innerHTML = `
      <div class="card">
        <div class="result-header">
          <div>
            <h3>Estatísticas do Ping HTTP: ${UI.escapeHTML(target)}</h3>
            <span class="result-meta">
              <span>Pacotes Transmitidos: <strong>${totalSent}</strong></span> |
              <span>Recebidos: <strong>${successfulProbes.length}</strong></span> |
              <span>Perda: <strong>${lossPercentage}%</strong></span>
            </span>
          </div>
          <span class="status-badge ${lossPercentage === 0 ? 'success' : (lossPercentage < 50 ? 'warning' : 'error')}">
            Perda: ${lossPercentage}%
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.25rem;">
          <div class="card" style="background-color: var(--bg-input); text-align: center;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Mínimo</span>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-text); margin-top: 0.25rem;">${minMs} ms</div>
          </div>

          <div class="card" style="background-color: var(--bg-input); text-align: center;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Média</span>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent); margin-top: 0.25rem;">${avgMs} ms</div>
          </div>

          <div class="card" style="background-color: var(--bg-input); text-align: center;">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Máximo</span>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning-text); margin-top: 0.25rem;">${maxMs} ms</div>
          </div>
        </div>

        <div class="table-container" style="margin-top: 1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th># Seq</th>
                <th>Status / Resultado</th>
                <th>Tempo RTT</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              ${samples.map((s, idx) => `
                <tr>
                  <td><strong>#${idx + 1}</strong></td>
                  <td>
                    <span class="status-badge ${s.success ? 'success' : 'error'}">
                      ${s.success ? `HTTP ${s.status}` : 'Falha / CORS'}
                    </span>
                  </td>
                  <td class="mono"><strong>${s.duration} ms</strong></td>
                  <td class="mono" style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${s.success ? `URL: ${UI.escapeHTML(s.finalUrl)}` : UI.escapeHTML(s.error)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${UI.renderAnalysis(
          'Análise de Estabilidade da Rede',
          lossPercentage === 0
            ? `Conexão altamente estável com 0% de perda em ${totalSent} tentativas. Tempo médio de resposta HTTP: ${avgMs} ms.`
            : `Houve ${lossPercentage}% de falha nas tentativas. Verifique estabilidade da rede ou bloqueios do servidor web.`
        )}
      </div>
    `;
  }
};
