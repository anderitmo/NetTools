/**
 * NetTools BR - Reverse DNS (PTR) Tool Component
 */

import { UI } from '../ui.js';
import { Validators, ipv4ToArpa, ipv6ToArpa } from '../validators.js';
import { queryDoH } from '../services/dns.js';
import { HistoryManager } from '../history.js';

export const ReverseDNSTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>🔄 DNS Reverso (PTR)</span>
        </h1>
        <p class="page-subtitle">
          Consulte o registro PTR associado a endereços IP (IPv4 ou IPv6) com conversão automática para zonas in-addr.arpa e ip6.arpa.
        </p>
      </div>

      <div class="card">
        <form id="reverse-dns-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="rdns-ip">Endereço IP (IPv4 ou IPv6)</label>
              <input type="text" id="rdns-ip" placeholder="ex: 8.8.8.8 ou 2001:4860:4860::8888" required>
              <span class="form-hint">Para IPv4, a zona in-addr.arpa é gerada invertendo os octetos. Para IPv6, a zona ip6.arpa expande todos os nibbles hexadecimais.</span>
            </div>

            <div class="form-group">
              <label for="rdns-provider">Resolvedor Público</label>
              <select id="rdns-provider">
                <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                <option value="google">Google DNS (8.8.8.8)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="rdns-submit-btn" class="btn btn-primary">
              <span>Consultar PTR</span>
            </button>
          </div>
        </form>
      </div>

      <div id="rdns-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">💡 Esclarecimento Importante sobre DNS Reverso</div>
        <div class="analysis-content">
          O registro PTR mapeia um endereço IP para um hostname oficial. <strong>O DNS reverso não lista todos os sites ou domínios hospedados em um endereço IP.</strong> Ele retorna apenas o FQDN configurado pelo proprietário do bloco de IP (ou Provedor de Internet/Data Center) na zona de reverso correspondente.
        </div>
      </div>
    `;

    const form = document.getElementById('reverse-dns-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const ipInput = document.getElementById('rdns-ip');
    const providerSelect = document.getElementById('rdns-provider');
    const submitBtn = document.getElementById('rdns-submit-btn');
    const resultsContainer = document.getElementById('rdns-results');

    const rawIp = Validators.cleanInput(ipInput.value);
    const provider = providerSelect.value;

    const isV4 = Validators.isValidIPv4(rawIp);
    const isV6 = Validators.isValidIPv6(rawIp);

    if (!isV4 && !isV6) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe um endereço IPv4 (ex: 8.8.8.8) ou IPv6 (ex: 2001:4860:4860::8888) válido.', 'warning', 'Endereço IP Inválido');
      return;
    }

    const arpaDomain = isV4 ? ipv4ToArpa(rawIp) : ipv6ToArpa(rawIp);

    UI.setLoading(submitBtn, true);
    resultsContainer.innerHTML = '';

    HistoryManager.add('reverse-dns', 'DNS Reverso', rawIp);

    try {
      const res = await queryDoH(arpaDomain, 'PTR', provider);

      if (!res.success) {
        resultsContainer.innerHTML = `
          <div class="card">
            ${UI.renderAlert(res.error, 'error', 'Erro na Consulta DoH')}
          </div>
        `;
        return;
      }

      const dateFormatted = new Date(res.timestamp).toLocaleString('pt-BR');
      const hasRecords = res.records && res.records.length > 0;

      let statusAlert = '';
      if (res.isNXDomain) {
        statusAlert = UI.renderAlert(`Não há zona ou registro reverso (PTR) configurado para o IP "${rawIp}" (NXDOMAIN).`, 'warning', 'Registro PTR Ausente');
      } else if (!hasRecords) {
        statusAlert = UI.renderAlert(`A consulta para a zona reverso retornou status ${res.statusText}, mas nenhum registro PTR foi encontrado.`, 'info', 'Sem Resposta PTR');
      } else {
        const ptrName = res.records[0].data;
        statusAlert = UI.renderAlert(`Hostname retornado: ${ptrName}`, 'success', 'DNS Reverso Encontrado');
      }

      resultsContainer.innerHTML = `
        <div class="card">
          <div class="result-header">
            <div>
              <h3>Resultado do Reverso: ${UI.escapeHTML(rawIp)}</h3>
              <span class="result-meta">
                <span>Zona Consultada: <strong class="mono">${UI.escapeHTML(arpaDomain)}</strong></span> |
                <span>Resolvedor: <strong>${UI.escapeHTML(res.provider)}</strong></span> |
                <span>Tempo: <strong>${res.duration}ms</strong></span>
              </span>
            </div>
            ${hasRecords ? `<button class="btn btn-secondary btn-sm copy-btn" data-text="${UI.escapeHTML(res.records[0].data)}">Copiar Hostname</button>` : ''}
          </div>

          <div style="margin-top: 1rem;">
            ${statusAlert}
          </div>

          ${hasRecords ? `
            <div class="table-container" style="margin-top: 1rem;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Endereço IP Original</th>
                    <th>Nome da Zona Reverso (ARPA)</th>
                    <th>TTL</th>
                    <th>Hostname Retornado (PTR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${res.records.map(r => `
                    <tr>
                      <td class="mono"><strong>${UI.escapeHTML(rawIp)}</strong></td>
                      <td class="mono">${UI.escapeHTML(arpaDomain)}</td>
                      <td class="mono">${r.TTL}s</td>
                      <td class="mono"><strong>${UI.escapeHTML(r.data)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${UI.renderAnalysis(
            'Análise Técnica do PTR',
            hasRecords
              ? `O endereço IP ${rawIp} resolve oficialmente para ${res.records[0].data}. Essa configuração é essencial para servidores de e-mail (MTA) evitarem rejeições por antispam (rDNS validation).`
              : `O IP ${rawIp} não possui registro PTR publicado. Caso este IP seja utilizado para envio de e-mails, mensagens destinadas a provedores rigorosos (como Gmail, Outlook e Yahoo) podem ser rejeitadas.`
          )}
        </div>
      `;

      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          UI.copyToClipboard(btn.getAttribute('data-text'), btn);
        });
      });

    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Erro inesperado: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  }
};
