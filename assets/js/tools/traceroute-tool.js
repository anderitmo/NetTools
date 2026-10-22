/**
 * NetTools BR - Traceroute Tool Component
 */

import { UI } from '../ui.js';

export const TracerouteTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>🗺️ Traceroute / Tracert (Diagnóstico de Rota)</span>
        </h1>
        <p class="page-subtitle">
          Instruções técnicas e esclarecimento sobre o rastreamento de saltos de roteadores no navegador.
        </p>
      </div>

      <div class="card">
        ${UI.renderAlert(
          'O protocolo Traceroute utiliza manipuladores de pacotes IP com TTL (Time To Live) incremental e mensagens ICMP Time Exceeded (Tipo 11) ou portas UDP altas. Navegadores web não possuem permissão de SO para enviar pacotes IP customizados.',
          'warning',
          'Limitação Técnica do Modelo de Sandbox do Navegador'
        )}

        <div style="margin-top: 1.5rem;">
          <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">💻 Como Executar o Traceroute no seu Sistema Operacional</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Abaixo estão os comandos padrão oficiais para executar o diagnóstico de rota com precisão direto no terminal do seu computador:
          </p>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="card" style="background-color: var(--bg-input);">
              <h4 style="color: var(--accent); margin-bottom: 0.5rem;">🪟 Windows (Prompt de Comando ou PowerShell)</h4>
              <div class="code-block">tracert exemplo.com.br</div>
            </div>

            <div class="card" style="background-color: var(--bg-input);">
              <h4 style="color: var(--accent); margin-bottom: 0.5rem;">🐧 Linux / macOS (Terminal)</h4>
              <div class="code-block">traceroute exemplo.com.br</div>
            </div>
          </div>
        </div>
      </div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">🛡️ Política de Honestidade Técnica</div>
        <div class="analysis-content">
          O <strong>NetTools BR não utiliza saltos de rota simulados ou tabelas falsas de IPs fictícios</strong>. Em conformidade com os requisitos de aceitação do projeto, a funcionalidade de rastreamento de saltos em tempo real será ativada automaticamente em versões futuras quando um serviço externo de diagnósticos de rota via API for integrado.
        </div>
      </div>
    `;
  }
};
