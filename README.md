# NetTools BR 🇧🇷

**NetTools BR** é uma aplicação web estática, moderna e profissional desenvolvida para diagnóstico de conectividade de rede, análise de domínios, consultas DNS-over-HTTPS (DoH) e validações de segurança em serviços de internet.

Hospedado diretamente no **GitHub Pages**, o projeto executa **100% no cliente (Client-Side)**, sem necessidade de backend próprio, banco de dados ou ambiente Node.js de produção.

---

## 🚀 Funcionalidades Principais

- **🔍 DNS Lookup (DoH):** Consultas assíncronas a registros DNS (`A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `CAA`, `SRV`, `PTR`, `DS`, `DNSKEY`) com opção de **comparação simultânea** entre Cloudflare e Google Public DNS.
- **🔄 DNS Reverso (PTR):** Resolução de ponteiros PTR para endereços **IPv4** (zona `in-addr.arpa`) e **IPv6** (expansão de nibbles hexadecimais na zona `ip6.arpa`).
- **📋 Inspeção de Registros DNS:** Varredura consolidada dos registros públicos de um domínio, organizando endereços IP, servidores de e-mail (MX), servidores autoritativos (NS), TXT, CAA e políticas de segurança.
- **🌐 Informações de Domínio (RDAP / WHOIS):** Consulta RESTful de dados de registro via protocolo **RDAP** (substituto moderno do WHOIS), retornando datas de expiração, registrador e servidores de nome. Tratamento para bloqueios de CORS e links diretos para servidores autoritativos (ex: Registro.br).
- **📡 Conectividade HTTP / HTTPS:** Testes de acessibilidade web via Fetch API com medição de tempo de resposta em milissegundos, status HTTP, detecção de redirecionamentos e diagnóstico de políticas de CORS.
- **🛡️ Validador de E-mail e Segurança DNS:** Análise das configurações contra spoofing de e-mail e sequestro de DNS:
  - Existência de **MX**;
  - Publicação e sintaxe de **SPF** (`v=spf1`);
  - Registros **DMARC** em `_dmarc.dominio`;
  - Consulta **DKIM** por seletor customizado;
  - Restrições de emissão de certificados **CAA**;
  - Presença de registros de ancoragem **DNSSEC** (`DS`).
- **⏱️ Teste de Latência (Ping HTTP):** Medição iterativa de tempo de resposta HTTP/HTTPS com amostragem configurável e cálculo estatístico de mínimo, média, máximo e porcentagem de perda.
- **🗺️ Traceroute / Tracert:** Instruções para execução em sistemas operacionais (Windows, Linux e macOS) e esclarecimento sobre limitações de soquetes de camada 3 em navegadores.
- **🎨 Interface & Usabilidade:**
  - Layout responsivo mobile-first com navegação lateral;
  - Suporte a Modo Claro e Modo Escuro (Theme Switcher);
  - Histórico local de consultas armazenado no `localStorage`;
  - Campo de busca instantânea de ferramentas no cabeçalho;
  - Cópia com 1 clique e exportação de relatórios em JSON.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica e acessível.
- **CSS3:** Variáveis CSS (Custom Properties), CSS Grid, Flexbox e Design Responsivo sem frameworks pesados.
- **JavaScript Vanilla (ES Modules):** Módulos nativos (`import`/`export`), Fetch API, Promises e manipulação assíncrona do DOM.

Nenhuma dependência externa como React, Vue, jQuery ou bundlers (Webpack, Vite) é exigida.

---

## 📁 Estrutura do Projeto

```text
/
├── index.html                  # Arquivo HTML principal
├── README.md                   # Documentação completa
├── .nojekyll                   # Instrução para GitHub Pages ignorar Jekyll
└── assets/
    ├── css/
    │   ├── styles.css          # Estilos principais e temas
    │   └── responsive.css      # Regras de responsividade mobile
    └── js/
        ├── app.js              # Inicialização e registro de ferramentas
        ├── router.js           # Roteador estático por hash (#)
        ├── ui.js               # Helpers de renderização e sanitização HTML
        ├── validators.js       # Validação de domínios, IPv4 e IPv6
        ├── history.js          # Gerenciamento de histórico local
        ├── services/
        │   ├── dns.js          # Integração DNS-over-HTTPS (DoH)
        │   ├── rdap.js         # Serviço de consulta ao protocolo RDAP
        │   └── http.js         # Teste de conectividade HTTP/HTTPS
        └── tools/
            ├── home.js         # Painel inicial
            ├── dns-lookup.js   # Ferramenta DNS Lookup
            ├── reverse-dns.js  # Ferramenta DNS Reverso
            ├── dns-inspector.js# Inspeção consolidada de DNS
            ├── domain-info.js  # Consulta RDAP de domínios
            ├── connectivity.js # Diagnóstico HTTP/HTTPS
            ├── email-validator.js # Validador de e-mail e segurança
            ├── ping-tool.js    # Teste de latência (Ping HTTP)
            └── traceroute-tool.js # Orientações de Traceroute
```

---

## 💻 Execução Local

Como o projeto é estático e utiliza ES Modules nativos (`type="module"`), basta sirvi-lo através de qualquer servidor HTTP simples.

### Opção 1: Python 3
No diretório raiz do projeto, execute:
```bash
python3 -m http.server 8000
```
Acesse no navegador: `http://localhost:8000`

### Opção 2: Node.js (npx serve)
```bash
npx serve .
```

### Opção 3: Extensão VS Code
Utilize a extensão **Live Server** abrindo o arquivo `index.html`.

---

## 🌐 Publicação no GitHub Pages

1. Envie o código fonte para o seu repositório no GitHub.
2. Acesse as configurações do repositório (**Settings** > **Pages**).
3. Em **Source**, selecione a branch desejada (ex: `main`) e a pasta raiz (`/root`).
4. Clique em **Save**. O site estará disponível em `https://<usuario>.github.io/<repositorio>/`.

O arquivo `.nojekyll` garante que arquivos com subdiretórios que iniciam por `_` ou formatos estáticos sejam servidos corretamente pelo GitHub Pages.

---

## 🔌 APIs Públicas Utilizadas

- **Cloudflare DNS-over-HTTPS (DoH):**
  - Endpoint: `https://cloudflare-dns.com/dns-query`
  - [Documentação Oficial Cloudflare DoH](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/)
- **Google Public DNS DoH:**
  - Endpoint: `https://dns.google/resolve`
  - [Documentação Oficial Google DNS](https://developers.google.com/speed/public-dns/docs/doh)
- **RDAP (Registro.br & RDAP.org):**
  - Endpoints: `https://rdap.registro.br/domain/`, `https://rdap.org/domain/`
  - [Documentação Oficial RDAP IETF](https://rdap.org/)

---

## ⚠️ Limitações Conhecidas

1. **CORS (Cross-Origin Resource Sharing):**
   Alguns servidores web e certos servidores RDAP de TLDs específicos não enviam o cabeçalho `Access-Control-Allow-Origin: *`. O NetTools BR trata graciosamente essas falhas, informando o usuário e disponibilizando atalhos diretos.
2. **Ping ICMP:**
   Navegadores não possuem permissão de soquete RAW para enviar pacotes ICMP Echo Request. A ferramenta disponibiliza o **Ping HTTP** como alternativa real para medição na camada de aplicação.
3. **Traceroute:**
   Navegadores não permitem manipular o TTL de pacotes IP. A ferramenta disponibiliza orientações para execução nativa no SO.

---

## 🔒 Política de Privacidade & Segurança

- **Zero Rastreamento:** O NetTools BR não coleta dados pessoais, não utiliza cookies de rastreamento e não possui servidores de backend para armazenar logs de buscas.
- **Histórico Local:** O histórico de consultas é armazenado exclusivamente no `localStorage` do seu próprio navegador e pode ser limpo a qualquer momento.
- **Sanitização:** Todo dado retornado por APIs externas é sanitizado para prevenir vulnerabilidades de XSS (Cross-Site Scripting).
