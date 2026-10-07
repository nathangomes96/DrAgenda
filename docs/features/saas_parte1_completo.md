# Documentação Técnica - SaaS Doutor Agenda: Parte 1 (A, B, C e D)

Este documento consolida a especificação de arquitetura, boas práticas de segurança, conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018) e implementação das funcionalidades da **Parte 1**.

---

## 1. Visão Geral da Entrega

A Parte 1 estabelece as fundações operacionais, clínicas e de segurança indispensáveis para operar o Doutor Agenda como uma plataforma SaaS multiclínica de alta confiabilidade:

| Módulo | Descrição | Status |
| :--- | :--- | :--- |
| **A. Lembretes & Confirmação Anti No-Show** | Templates automáticos via WhatsApp (24h, no dia e aprovação) e link de confirmação em 1 clique para o paciente. | ✅ Concluído |
| **B. Slug Amigável Personalizado** | Rota pública `/agendar/[slug]` com retrocompatibilidade para UUID `/agendar/[clinicId]`, validação de unicidade e personalização no painel. | ✅ Concluído |
| **C. Prontuário Eletrônico do Paciente (EHR)** | Histórico clínico, queixa, hipótese diagnóstica (CID), prescrições e conduta sob sigilo médico e LGPD. | ✅ Concluído |
| **D. Níveis de Acesso por Usuário (RBAC)** | Controle de papéis (`admin`, `receptionist`, `doctor`) com proteção em sessão, sidebar, páginas e Server Actions. | ✅ Concluído |

---

## 2. Conformidade com a LGPD e Segurança de Dados em Saúde

### 2.1 Classificação dos Dados (Art. 5º, II da LGPD)
O prontuário do paciente contém **dados pessoais sensíveis de saúde**. O tratamento desses dados exige medidas técnicas e administrativas aptas a proteger os dados de acessos não autorizados:
- **Separação de Papéis:** Recepcionistas **não têm acesso** aos prontuários clínicos, diagnósticos ou prescrições médicas. Seu escopo limita-se a agendamentos, dados de contato e confirmações.
- **Acesso Restrito:** Apenas médicos cadastrados na clínica e o administrador clínico possuem autorização para consultar e criar evoluções de saúde.
- **Rastreabilidade e Auditoria:** Cada registro clínico armazena carimbo de data/hora (`createdAt`, `updatedAt`), clínica (`clinicId`), paciente (`patientId`) e médico responsável (`doctorId`).
- **Isolamento Multitenant:** Todas as consultas e mutações no banco de dados aplicam filtros estritos de `clinicId`, impedindo vazamento de dados entre diferentes clínicas.

---

## 3. Detalhamento dos Módulos

### Módulo A: Automação de Lembretes & Confirmação Anti No-Show
- **Templates de Mensagens:** Centralizados em `src/lib/whatsapp-templates.ts`:
  - `build24hReminderMessage`: Lembrete 24h antes com data, horário, especialista e link de confirmação.
  - `buildTodayReminderMessage`: Lembrete do dia com aviso para chegar com 10 min de antecedência.
  - `buildApprovedAppointmentMessage`: Notificação instantânea ao aprovar agendamento online.
- **Página de Confirmação Rápida em 1 Clique:**
  - Rota: `/agendar/[clinicId]/confirmar/[appointmentId]`
  - Permite ao paciente clicar no link direto pelo celular no WhatsApp e confirmar presença sem precisar de login.
  - Action segura: `confirmPatientPresence` em `src/actions/confirm-patient-presence/index.ts`.
- **Interface do Operador:** Modal `WhatsAppReminderDialog` em `src/app/(protected)/appointments/_components/whatsapp-reminder-dialog.tsx` com prévia em tempo real, cópia rápida e botão "Abrir no WhatsApp" (`wa.me`).

### Módulo B: Link Personalizado com Nome da Clínica (Slug Amigável)
- **Schema e Banco:** Coluna `slug text UNIQUE` adicionada à tabela `clinicsTable` com índice exclusivo.
- **Geração Automática:** Ao cadastrar uma clínica, um slug sanitizado é criado automaticamente a partir do nome.
- **Resolução Unificada:** Função `getClinicByIdOrSlug` em `src/data/get-clinic-by-id-or-slug.ts` identifica dinamicamente se o parâmetro de rota é um UUID ou um slug textual, evitando falhas de sintaxe do PostgreSQL.
- **Customização pelo Admin:** Componente `ClinicLinkDialog` acessível na barra lateral permite ao administrador personalizar seu link (ex: `/agendar/clinica-bem-estar`).
- **Action de Atualização:** `updateClinicSlug` em `src/actions/update-clinic-slug/index.ts` com validação de formato e garantia de unicidade.

