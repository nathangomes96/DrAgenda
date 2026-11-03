# Especificação Técnica: Módulo Secretária IA & Integração Motor Externo

## 1. Visão Geral
O módulo "Secretária IA" é uma funcionalidade premium (paga) do DrAgenda que permite às clínicas conectarem o seu número de WhatsApp a um motor externo de inteligência artificial. A secretária virtual (ex: "Sofia") responde pacientes 24h por dia, tira dúvidas sobre convênios/endereço/regras da clínica, consulta horários disponíveis dos médicos, realiza agendamentos e confirma/cancela consultas existentes.

## 2. Requisitos de Banco de Dados (`src/db/schema.ts` -> `clinicsTable`)
Adicionar 6 novas colunas na tabela `clinics`:
- `aiAgentEnabled`: `boolean("ai_agent_enabled").default(false).notNull()` — flag de controle comercial pelo SuperAdmin.
- `aiAgentActive`: `boolean("ai_agent_active").default(false).notNull()` — switch de ativação pela clínica.
- `aiAssistantName`: `text("ai_assistant_name").default("Sofia")` — nome da recepcionista virtual.
- `aiCustomInstructions`: `text("ai_custom_instructions")` — instruções e regras livres da clínica.
- `aiAllowBooking`: `boolean("ai_allow_booking").default(true).notNull()` — permissão para novos agendamentos.
- `aiAllowCancelOrConfirm`: `boolean("ai_allow_cancel_or_confirm").default(true).notNull()` — permissão para confirmar/cancelar.

## 3. Painel do SuperAdmin (`/admin/empresas`)
- `src/actions/admin/clinics.ts`:
  - `getClinicsAdmin()` deve retornar `aiAgentEnabled`.
  - Criar action `toggleClinicAiAgentAdmin(clinicId: string, enabled: boolean)`.
  - Adicionar controle de `aiAgentEnabled` em `RenewPlanDialog` (aba Plano & Vencimento) e na tabela `ClinicsTable`.

## 4. Interface da Clínica & Evolution API (`/settings/ai-agent`)
- Rota protegida `/settings/ai-agent` acessível para Administradores da clínica.
- Item no menu lateral `app-sidebar.tsx` sob Configurações.
- Se `aiAgentEnabled === false`: card comercial de apresentação do módulo pago com CTA para contratar.
- Se `aiAgentEnabled === true`: formulário com switches (`aiAgentActive`, `aiAllowBooking`, `aiAllowCancelOrConfirm`), nome da atendente e regras em texto livre.
- Webhook Evolution API (`setEvolutionWebhook` em `src/lib/evolution-api.ts`):
  - Quando `aiAgentActive = true`: chama `POST {apiUrl}/webhook/set/{instanceName}` com `enabled: true`, `url: process.env.AGENTES_WEBHOOK_URL`, `webhookByEvents: false`, `events: ["MESSAGES_UPSERT"]`.
  - Quando `aiAgentActive = false`: desativa webhook (`enabled: false`).

## 5. Rota REST `POST /api/agent` (`src/app/api/agent/route.ts`)
- Autenticação via header `x-dragenda-key === process.env.DRAGENDA_API_KEY` (401 se inválido).
- Busca a clínica por `whatsappInstanceName = instance` ou `slug = instance` (404 se não encontrada).
- Ações:
  - `get_clinic_context`: se desativado/expirado, `{ ok: true, clinic: { id, name, aiAgentEnabled: false } }`; se ativo, lista de médicos ativos (`isAccessBlocked = false`), paciente pelo telefone (últimos 8 ou 9 dígitos) e consultas agendadas.
  - `get_available_times`: slots disponíveis do médico na data usando `getPublicAvailableTimes`.
  - `create_appointment`: checa `aiAllowBooking`, escala e conflitos, cadastra/localiza paciente, gera código `AG-XXXX`, insere agendamento e retorna dados completos.
  - `update_appointment_status`: checa `aiAllowCancelOrConfirm`, localiza agendamento por código e telefone, atualiza status (e `patientConfirmedAt = new Date()` se confirmado).

