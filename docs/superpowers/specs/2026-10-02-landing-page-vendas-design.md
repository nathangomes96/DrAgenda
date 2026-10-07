# Especificação Técnica: Landing Page de Vendas & Conversão (Doutor Agenda)

**Data:** 02/10/2026  
**Status:** Aprovado em Brainstorming  
**Autor:** Antigravity (Pair Programming com Usuário)

---

## 1. Visão Geral & Objetivos

Criar uma Landing Page de vendas moderna, responsiva e de alta conversão para o software SaaS **Doutor Agenda** (voltado para médicos, dentistas, psicólogos, clínicas e consultórios).

### Objetivos Principais
1. **Atrair e Converter Clínicas:** Apresentar claramente a proposta de valor do Doutor Agenda como solução completa para automação de agenda, combate ao no-show e gestão clínica.
2. **Destacar os Diferenciais Tecnológicos:**
   - WhatsApp Integrado sem dor de cabeça (Evolution API) com lembretes anti no-show automatizados.
   - Confirmação de presença em 1 clique pelo paciente no celular.
   - Link de agendamento público personalizado com slug amigável (`/agendar/nome-da-clinica`).
   - Prontuário Eletrônico seguro com estrita conformidade com a LGPD e sigilo CFM.
   - Múltiplos níveis de acesso (RBAC) para Administradores, Médicos e Recepcionistas.
3. **Apresentar Preços Transparentes:**
   - Plano Essencial em destaque por **R$ 59,90 / mês**.
   - Planos fictícios complementares editáveis (Clínica Pro R$ 119,90/mês e Policlínica R$ 199,90/mês).
4. **Entrega Dupla Sincronizada:**
   - **Nativa no Next.js (`src/app/page.tsx`):** Servida diretamente na rota raiz `/` com SSR e metadados de SEO.
   - **Pacote Autônomo (`public/landing/`):** Arquivos estáticos puros (`index.html`, `style.css`, `script.js`) que podem ser abertos localmente ou hospedados de forma avulsa em qualquer CDN/hospedagem.

---

## 2. Design System & Identidade Visual (Modern Medical Tech)

- **Cores Principais:**
  - `primary`: `#0284c7` (Azul Cirúrgico) / `primary-dark`: `#0369a1`
  - `cyan-tech`: `#06b6d4` / `#0891b2`
  - `emerald-health`: `#10b981` / `#059669` (Status online, badges de sucesso e confirmação)
  - `slate-dark`: `#0f172a` (Títulos e contraste de texto)
  - `slate-body`: `#334155` / `#64748b`
  - `background-light`: `#f8fafc` com malha de gradientes suaves (`mesh-gradient`)
- **Estética & Efeitos:**
  - Glassmorphism com `backdrop-filter: blur(14px)` e bordas sutis semitransparentes.
  - Sombras suaves com dispersão de cor (`box-shadow: 0 10px 30px -10px rgba(2, 132, 199, 0.15)`).
  - Títulos com efeito `background-clip: text` em gradiente azul profundo para ciano.

---

## 3. Animações Nativas CSS3 (Keyframes)

1. `@keyframes floatElement`: Movimento suave de flutuação vertical no card hero (simulando visual 3D flutuante leve).
2. `@keyframes pulseBadge`: Pulso no indicador de status e no botão de chamada para ação principal.
3. `@keyframes toastSlideIn`: Card de simulação de mensagem WhatsApp surgindo na tela com aviso de *"Consulta Confirmada pelo Paciente!"*.
4. **Microinterações:**
   - Efeito hover com elevação (`transform: translateY(-5px)`) em cards de planos e funcionalidades.
   - Accordion interativo suave para a seção de Perguntas Frequentes (FAQ).

---

## 4. Seções da Página

1. **Header Fixo:**
   - Logotipo Doutor Agenda com ícone estilizado de estetoscópio/calendário.
   - Links de navegação: Recursos, Como Funciona, Planos, FAQ.
   - Botão CTA: "Acessar Sistema" direcionando para `/dashboard`.
2. **Hero Section:**
   - Título impactante de conversão.
   - Subtítulo com benefícios diretos.
   - CTAs: "Começar por R$ 59,90/mês" e "Ver Recursos".
   - Preview visual animado simulando a tela de confirmação e disparo de WhatsApp.
3. **Barra de Métricas:**
   - 85% menos faltas de pacientes.
   - Atendimento e agendamento 24h por dia.
   - 100% em conformidade com LGPD e CFM.
4. **Grid de Funcionalidades (Recursos Chave):**
   - Lembretes WhatsApp via Evolution API.
   - Link de agendamento com o nome da clínica.
   - Prontuário médico com anamnese, diagnóstico e conduta.
   - Controle de permissões (Médico, Recepcionista, Admin).
5. **Tabela de Preços:**
   - Plano Essencial: R$ 59,90/mês (Destaque "Mais Escolhido").
   - Plano Pro: R$ 119,90/mês.
   - Plano Enterprise: R$ 199,90/mês.
6. **FAQ (Perguntas Frequentes):**
   - 5 perguntas mais comuns com respostas expansíveis em accordion.
7. **Rodapé:**
   - Links institucionais, copyright e botão de suporte.

---

## 5. Estrutura de Arquivos

```
src/
  app/
    page.tsx                # Rota raiz com Landing Page nativa do Next.js
    landing.css             # Estilos Vanilla CSS com animações e glassmorphism
public/
  landing/
    index.html              # Versão autônoma pura em HTML5
    style.css               # Estilos Vanilla CSS autocontidos
    script.js               # Interações leves (menu mobile, accordion, scroll)
```

---

## 6. Verificação & Critérios de Aceite

1. **Visual & Animações:** A página deve carregar com visual refinado, sem quebras visuais, com animações suaves de entrada e cards flutuantes.
2. **Responsividade:** Testado e aprovado em telas mobile (375px), tablets (768px) e desktop (1440px).
3. **Navegação & Links:**
   - O botão "Acessar Sistema" deve redirecionar corretamente para `/dashboard`.
   - Os links de ancoragem devem deslizar suavemente até a respectiva seção.
4. **Pacote Estático:** O arquivo `public/landing/index.html` deve funcionar de forma 100% autônoma, sem erros de console.
5. **Tipagem:** `npx tsc --noEmit` deve rodar limpo sem erros de tipagem TypeScript no Next.js.
