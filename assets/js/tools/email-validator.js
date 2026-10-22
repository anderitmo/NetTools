/**
 * NetTools BR - Email & DNS Security Validator Tool Component
 */

import { UI } from '../ui.js';
import { Validators } from '../validators.js';
import { queryDoH } from '../services/dns.js';
import { HistoryManager } from '../history.js';

export const EmailValidatorTool = {
  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          <span>🛡️ Validador de E-mail e Segurança DNS</span>
        </h1>
        <p class="page-subtitle">
          Verificação prudente das configurações de antispam e segurança DNS (MX, SPF, DMARC, DKIM, CAA e DNSSEC) para proteção contra spoofing.
        </p>
      </div>

      <div class="card">
        <form id="email-val-form" class="tool-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label for="eval-domain">Nome do Domínio</label>
              <input type="text" id="eval-domain" placeholder="ex: empresa.com.br" required>
              <span class="form-hint">Domínio a ser analisado.</span>
            </div>

            <div class="form-group" style="flex: 1;">
              <label for="eval-dkim-selector">Seletor DKIM (Opcional)</label>
              <input type="text" id="eval-dkim-selector" placeholder="ex: google, default, k1">
              <span class="form-hint">O registro DKIM requer a chave/seletor específico para consulta.</span>
            </div>

            <div class="form-group" style="flex: 1;">
              <label for="eval-provider">Resolvedor</label>
              <select id="eval-provider">
                <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                <option value="google">Google DNS (8.8.8.8)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" id="eval-submit-btn" class="btn btn-primary">
              <span>Analisar Segurança</span>
            </button>
          </div>
        </form>
      </div>

      <div id="eval-results" class="result-section"></div>

      <div class="analysis-card" style="margin-top: 2rem;">
        <div class="analysis-title">⚠️ Prudência na Classificação de Segurança</div>
        <div class="analysis-content">
          A presença de um registro SPF, DMARC ou CAA é uma recomendação essencial de segurança. No entanto, <strong>a existência do registro isoladamente não garante que o domínio esteja imune a falsificações</strong>. As políticas internas (ex: <code>p=none</code> em DMARC ou <code>+all</code> em SPF) determinam o nível real de proteção do servidor de e-mail.
        </div>
      </div>
    `;

    const form = document.getElementById('email-val-form');
    form.addEventListener('submit', (e) => this.handleQuery(e));
  },

  async handleQuery(e) {
    e.preventDefault();
    const domainInput = document.getElementById('eval-domain');
    const selectorInput = document.getElementById('eval-dkim-selector');
    const providerSelect = document.getElementById('eval-provider');
    const submitBtn = document.getElementById('eval-submit-btn');
    const resultsContainer = document.getElementById('eval-results');

    const domain = Validators.cleanInput(domainInput.value);
    const selector = Validators.cleanInput(selectorInput.value);
    const provider = providerSelect.value;

    if (!Validators.isValidDomain(domain)) {
      resultsContainer.innerHTML = UI.renderAlert('Por favor, informe um nome de domínio válido.', 'warning', 'Entrada Inválida');
      return;
    }

    UI.setLoading(submitBtn, true, 'Analisando Segurança...');
    resultsContainer.innerHTML = '';

    HistoryManager.add('email-validator', 'Validação E-mail/Segurança', domain);

    try {
      // Build async DoH queries
      const queries = [
        queryDoH(domain, 'MX', provider),
        queryDoH(domain, 'TXT', provider), // for SPF
        queryDoH(`_dmarc.${domain}`, 'TXT', provider), // for DMARC
        queryDoH(domain, 'CAA', provider),
        queryDoH(domain, 'DS', provider) // for DNSSEC signal
      ];

      if (selector) {
        queries.push(queryDoH(`${selector}._domainkey.${domain}`, 'TXT', provider));
      }

      const [resMX, resTXT, resDMARC, resCAA, resDS, resDKIM] = await Promise.all(queries);

      const spfRecord = (resTXT.records || []).find(r => r.data.includes('v=spf1'));
      const dmarcRecord = (resDMARC.records || [])[0];
      const caaRecords = resCAA.records || [];
      const dsRecords = resDS.records || [];
      const mxRecords = resMX.records || [];
      const dkimRecord = resDKIM ? (resDKIM.records || [])[0] : null;

      // Evaluate Checks
      const mxCheck = this.evaluateMX(mxRecords);
      const spfCheck = this.evaluateSPF(spfRecord);
      const dmarcCheck = this.evaluateDMARC(dmarcRecord);
      const caaCheck = this.evaluateCAA(caaRecords);
      const dnssecCheck = this.evaluateDNSSEC(dsRecords);
      const dkimCheck = this.evaluateDKIM(dkimRecord, selector);

      resultsContainer.innerHTML = `
        <div class="card">
          <div class="result-header">
            <div>
              <h3>Diagnóstico de Seguraça de E-mail: ${UI.escapeHTML(domain)}</h3>
              <span class="result-meta">
                <span>Resolvedor: <strong>${UI.escapeHTML(provider)}</strong></span> |
                <span>Data: <strong>${new Date().toLocaleString('pt-BR')}</strong></span>
              </span>
            </div>
            <button class="btn btn-secondary btn-sm" id="export-sec-btn">Exportar Diagnóstico</button>
          </div>

          <div class="table-container" style="margin-top: 1.5rem;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mecanismo / Teste</th>
                  <th>Classificação</th>
                  <th>Registro Encontrado</th>
                  <th>Explicação Técnica</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderCheckRow('Servidores MX (E-mail)', mxCheck)}
                ${this.renderCheckRow('SPF (v=spf1)', spfCheck)}
                ${this.renderCheckRow('DMARC (_dmarc)', dmarcCheck)}
                ${this.renderCheckRow('DKIM (Seletor)', dkimCheck)}
                ${this.renderCheckRow('CAA (Autoridade de Certificado)', caaCheck)}
                ${this.renderCheckRow('DNSSEC (Registro DS)', dnssecCheck)}
              </tbody>
            </table>
          </div>

          ${UI.renderAnalysis(
            'Recomendações Práticas de Segurança',
            `Para máxima proteção contra personificação e envio não autorizado de e-mails, o domínio deve possuir MX ativo, SPF restritivo (ex: ~all ou -all), DMARC em modo de rejeição ou quarentena (p=quarentine ou p=reject) e assinaturas DKIM validadas.`
          )}
        </div>
      `;

      document.getElementById('export-sec-btn')?.addEventListener('click', () => {
        const report = {
          domain,
          mx: mxCheck,
          spf: spfCheck,
          dmarc: dmarcCheck,
          dkim: dkimCheck,
          caa: caaCheck,
          dnssec: dnssecCheck,
          timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sec-report-${domain}.json`;
        a.click();
      });

    } catch (err) {
      resultsContainer.innerHTML = UI.renderAlert(`Erro ao analisar segurança do domínio: ${err.message}`, 'error');
    } finally {
      UI.setLoading(submitBtn, false);
    }
  },

  renderCheckRow(title, check) {
    const badgeMap = {
      'Informativo': 'status-badge success',
      'Atenção': 'status-badge warning',
      'Problema Aparente': 'status-badge error',
      'Não Foi Possível Verificar': 'status-badge info'
    };

    return `
      <tr>
        <td><strong>${UI.escapeHTML(title)}</strong></td>
        <td><span class="${badgeMap[check.level] || 'status-badge info'}">${UI.escapeHTML(check.level)}</span></td>
        <td class="mono" style="font-size:0.8rem; word-break:break-all;">${UI.escapeHTML(check.value || 'Nenhum')}</td>
        <td>${UI.escapeHTML(check.details)}</td>
      </tr>
    `;
  },

  evaluateMX(mxRecords) {
    if (!mxRecords || mxRecords.length === 0) {
      return {
        level: 'Atenção',
        value: 'Nenhum MX encontrado',
        details: 'Sem registros MX publicados, este domínio não pode receber e-mails diretamente.'
      };
    }
    return {
      level: 'Informativo',
      value: mxRecords.map(r => r.data).join(', '),
      details: `${mxRecords.length} servidor(es) de e-mail (MX) configurado(s).`
    };
  },

  evaluateSPF(spfRecord) {
    if (!spfRecord) {
      return {
        level: 'Problema Aparente',
        value: 'Ausente',
        details: 'O domínio não possui registro SPF. Provedores de e-mail podem classificar mensagens como spam.'
      };
    }
    const val = spfRecord.data;
    if (val.includes('+all')) {
      return {
        level: 'Problema Aparente',
        value: val,
        details: 'O SPF contém "+all", permitindo que qualquer IP envie e-mails em nome do domínio (sem proteção).'
      };
    }
    if (val.includes('?all')) {
      return {
        level: 'Atenção',
        value: val,
        details: 'O SPF utiliza "?all" (neutro), não instruindo os servidores sobre a legitimidade de outros IPs.'
      };
    }
    return {
      level: 'Informativo',
      value: val,
      details: 'Registro SPF publicado.'
    };
  },

  evaluateDMARC(dmarcRecord) {
    if (!dmarcRecord) {
      return {
        level: 'Problema Aparente',
        value: 'Ausente',
        details: 'Sem registro DMARC em _dmarc.dominio, o domínio não define políticas de tratamento contra spoofing.'
      };
    }
    const val = dmarcRecord.data;
    if (val.includes('p=none')) {
      return {
        level: 'Atenção',
        value: val,
        details: 'DMARC em modo monitoramento (p=none). Mensagens falsas não serão bloqueadas ou enviadas à quarentena.'
      };
    }
    return {
      level: 'Informativo',
      value: val,
      details: 'DMARC publicado com política ativa (p=quarentine ou p=reject).'
    };
  },

  evaluateDKIM(dkimRecord, selector) {
    if (!selector) {
      return {
        level: 'Não Foi Possível Verificar',
        value: 'Seletor não informado',
        details: 'O teste DKIM exige a digitação do seletor utilizado pela aplicação ou provedor.'
      };
    }
    if (!dkimRecord) {
      return {
        level: 'Atenção',
        value: `Seletor "${selector}" não encontrado`,
        details: `Nenhum registro DKIM encontrado no host ${selector}._domainkey. Verifique o nome do seletor.`
      };
    }
    return {
      level: 'Informativo',
      value: dkimRecord.data,
      details: `Chave pública DKIM localizada com sucesso para o seletor "${selector}".`
    };
  },

  evaluateCAA(caaRecords) {
    if (!caaRecords || caaRecords.length === 0) {
      return {
        level: 'Atenção',
        value: 'Ausente',
        details: 'Sem CAA, qualquer Autoridade Certificadora (CA) pública pode emitir certificados SSL/TLS para o domínio.'
      };
    }
    return {
      level: 'Informativo',
      value: caaRecords.map(r => r.data).join('; '),
      details: 'Registros CAA definidos restringindo as Autoridades Certificadoras autorizadas.'
    };
  },

  evaluateDNSSEC(dsRecords) {
    if (!dsRecords || dsRecords.length === 0) {
      return {
        level: 'Atenção',
        value: 'Sem registro DS no resolvedor',
        details: 'Nenhum registro de delegação DS encontrado. DNSSEC pode estar inativo ou não publicado na zona pai.'
      };
    }
    return {
      level: 'Informativo',
      value: dsRecords.map(r => r.data).join(', '),
      details: 'Registro DS de ancoragem DNSSEC encontrado.'
    };
  }
};
