/**
 * NetTools BR - Home / Dashboard Page Component
 */

import { UI } from '../ui.js';
import { HistoryManager } from '../history.js';

export const HomeTool = {
  render(container) {
    const history = HistoryManager.getHistory().slice(0, 5);

    let historyHTML = '';
    if (history.length > 0) {
      historyHTML = `
        <div class="card" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.1rem;">🕒 Consultas Recentes</h3>
            <button id="clear-history-btn" class="btn btn-secondary btn-sm">Limpar Histórico</button>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ferramenta</th>
                  <th>Alvo / Entrada</th>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(item => `
                  <tr>
                    <td><strong>${UI.escapeHTML(item.toolTitle)}</strong></td>
                    <td class="mono">${UI.escapeHTML(item.query)}</td>
                    <td>${new Date(item.timestamp).toLocaleString('pt-BR')}</td>
                    <td><a href="#${UI.escapeHTML(item.toolId)}" class="btn btn-secondary btn-sm">Abrir</a></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>⚡ NetTools BR</span>
        </h1>
        <p class="page-subtitle">
          Central profissional de diagnósticos de rede, consultas DNS, conectividade HTTP e análise de segurança de domínios.
        </p>
      </div>

      ${historyHTML}

      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-primary);">Ferramentas Disponíveis</h2>

      <div class="card-grid">
        <a href="#dns-lookup" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">🔍</div>
            <div class="card-tool-title">DNS Lookup</div>
          </div>
          <div class="card-tool-desc">
            Consultas DoH diretas a registros DNS (A, AAAA, MX, NS, TXT, CAA, SOA, DS, DNSKEY) com comparação de resolvedores.
          </div>
          <span class="card-tool-badge">DNS-over-HTTPS</span>
        </a>

        <a href="#reverse-dns" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">🔄</div>
            <div class="card-tool-title">DNS Reverso</div>
          </div>
          <div class="card-tool-desc">
            Resolução de ponteiro PTR para endereços IPv4 e IPv6 com expansão de nibbles hexadecimal e in-addr/ip6.arpa.
          </div>
          <span class="card-tool-badge">PTR Record</span>
        </a>

        <a href="#dns-inspector" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">📋</div>
            <div class="card-tool-title">Inspeção de Registros DNS</div>
          </div>
          <div class="card-tool-desc">
            Consulta consolidada de todos os registros públicos de um domínio (IPs, MX, SPF, DMARC, CAA e DNSSEC).
          </div>
          <span class="card-tool-badge">Visão Geral DNS</span>
        </a>

        <a href="#domain-info" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">🌐</div>
            <div class="card-tool-title">Informações de Domínio (RDAP)</div>
          </div>
          <div class="card-tool-desc">
            Consulta de dados de registro de domínios via protocolo moderno RDAP (substituto do WHOIS tradicional).
          </div>
          <span class="card-tool-badge">RDAP / WHOIS</span>
        </a>

        <a href="#connectivity" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">📡</div>
            <div class="card-tool-title">Conectividade HTTP/HTTPS</div>
          </div>
          <div class="card-tool-desc">
            Testes de acessibilidade web, código de status HTTP, tempo de resposta e diagnóstico de limitações de CORS.
          </div>
          <span class="card-tool-badge">Fetch API</span>
        </a>

        <a href="#email-validator" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">🛡️</div>
            <div class="card-tool-title">Validação E-mail e Segurança</div>
          </div>
          <div class="card-tool-desc">
            Análise e validação de configurações MX, SPF, DMARC, DKIM e CAA para proteção contra spoofing.
          </div>
          <span class="card-tool-badge">Segurança DNS</span>
        </a>

        <a href="#ping-tool" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">⏱️</div>
            <div class="card-tool-title">Teste de Latência (Ping HTTP)</div>
          </div>
          <div class="card-tool-desc">
            Medição iterativa de tempo de resposta HTTP/HTTPS com estatísticas de mínimo, média, máximo e variação.
          </div>
          <span class="card-tool-badge">Latência</span>
        </a>

        <a href="#traceroute-tool" class="card card-tool">
          <div class="card-tool-header">
            <div class="card-tool-icon">🗺️</div>
            <div class="card-tool-title">Traceroute / Tracert</div>
          </div>
          <div class="card-tool-desc">
            Informações sobre rastreamento de rotas e instruções de execução nos principais sistemas operacionais.
          </div>
          <span class="card-tool-badge">Diagnóstico de Rota</span>
        </a>
      </div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">ℹ️ Execução 100% Estática no Navegador</div>
        <div class="analysis-content">
          Esta aplicação opera exclusivamente no seu navegador (Client-Side HTML/JS). Nenhuma consulta é processada ou armazenada em servidores próprios do NetTools BR. As consultas são enviadas diretamente para as APIs públicas oficiais (Cloudflare DNS, Google DNS, RDAP Org).
        </div>
      </div>
    `;

    // History clear listener
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Deseja limpar o histórico local de consultas?')) {
          HistoryManager.clear();
          this.render(container);
        }
      });
    }
  }
};
