# Módulo Secretária IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o módulo pago "Secretária IA" com suporte completo no banco de dados, SuperAdmin, tela de configuração na clínica com webhook da Evolution API e rota REST de integração `POST /api/agent`.

**Architecture:** O DrAgenda armazena as preferências da Secretária IA no registro da clínica em `clinicsTable`. O SuperAdmin controla o switch pago `aiAgentEnabled`. O cliente ativa `aiAgentActive` e personaliza instruções e permissões, disparando a ativação do webhook na Evolution API. Um motor externo de IA se conecta via `POST /api/agent` validando `x-dragenda-key` para obter contexto, horários, criar e confirmar/cancelar agendamentos.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM (PostgreSQL/Supabase), Zod, Next Safe Action, Better Auth, Evolution API.

**Spec:** `docs/superpowers/specs/2026-11-03-secretaria-ia-design.md`

## Global Constraints
- Sempre responder ao usuário em Português do Brasil.
- Seguir a arquitetura existente do DrAgenda (`clinicsTable`, `src/lib/evolution-api.ts`, `src/actions/admin/clinics.ts`).
- Código seguro contra injeção e acessos indevidos.

## Review Focus
1. Header `x-dragenda-key` incorreto ou ausente deve retornar 401.
2. Instância do WhatsApp não encontrada deve retornar 404.
3. Telefone do paciente com/sem DDI 55 ou 9º dígito deve ser encontrado corretamente comparando os últimos 8 ou 9 dígitos.
4. Tentativa de agendamento por IA quando `aiAllowBooking = false` ou `aiAgentActive = false` deve ser bloqueada.
5. Alteração de status da consulta com código inexistente ou telefone divergente deve retornar erro.

---

### Task 1: Banco de Dados & Script de Migração
**Files:**
- Modify: `src/db/schema.ts`
- Create: `scripts/migrate-ai-agent.ts`

- [ ] Adicionar colunas `aiAgentEnabled`, `aiAgentActive`, `aiAssistantName`, `aiCustomInstructions`, `aiAllowBooking`, `aiAllowCancelOrConfirm` em `clinicsTable` no `src/db/schema.ts`.
- [ ] Criar script `scripts/migrate-ai-agent.ts` com DDL `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS ...`.
- [ ] Executar migração no banco de dados e validar.

### Task 2: Gestão SuperAdmin do Módulo Pago
**Files:**
- Modify: `src/actions/admin/clinics.ts`
- Modify: `src/app/(protected)/admin/empresas/_components/clinics-table.tsx`
- Modify: `src/app/(protected)/admin/empresas/_components/renew-plan-dialog.tsx`

- [ ] Atualizar `getClinicsAdmin()` para expor `aiAgentEnabled`.
- [ ] Criar action `toggleClinicAiAgentAdmin` em `src/actions/admin/clinics.ts`.
- [ ] Adicionar switch visual na tabela `ClinicsTable` e no `RenewPlanDialog`.

### Task 3: Integração Webhook Evolution API & Actions do Cliente
**Files:**
- Modify: `src/lib/evolution-api.ts`
- Create: `src/actions/ai-agent/index.ts`
- Create: `src/actions/ai-agent/schema.ts`

- [ ] Adicionar função `setEvolutionWebhook` em `src/lib/evolution-api.ts`.
- [ ] Criar action `updateClinicAiAgentSettings` em `src/actions/ai-agent/index.ts` com controle de permissão e chamada à Evolution API.

### Task 4: Tela da Clínica & Menu Lateral
**Files:**
- Modify: `src/app/(protected)/_components/app-sidebar.tsx`
- Create: `src/app/(protected)/settings/ai-agent/page.tsx`
- Create: `src/app/(protected)/settings/ai-agent/_components/ai-agent-settings-view.tsx`

- [ ] Inserir item "Secretária IA" no menu lateral em `app-sidebar.tsx`.
- [ ] Criar página `/settings/ai-agent/page.tsx` com verificação de autenticação e busca dos dados da clínica.
- [ ] Criar view com card promocional (quando `aiAgentEnabled === false`) e formulário de configuração completo (quando `aiAgentEnabled === true`).

### Task 5: Rota REST de Integração `POST /api/agent`
**Files:**
- Create: `src/app/api/agent/route.ts`

- [ ] Criar handler `POST /api/agent` validando header `x-dragenda-key === process.env.DRAGENDA_API_KEY`.
- [ ] Implementar localização da clínica por `whatsappInstanceName` ou `slug`.
- [ ] Implementar `action: "get_clinic_context"`.
- [ ] Implementar `action: "get_available_times"`.
- [ ] Implementar `action: "create_appointment"`.
- [ ] Implementar `action: "update_appointment_status"`.

### Task 6: Verificação & Deploy
- [ ] Executar `npx tsc --noEmit` para garantir 0 erros de tipagem.
- [ ] Executar `npm run build` para garantir build de produção completo.
- [ ] Commit e git push para deploy automático na Vercel.