### Módulo C: Prontuário Eletrônico do Paciente (EHR)
- **Tabela `medical_records`:**
  - `clinic_id`, `patient_id`, `doctor_id`, `appointment_id`
  - `symptoms` (Queixa principal e anamnese)
  - `diagnosis` (Hipótese diagnóstica / código CID-10)
  - `prescription` (Receituário e medicamentos)
  - `treatmentPlan` (Conduta terapêutica e exames)
  - `notes` (Evolução clínica e anotações confidenciais)
- **Controle de Acesso em Server Actions:**
  - `createMedicalRecord`: Apenas `admin` e `doctor`.
  - `getPatientMedicalRecords`: Apenas `admin` e `doctor`.
  - `deleteMedicalRecord`: Apenas `admin`.
- **Interface Clínica:** Modal `MedicalRecordDialog` em `src/app/(protected)/patients/_components/medical-record-dialog.tsx` com histórico cronológico (timeline) e formulário de nova evolução.

### Módulo D: Níveis de Acesso por Usuário (RBAC)
- **Tabela `users_to_clinics`:** Coluna `role text NOT NULL DEFAULT 'admin'` (`admin`, `receptionist`, `doctor`).
- **Sessão Customizada:** `src/lib/auth.ts` injeta `clinic.role` e `clinic.slug` diretamente na sessão do Better Auth.
- **Middlewares e Clientes de Ação:**
  - `protectedWithRoleActionClient(roles)` em `src/lib/next-safe-action.ts` bloqueia execuções não autorizadas.
  - `validateAuthentication({ allowedRoles })` em `src/hocs/with-authentication.tsx` protege páginas do Next.js (ex: `/dashboard`, `/subscription` e `/doctors` restritos ao `admin`).
- **Barra Lateral Inteligente:** `AppSidebar` filtra menus e exibe badge contextual do papel do usuário.

---

## 4. Estrutura de Arquivos Criados e Alterados

```text
src/
├── actions/
│   ├── confirm-patient-presence/    # Confirmação rápida pelo paciente via link WhatsApp
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── create-clinic/               # Cadastro de clínica com slug inicial e papel admin
│   │   └── index.ts
│   ├── medical-records/             # Ações do Prontuário Eletrônico (EHR) com RBAC
│   │   ├── index.ts
│   │   └── schema.ts
│   └── update-clinic-slug/          # Alteração segura do slug amigável da clínica
│       ├── index.ts
│       └── schema.ts
├── app/
│   ├── (protected)/
│   │   ├── _components/
│   │   │   ├── app-sidebar.tsx              # Sidebar com filtragem RBAC e badge de papel
│   │   │   └── clinic-link-dialog.tsx       # Modal de compartilhamento e edição do link
│   │   ├── appointments/_components/
│   │   │   ├── appointments-view.tsx        # View com suporte ao link amigável
│   │   │   ├── table-action.tsx             # Disparador de lembretes no WhatsApp
│   │   │   └── whatsapp-reminder-dialog.tsx # Dialog com templates anti no-show
│   │   ├── dashboard/page.tsx               # Restrito a role 'admin'
│   │   ├── doctors/page.tsx                 # Restrito a role 'admin'
│   │   ├── patients/
│   │   │   ├── _components/
│   │   │   │   ├── medical-record-dialog.tsx# Interface completa de prontuário EHR
│   │   │   │   ├── patients-view.tsx        # Tabela com injeção de médicos
│   │   │   │   ├── table-action.tsx         # Ações com botão de prontuário
│   │   │   │   └── table-columns.tsx
│   │   │   └── page.tsx                     # Página com carregamento de médicos
│   │   └── subscription/page.tsx            # Restrito a role 'admin'
│   └── agendar/[clinicId]/
│       ├── _components/booking-form.tsx     # Agendamento público adaptado para slug
│       ├── confirmar/[appointmentId]/       # Rota pública de confirmação em 1 clique
│       │   ├── _components/confirm-actions.tsx
│       │   └── page.tsx
│       ├── page.tsx                         # Busca por UUID ou slug
│       └── status/[appointmentId]/page.tsx  # Validação retrocompatível com slug
├── data/
│   └── get-clinic-by-id-or-slug.ts          # Helper de resolução resiliente
├── db/schema.ts                             # medicalRecordsTable, slug, role
├── hocs/with-authentication.tsx             # Validador de papéis permitidos
├── lib/
│   ├── auth.ts                              # Inclusão de slug e role na sessão
│   ├── next-safe-action.ts                  # protectedWithRoleActionClient
│   └── whatsapp-templates.ts                # Templates anti no-show
└── scripts/
    └── migrate.mjs                          # Script de migração DDL executado no Supabase
```

---

## 5. Próximos Passos (Conforme Escopo do Usuário)
- **Fase de Faturamento (Stripe):** Cobrança recorrente de planos SaaS por clínica.
- **Landing Page Comercial:** Página institucional de conversão para aquisição de novos clientes (médicos e clínicas).
