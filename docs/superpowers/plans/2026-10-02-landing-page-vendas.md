# Plano de Implementação: Landing Page de Vendas & Conversão

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desenvolver a Landing Page de vendas e captação do SaaS Doutor Agenda na rota raiz (`/`) do Next.js e criar o pacote HTML5/CSS3 estático autônomo em `public/landing/`, com animações modernas e apresentação de planos (R$ 59,90/mês).

**Architecture:** Implementação baseada em HTML5 semântico e Vanilla CSS com estética Modern Medical Tech, glassmorphism e animações CSS3 puras. Rota raiz no Next.js (`src/app/page.tsx`) com Server/Client Component leve para navegação ao `/dashboard`, sincronizada com pacote avulso exportável em `public/landing/`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vanilla CSS3 (Keyframes, Flexbox/Grid, Glassmorphism), HTML5 Semântico.

**Spec:** [docs/superpowers/specs/2026-10-02-landing-page-vendas-design.md](file:///c:/Users/User/Documents/TesteDrAgenda/docs/superpowers/specs/2026-10-02-landing-page-vendas-design.md)

## Global Constraints

- Estilo visual Modern Medical Tech: tons de azul cirúrgico (`#0284c7`), ciano (`#06b6d4`), esmeralda (`#10b981`) e slate escuro (`#0f172a`).
- Sem dependências externas pesadas de CSS/animação (usar CSS nativo modular).
- Preço do plano em destaque fixado em R$ 59,90 mensais.
- Entrega dupla obrigatória: rota raiz do Next.js e pacote estático em `public/landing/`.
- Todos os textos e termos em Português do Brasil.

## Review Focus

- Comportamento responsivo em telas menores que 640px (menu mobile e quebra de grid dos planos).
- Animação do balão de notificação do WhatsApp sem travamentos ou sobreposição de texto.
- Funcionamento do accordion de FAQ (abrir/fechar suavemente sem pular layout).
- Acessibilidade: contraste de cores e links de ação com estados de hover e focus visíveis.
- Carregamento limpo sem erros de tipagem no TypeScript (`npx tsc --noEmit`).

---

### Task 1: Design Tokens, Animações & Folha de Estilos Modular

**Files:**
- Create: `src/app/landing.css`

**Interfaces:**
- Produces: Classes CSS utilitárias, variáveis e animações (`.hero-badge`, `.btn-primary`, `.btn-secondary`, `.pricing-card`, `.feature-card`, `.accordion-item`, `@keyframes floatElement`, `@keyframes pulseBadge`, `@keyframes toastSlideIn`).

- [ ] **Step 1: Criar o arquivo `src/app/landing.css` com variáveis de cores médicas e reset básico**
- [ ] **Step 2: Adicionar as animações CSS3 (keyframes para flutuação, pulso de badge e entrada do balão de WhatsApp)**
- [ ] **Step 3: Adicionar estilizações de componentes (Hero, Header com glassmorphism, Cards de Funcionalidades, Tabela de Preços e Accordion do FAQ)**
- [ ] **Step 4: Adicionar media queries responsivas para mobile (320px - 768px) e desktop (1024px+)**

---

### Task 2: Implementação da Rota Raiz no Next.js (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Consumes: `src/app/landing.css`

**Interfaces:**
- Produces: Componente de página raiz `export default function LandingPage()` com metadados de SEO.

- [ ] **Step 1: Importar `src/app/landing.css` e estruturar o Header fixo com logo e link para `/dashboard`**
- [ ] **Step 2: Construir a Hero Section com copy persuasiva, botões de ação e o mockup animado com balão de WhatsApp**
- [ ] **Step 3: Adicionar a barra de métricas (redução de faltas, atendimento 24h, conformidade LGPD)**
- [ ] **Step 4: Criar o Grid de Funcionalidades detalhando WhatsApp Anti No-Show, Prontuário LGPD, Link com Slug e RBAC**
- [ ] **Step 5: Implementar a Seção de Preços destacando o Plano Essencial de R$ 59,90/mês e planos complementares**
- [ ] **Step 6: Implementar o Accordion do FAQ com interatividade client-side e o Rodapé com links institucionais**
- [ ] **Step 7: Validar que `npx tsc --noEmit` compila com 0 erros**

---

### Task 3: Criação do Pacote Estático Standalone (`public/landing/`)

**Files:**
- Create: `public/landing/index.html`
- Create: `public/landing/style.css`
- Create: `public/landing/script.js`

**Interfaces:**
- Consumes: Estrutura semântica e estilos definidos nas Tasks 1 e 2.
- Produces: Pacote HTML5/CSS3/JS puro e independente de servidores Node.js.

- [ ] **Step 1: Criar `public/landing/index.html` contendo a mesma estrutura semântica da landing page**
- [ ] **Step 2: Criar `public/landing/style.css` com todos os estilos, fontes e animações incorporadas**
- [ ] **Step 3: Criar `public/landing/script.js` com manipulação nativa do accordion, menu mobile e scroll suave**
- [ ] **Step 4: Testar a abertura do arquivo estático para garantir funcionamento autônomo**

---

### Task 4: Verificação Visual, Testes de Responsividade & Finalização

**Files:**
- Test: Verificação no navegador local (`http://localhost:3000/` e `http://localhost:3000/landing/index.html`)

- [ ] **Step 1: Executar `npx tsc --noEmit` para garantir conformidade de tipagem**
- [ ] **Step 2: Verificar a renderização no navegador (responsividade, animações e links)**
- [ ] **Step 3: Confirmar que o botão "Acessar Sistema" leva para `/dashboard` corretamente**
