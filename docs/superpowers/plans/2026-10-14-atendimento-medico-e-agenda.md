# Plano de Implementação: Novo Atendimento Médico Amplo, Agenda Visual e Rotas em Português

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o fluxo de atendimento médico em uma mesa clínica espaçosa em tela cheia (baseada no ClínicaSys), implementar a nova visualização de Agenda Médica em grade semanal/diária por horários com filtros rápidos, e traduzir todas as rotas da aplicação para Português com redirecionamento das rotas antigas.

**Architecture:** Módulo dedicado `/atendimento` com página de entrada para o médico (agenda e fila) e mesa clínica completa `/atendimento/[appointmentId]`. Refatoração da tela de agendamentos (`/agendamentos`) para suportar alternância entre Grade Calendário e Tabela. Migração das rotas (`/patients` -> `/pacientes`, `/appointments` -> `/agendamentos`, etc.) com rotas de redirecionamento para preservar compatibilidade, ajuste no Proxy/Middleware e no AppSidebar.

**Tech Stack:** Next.js 16 (App Router, Turbopack, Server Actions), React 19, TypeScript, Drizzle ORM, Tailwind CSS v4, Lucide React, Date-fns / Dayjs, Sonner.

**Spec:** [docs/superpowers/specs/2026-10-14-atendimento-medico-e-agenda-design.md](file:///c:/Users/User/Documents/TesteDrAgenda/docs/superpowers/specs/2026-10-14-atendimento-medico-e-agenda-design.md)

## Global Constraints

- Todas as URLs e rotas da interface principal devem ser em Português: `/pacientes`, `/agendamentos`, `/medicos`, `/usuarios`, `/assinatura`, `/atendimento`.
- Rotas antigas em inglês (`/patients`, `/appointments`, `/doctors`, `/users`, `/subscription`) devem redirecionar automaticamente sem quebrar links existentes.
- O novo menu "Atendimento" (`/atendimento`) deve estar visível e acessível para médicos e administradores.
- A tela de atendimento deve ser ampla, em tela cheia (sem modais estreitos para a evolução clínica principal).
- Os sinais vitais devem calcular o IMC automaticamente ao preencher Peso e Altura.
- Todos os textos, validações e mensagens devem estar em Português do Brasil.
- A compilação `npx tsc --noEmit` e o build `npm run build` devem passar com código 0.

## Review Focus

- Tentativa de acesso a rotas antigas em inglês (deve redirecionar limpo para a rota equivalente em português).
- Acesso à rota `/atendimento` por perfil recepção (deve redirecionar para `/agendamentos` conforme RBAC).
- Cálculo de IMC com valores nulos ou vírgula no peso/altura (não deve quebrar a interface).
- Impressão de receituário, atestado e pedido de exames (deve ocultar a barra lateral e elementos de navegação no `@media print`).
- Finalização de atendimento vinculada a consulta (deve salvar o registro no prontuário e atualizar status da consulta).

---

### Task 1: Migração das Rotas para Português, Atualização do Proxy e Sidebar

**Files:**
- Create: `src/app/(protected)/agendamentos/page.tsx`
- Create: `src/app/(protected)/pacientes/page.tsx`
- Create: `src/app/(protected)/medicos/page.tsx`
- Create: `src/app/(protected)/usuarios/page.tsx`
- Create: `src/app/(protected)/assinatura/page.tsx`
- Modify: `src/app/(protected)/appointments/page.tsx` (redirect para `/agendamentos`)
- Modify: `src/app/(protected)/patients/page.tsx` (redirect para `/pacientes`)
- Modify: `src/app/(protected)/doctors/page.tsx` (redirect para `/medicos`)
- Modify: `src/app/(protected)/users/page.tsx` (redirect para `/usuarios`)
- Modify: `src/app/(protected)/subscription/page.tsx` (redirect para `/assinatura`)
- Modify: `src/proxy.ts` (matcher com as rotas em português e `/atendimento`)
- Modify: `src/hocs/with-authentication.tsx` (redirecionamento padrão para `/agendamentos`)
- Modify: `src/app/(protected)/_components/app-sidebar.tsx` (itens em português e adição do item `Atendimento`)

**Interfaces:**
- Produces: rotas `/agendamentos`, `/pacientes`, `/medicos`, `/usuarios`, `/assinatura` operacionais, sidebar com o menu "Atendimento" direcionando para `/atendimento`.

- [ ] **Step 1: Criar as novas páginas nas pastas em português espelhando a lógica das rotas correspondentes**
- [ ] **Step 2: Configurar redirecionamento nas rotas antigas em inglês para as rotas em português**
- [ ] **Step 3: Atualizar `src/proxy.ts` e `src/hocs/with-authentication.tsx` com as rotas traduzidas**
- [ ] **Step 4: Atualizar `app-sidebar.tsx` com as novas rotas e adicionar o item "Atendimento" (`/atendimento`) para admin e doctor**
- [ ] **Step 5: Executar `npx tsc --noEmit` para verificar a integridade dos tipos**
- [ ] **Step 6: Commit das alterações de rotas e sidebar**

---

### Task 2: Componente de Agenda Visual em Grade Semanal & Diária

**Files:**
- Create: `src/app/(protected)/agendamentos/_components/calendar-grid.tsx`
- Create: `src/app/(protected)/agendamentos/_components/quick-filters-bar.tsx`
- Create: `src/app/(protected)/agendamentos/_components/appointment-card.tsx`
- Create: `src/app/(protected)/agendamentos/_components/appointment-detail-sheet.tsx`
- Modify: `src/app/(protected)/agendamentos/_components/appointments-view.tsx`

**Interfaces:**
- Produces:
  - `CalendarGrid`: renderiza colunas dos dias da semana e linhas de horários (07:00 às 21:00) com posicionamento dos agendamentos em cards interativos.
  - `QuickFiltersBar`: seletor de períodos rápidos (*Hoje, Amanhã, 7 dias*), filtros de data, chips coloridos por médico e busca por paciente.
  - `AppointmentCard`: card colorido com horário, nome do paciente, especialidade e status.
  - `AppointmentDetailSheet`: painel com detalhes da consulta e botão de destaque **"▶ Iniciar Atendimento"**.

- [ ] **Step 1: Criar `quick-filters-bar.tsx` com botões rápidos (Hoje, Amanhã, 7 dias), tags de médicos coloridas e busca**
- [ ] **Step 2: Criar `appointment-card.tsx` e `appointment-detail-sheet.tsx` com o botão de início de atendimento para `/atendimento/[appointmentId]`**
- [ ] **Step 3: Criar `calendar-grid.tsx` estruturando a grade semanal/diária por horários e alocação visual dos cards**
- [ ] **Step 4: Integrar a alternância entre Grade e Tabela em `appointments-view.tsx`**
- [ ] **Step 5: Verificar compilação com `npx tsc --noEmit`**
- [ ] **Step 6: Commit do componente da nova agenda visual**

---

### Task 3: Página Principal do Módulo de Atendimento (`/atendimento`)

**Files:**
- Create: `src/app/(protected)/atendimento/page.tsx`
- Create: `src/app/(protected)/atendimento/_components/doctor-agenda-view.tsx`
- Create: `src/app/(protected)/atendimento/_components/quick-patient-search.tsx`

**Interfaces:**
- Produces: rota `/atendimento` restrita a `["doctor", "admin"]`, exibindo a agenda do médico selecionado com destaque para a fila do dia e acesso rápido a iniciar atendimento de qualquer paciente.

- [ ] **Step 1: Criar a página `src/app/(protected)/atendimento/page.tsx` com validação de perfil (`admin`, `doctor`) e consulta do médico atual**
- [ ] **Step 2: Implementar `doctor-agenda-view.tsx` com a lista/grade dos pacientes agendados para o profissional e status de atendimento**
- [ ] **Step 3: Implementar `quick-patient-search.tsx` permitindo que o médico inicie atendimento de um paciente avulso diretamente**
- [ ] **Step 4: Validar tipos com `npx tsc --noEmit`**
- [ ] **Step 5: Commit do módulo `/atendimento`**

---

### Task 4: Mesa Clínica de Atendimento Ampla (`/atendimento/[appointmentId]`)

**Files:**
- Create: `src/app/(protected)/atendimento/[appointmentId]/page.tsx`
- Create: `src/app/(protected)/atendimento/_components/clinical-attendance-view.tsx`
- Create: `src/app/(protected)/atendimento/_components/vital-signs-bar.tsx`
- Create: `src/app/(protected)/atendimento/_components/soap-editor.tsx`
- Create: `src/app/(protected)/atendimento/_components/patient-sidebar-card.tsx`
- Create: `src/app/(protected)/atendimento/_components/patient-history-drawer.tsx`

**Interfaces:**
- Consumes: `createMedicalRecord` de `src/actions/medical-records`.
- Produces:
  - `ClinicalAttendanceView`: tela cheia com layout ClínicaSys (Header com dados da consulta e botão salvar, Sidebar do paciente com alergias e histórico, Faixa de sinais vitais, Queixa principal, SOAP 2x2 com templates rápidos, Diagnóstico/CID e Conduta/Retorno).
  - `VitalSignsBar`: cálculo automático de IMC (Peso / Altura²).
  - `SoapEditor`: alternador entre SOAP 2x2 e Texto Livre.

- [ ] **Step 1: Criar `vital-signs-bar.tsx` com inputs em linha de Peso, Altura, PA, FC, Temp, SatO2, FR e badge de IMC calculado**
- [ ] **Step 2: Criar `patient-sidebar-card.tsx` com foto, nome, idade calculada, sexo, badges de alergias críticas e uso contínuo**
- [ ] **Step 3: Criar `patient-history-drawer.tsx` para visualização da linha do tempo de atendimentos anteriores em painel retrátil**
- [ ] **Step 4: Criar `soap-editor.tsx` com abas SOAP (grid 2x2 com botões de frases rápidas) e Texto Livre**
- [ ] **Step 5: Criar `clinical-attendance-view.tsx` reunindo todos os blocos, campo de Queixa Principal, CID-10, Conduta, Retorno e ação de salvar**
- [ ] **Step 6: Criar `src/app/(protected)/atendimento/[appointmentId]/page.tsx` carregando os dados do paciente, consulta e médico**
- [ ] **Step 7: Verificar integridade de tipos com `npx tsc --noEmit`**
- [ ] **Step 8: Commit da mesa clínica de atendimento ampla**

---

### Task 5: Impressões e Documentos Médicos Timbrados (Receita, Atestado, Exames)

**Files:**
- Create: `src/app/(protected)/atendimento/_components/prescription-dialog.tsx`
- Create: `src/app/(protected)/atendimento/_components/medical-certificate-dialog.tsx`
- Create: `src/app/(protected)/atendimento/_components/exam-request-dialog.tsx`
- Create: `src/components/print/printable-document.tsx`
- Modify: `src/app/(protected)/atendimento/_components/clinical-attendance-view.tsx` (vincular gatilhos das impressões na barra lateral)

**Interfaces:**
- Produces: diálogos de geração e visualização para impressão/PDF de Receituário, Atestado Médico e Pedido de Exames com cabeçalho timbrado da clínica e assinatura médica.

- [ ] **Step 1: Criar componente base `printable-document.tsx` com cabeçalho timbrado (clínica, logo, dados), corpo e rodapé médico para impressão (@media print)**
- [ ] **Step 2: Implementar `prescription-dialog.tsx` com lista dinâmica de medicamentos, dosagens e orientações**
- [ ] **Step 3: Implementar `medical-certificate-dialog.tsx` com dias de repouso, data inicial e checkbox de CID-10**
- [ ] **Step 4: Implementar `exam-request-dialog.tsx` com lista de exames laboratoriais e indicação clínica**
- [ ] **Step 5: Integrar os três diálogos aos botões da barra lateral de `clinical-attendance-view.tsx`**
- [ ] **Step 6: Verificar compilação com `npx tsc --noEmit`**
- [ ] **Step 7: Commit dos geradores de documentos timbrados**

---

### Task 6: Validação Completa, Testes de Integração e Build de Produção

**Files:**
- Test all endpoints and components
- Verify `npm run build`

- [ ] **Step 1: Executar `npx tsc --noEmit` e corrigir eventuais avisos de tipagem**
- [ ] **Step 2: Executar `npm run build` garantindo compilação de produção com código 0**
- [ ] **Step 3: Verificar redirecionamentos das rotas antigas em inglês para as rotas em português**
- [ ] **Step 4: Commit final com todas as validações concluídas**
