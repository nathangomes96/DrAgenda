# Especificação Técnica: Novo Atendimento Médico Amplo (Estilo ClínicaSys), Agenda Visual e Rotas em Português

**Data:** 14/10/2026  
**Status:** Aprovado em Brainstorming  
**Autor:** Antigravity (Pair Programming com Usuário)

---

## 1. Visão Geral & Objetivos

Esta especificação aborda a reestruturação da experiência médica e de agendamento do Doutor Agenda:
1. **Tradução Global das Rotas para Português:** Atualizar todas as URLs principais (`/pacientes`, `/agendamentos`, `/medicos`, `/usuarios`, `/assinatura`, `/atendimento`), mantendo compatibilidade e redirecionamento das rotas antigas.
2. **Novo Menu "Atendimento":** Criar um módulo centralizado no sidebar para o médico, reunindo sua agenda de atendimentos e a estação clínica.
3. **Nova Agenda Médica Visual:** Substituir o modelo exclusivo de tabela por uma **Grade Visual Semanal/Diária** (inspirada na referência ClínicaSys), com filtros rápidos de data (*Hoje, Amanhã, 7 dias*), cores individuais por profissional, cards com horário/paciente/procedimento e alternador para visão em tabela.
4. **Mesa Clínica de Atendimento Ampla (`/atendimento/[appointmentId]`):** Substituir o antigo modal apertado por uma tela dedicada e espaçosa em tela cheia com:
   - Identificação do paciente e alertas (Alergias em destaque, Medicamentos de Uso Contínuo, idade calculada).
   - Faixa de Sinais Vitais (Peso, Altura, IMC automático, PA, FC, Temp, Sat O2, FR).
   - Queixa Principal (QP).
   - Evolução Clínica SOAP em grid 2x2 com atalhos para Modelos Clínicos rápidos e alternância para aba *Texto Livre*.
   - Diagnóstico com CID-10, Conduta e Retorno.
   - Histórico de consultas anteriores acessível lateralmente sem perder o preenchimento.
5. **Geração e Impressão de Documentos Timbrados:**
   - Emissão de **Receituário**, **Atestado Médico** e **Pedido de Exames** formatados para impressão e PDF com logotipo da clínica e dados do médico (CRM, especialidade).

---

## 2. Tradução das Rotas para Português

### 2.1 Mapeamento de Rotas
| Rota Anterior | Nova Rota Primária | Papéis Permitidos |
|---|---|---|
| `/appointments` | `/agendamentos` | admin, receptionist, doctor |
| `/patients` | `/pacientes` | admin, receptionist, doctor |
| `/doctors` | `/medicos` | admin |
| `/users` | `/usuarios` | admin |
| `/subscription` | `/assinatura` | admin |
| *(Nova)* | `/atendimento` | doctor, admin |
| *(Nova)* | `/atendimento/[appointmentId]` | doctor, admin |

### 2.2 Compatibilidade e Redirecionamentos
- As rotas antigas em inglês (`/appointments`, `/patients`, `/doctors`, `/users`, `/subscription`) devem redirecionar permanentemente (308) para as novas rotas em português.
- O arquivo `src/proxy.ts` (middleware do Next.js 16) e `src/hocs/with-authentication.tsx` devem atualizar os matchers e validações para incluir `/agendamentos`, `/pacientes`, `/medicos`, `/usuarios`, `/assinatura` e `/atendimento`.
- O componente `AppSidebar` (`src/app/(protected)/_components/app-sidebar.tsx`) deve atualizar todos os links de navegação para as novas rotas.

---

## 3. A Nova Agenda Médica (Grade Semanal & Diária)

Localizada em `/agendamentos` e na aba de agenda de `/atendimento`:

### 3.1 Controles e Filtros Superiores
- **Seletor de Período Rápido:** Botões de clique único `[Hoje]`, `[Amanhã]`, `[7 dias]`.
- **Filtro de Datas:** Inputs de `DE` e `ATÉ` com calendário popover.
- **Chips de Profissionais com Cores:** Tags coloridas com o nome de cada médico (ex.: azul, rosa, verde, laranja, roxo). Para usuários com papel `doctor`, seu filtro já vem selecionado por padrão.
- **Filtros de Busca e Status:** Input para filtrar paciente por nome e Select de status (`Todos`, `Pendente`, `Confirmado`, `Cancelado`).
- **Alternador de Modo:** Botões `[Grade Calendário]` e `[Tabela / Lista]`.

### 3.2 Grade Calendário Visual (Weekly / Daily Grid)
- **Cabeçalho das Colunas:** Dias da semana (`SEG 21`, `TER 22`, etc.), com destaque visual na data de hoje.
- **Linhas de Horários:** Intervalos das 07:00 às 21:00.
- **Cards de Agendamento:**
  - Posicionamento de acordo com o horário da consulta.
  - Cores correspondentes ao profissional responsável ou status da consulta.
  - Conteúdo do card: Horário (`11:00 - 11:30`), Nome do Paciente (`Jorge Matos, 72 anos`), Especialidade / Tipo de Procedimento.
  - Badge de status (Presença confirmada / Aguardando atendimento / Atendido).
- **Ação Direta:** Ao clicar no card, exibe resumo rápido com botão de destaque **"▶ Iniciar Atendimento"**, redirecionando para `/atendimento/[appointmentId]`.

---

## 4. Estação Clínica de Atendimento (`/atendimento/[appointmentId]`)

Uma página em tela cheia com alta legibilidade e foco clínico:

### 4.1 Cabeçalho Clínico
- Procedimento / Tipo da Consulta (badge `Consulta Médica`).
- Nome da Clínica, Médico logado (CRM).
- Botão **"Modelos Clínicos"** para carregar rapidamente templates (Anamnese completa, retorno, controle de crônicos, etc.).
- Botão **"Salvar e Concluir Atendimento"** no topo direito.

### 4.2 Painel Lateral do Paciente (Esquerda)
- **Identificação:** Nome completo, idade (calculada dinamicamente a partir de `birthDate`), sexo (`M` ou `F`), telefone e convênio/particular.
- **Alertas Clínicos Críticos:**
  - ⚠️ **Alergias:** Box vermelho de alta visibilidade com botão de edição rápida.
  - 💊 **Medicamentos de Uso Contínuo:** Lista atualizada do paciente.
- **Navegação Lateral:**
  - 📋 **Atendimento Atual** (exibe o formulário central).
  - 🕒 **Histórico de Consultas:** Drawer lateral que abre a linha do tempo de evoluções anteriores sem sair da página nem perder dados digitados.
  - 💊 **Receituário** (abre gerador de receitas).
  - 📝 **Atestado / Declaração** (abre gerador de atestados).
  - 🧪 **Pedido de Exames** (abre gerador de requisição de exames).

### 4.3 Área Central: Layout SOAP e Sinais Vitais (Estilo ClínicaSys)
1. **Faixa de Sinais Vitais:**
   - Campos inline estilizados:
     - Peso (kg) e Altura (m) com cálculo instantâneo de IMC e classificação nutricional.
     - Pressão Arterial (PA mmHg, ex: `120/80`).
     - Frequência Cardíaca (FC bpm).
     - Temperatura (°C).
     - Saturação de O2 (%).
     - Frequência Respiratória (FR irpm).
2. **Queixa Principal (QP):**
   - Campo de texto amplo em destaque para motivo da consulta.
3. **Evolução do Paciente:**
   - Tabs: **[SOAP]** (padrão) e **[Texto Livre]**.
   - **Grid 2x2 SOAP:**
     - **S — Subjetivo:** Relato do paciente, queixas, histórico da moléstia atual.
     - **O — Objetivo:** Exame físico direcionado, ectoscopia, ausculta, palpação.
     - **A — Avaliação:** Hipóteses diagnósticas e correlação clínica.
     - **P — Plano:** Conduta proposta, orientações, terapêutica prescrita.
     - Cada quadrante possui botão de atalho para modelos de frases pré-configurados.
   - **Modo Texto Livre:** Textarea contínua de altura dinâmica para notas corridas.
4. **Diagnóstico, Conduta e Retorno:**
   - **Diagnóstico (CID-10):** Input com busca/sugestão de códigos CID comuns (ex: I10, E11, J00, etc.).
   - **Conduta:** Seletor ágil com opções: *Tratamento Medicamentoso*, *Aguardar Exames*, *Orientação Clínica*, *Encaminhamento*, *Procedimento Realizado*.
   - **Retorno:** Seletor de tempo (*15 dias*, *30 dias*, *60 dias*, *90 dias*, *A critério do paciente*).

---

## 5. Emissão e Impressão de Documentos Timbrados

Disponíveis como modais ou drawers na tela de atendimento, com botão para **Imprimir / Baixar PDF**:

1. **Receituário Médico:**
   - Cabeçalho timbrado com logo da clínica, razão social, CNPJ e endereço.
   - Dados do paciente (Nome, CPF/Data de nascimento).
   - Lista numerada de medicamentos com posologia clara e orientações.
   - Rodapé com nome do médico, CRM/UF e campo para assinatura/carimbo.
2. **Atestado Médico:**
   - Texto padrão parametrizável: declaração de repouso por X dias a partir de determinada data.
   - Opção de inclusão de CID-10 (com checkbox de ciência do paciente).
   - Formatação para folha A4/A5 pronta para impressão.
3. **Pedido de Exames:**
   - Lista de exames solicitados (laboratoriais, ultrassonografia, raio-X, ECG, etc.).
   - Indicação clínica / justificativa para o laboratório ou plano de saúde.

---

## 6. Persistência de Dados & Compatibilidade com o Schema

- Os registros continuam sendo salvos na tabela `medical_records`:
  - `weight`, `height`, `bloodPressure`, `heartRate`, `temperature` (sinais vitais).
  - `symptoms` (Queixa principal).
  - `diagnosis` (Diagnóstico / CID-10).
  - `treatmentPlan` (Conduta e plano de retorno).
  - `prescription` (Prescrição / Medicamentos).
  - `notes` (Armazena a evolução estruturada SOAP ou texto livre).
  - `appointmentId` vinculado à consulta em atendimento, atualizando o status do agendamento para `confirmed` / atendimento realizado.
- Dados permanentes do paciente (`allergies`, `currentMedications`, `birthDate`) são sincronizados diretamente na tabela `patients`.

---

## 7. Critérios de Aceite & Verificação

1. Todas as rotas funcionam em português (`/pacientes`, `/agendamentos`, `/medicos`, `/usuarios`, `/assinatura`, `/atendimento`).
2. URLs antigas em inglês redirecionam corretamente sem erro 404.
3. O médico consegue visualizar a agenda em grade semanal/diária, filtrar por dia/médico e clicar em um paciente para iniciar atendimento.
4. A tela de atendimento médico carrega em tela cheia com todos os blocos visuais da referência (Sinais Vitais, Queixa, SOAP 2x2, Diagnóstico, Conduta, Retorno).
5. O histórico do paciente pode ser consultado sem sair do atendimento atual.
6. A geração de Receituário, Atestado e Pedido de Exames abre formatada para impressão direta no navegador.
7. O build de produção (`npm run build`) compila com zero erros de tipo e lint.
