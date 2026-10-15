# Sistema SaaS Multi-tenant com Trial de 7 Dias, Planos Configuráveis e Gestão de Pagamentos - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o Dr. Agenda em um SaaS multi-tenant onde cada empresa ganha 7 dias de trial automático com banner regressivo, com planos e limites (médicos e clientes) gerenciáveis pelo Super Admin, e suporte a múltiplos métodos de pagamento (Pix direto com envio de comprovante no WhatsApp, Mercado Pago e Stripe) além de renovação manual em 1 clique.

**Architecture:** O sistema opera de forma agnóstica a gateways de pagamento por meio de campos de status e data de expiração (`plan_status`, `plan_expires_at`) na tabela de clínicas. O Super Admin possui um painel exclusivo (`/admin`) para gerenciar planos, limites, configurações de pagamento e renovar manualmente assinaturas de qualquer empresa (+30d, +90d, +1 ano, Vitalício). A aplicação bloqueia o acesso ao painel e pausa agendamentos públicos caso o plano expire sem renovação.

**Tech Stack:** Next.js 15 (App Router), TypeScript, PostgreSQL com Drizzle ORM, Better Auth, Tailwind CSS, Lucide Icons, Sonner toasts.

**Spec:** [docs/superpowers/specs/2026-10-15-saas-multi-tenant-trial-and-plans-design.md](file:///c:/Users/User/Documents/TesteDrAgenda/docs/superpowers/specs/2026-10-15-saas-multi-tenant-trial-and-plans-design.md)

## Global Constraints
- Respeitar Next.js App Router e Server Actions com `next-safe-action` e Drizzle ORM.
- Sempre entregar as mensagens em Português do Brasil.
- A clínica atual de testes e seus dados NÃO devem ser bloqueados (serão migrados como ativos/vitalícios).
- Build de produção (`npx next build`) deve passar com 0 erros de TypeScript e Lint.

## Review Focus
- A expiração do trial bloqueia operações da clínica mas permite acessar `/assinatura` para efetuar o pagamento.
- Super Admin nunca deve ser bloqueado por expiração ao acessar o painel de administração (`/admin`).
- O link público `/agendar/[slug]` de uma clínica expirada exibe aviso amigável de pausa sem quebrar a rota.
- Criação de novos médicos respeita estritamente o limite do plano da clínica (`maxDoctors`).
- Renovação manual no painel do Super Admin calcula corretamente as novas datas e atualiza o status em tempo real.

---

### Task 1: Database Schema & Migration Script

**Files:**
- Modify: `src/db/schema.ts`
- Create: `scripts/migrate-saas-trial-plans.ts`

**Interfaces:**
- Produces: `saasPlansTable`, `platformSettingsTable`, `clinicsTable.planStatus`, `clinicsTable.planExpiresAt`, `clinicsTable.planId`, `clinicsTable.customMaxDoctors`, `clinicsTable.planNotes`, `usersTable.isSuperAdmin`.

- [ ] **Step 1: Adicionar novas tabelas e campos ao `src/db/schema.ts`**
  Definir `saasPlansTable` (id, name, description, price, interval, maxDoctors, maxPatients, isPopular, isActive, features, createdAt, updatedAt), `platformSettingsTable` (id, trialDays, pixEnabled, pixKey, pixKeyType, pixReceiverName, pixWhatsappNumber, mercadopagoEnabled, mercadopagoUrl, stripeEnabled, stripeUrl, updatedAt). Adicionar colunas `planStatus`, `planExpiresAt`, `planId`, `customMaxDoctors`, `planNotes` em `clinicsTable`. Adicionar `isSuperAdmin` em `usersTable`.

- [ ] **Step 2: Criar e executar script de migração no banco de dados**
  Criar `scripts/migrate-saas-trial-plans.ts` com comandos `CREATE TABLE IF NOT EXISTS` e `ALTER TABLE ADD COLUMN IF NOT EXISTS`.
  Inserir registro padrão em `platform_settings` (trial de 7 dias, pix habilitado).
  Inserir plano padrão em `saas_plans` ("Plano Essencial", R$ 59,90, 3 médicos).
  Atualizar clínicas existentes para `plan_status = 'active'`, `plan_expires_at = now() + 365 days` e associar ao plano padrão.
  Atualizar os usuários existentes para `is_super_admin = true`.

- [ ] **Step 3: Executar script de migração via terminal**
  Comando: `npx tsx scripts/migrate-saas-trial-plans.ts`
  Resultado esperado: Tabelas criadas e migração concluída com sucesso.

- [ ] **Step 4: Commit das alterações do banco**
  Comando: `git add src/db/schema.ts scripts/migrate-saas-trial-plans.ts && git commit -m "feat(db): adicionar tabelas de planos saas, configuracoes e campos de trial"`

---

### Task 2: Super Admin Access Control & Helper

**Files:**
- Create: `src/lib/superadmin.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/hocs/with-authentication.tsx`

**Interfaces:**
- Produces: `checkIsSuperAdmin(user: { id?: string; email?: string; isSuperAdmin?: boolean }) => boolean`
- Produces: `session.user.isSuperAdmin: boolean`

- [ ] **Step 1: Criar `src/lib/superadmin.ts`**
  Implementar função `checkIsSuperAdmin` que avalia se `user.isSuperAdmin === true` ou se o email confere com `process.env.SUPERADMIN_EMAIL`.

- [ ] **Step 2: Atualizar `src/lib/auth.ts`**
  Incluir `isSuperAdmin` na consulta `userData` do `customSession` e repassar para `user.isSuperAdmin`.

- [ ] **Step 3: Atualizar `with-authentication.tsx`**
  Adicionar parâmetro opcional `mustBeSuperAdmin?: boolean` no `validateAuthentication`. Se verdadeiro e o usuário não for Super Admin, redireciona para `/dashboard`.

- [ ] **Step 4: Commit**
  Comando: `git add src/lib/superadmin.ts src/lib/auth.ts src/hocs/with-authentication.tsx && git commit -m "feat(auth): implementar verificacao e protecao de rotas para super admin"`

---

### Task 3: Clinic Creation com 7 Dias de Trial Automático

**Files:**
- Modify: `src/actions/create-clinic/index.ts`

**Interfaces:**
- Consumes: `platformSettingsTable`, `saasPlansTable`
- Produces: Nova clínica criada com `planStatus = 'trial'`, `planExpiresAt = new Date() + 7 dias`, vinculada ao plano padrão.

- [ ] **Step 1: Atualizar `createClinic` em `src/actions/create-clinic/index.ts`**
  Consultar `platformSettingsTable` para obter `trialDays` (fallback 7).
  Buscar o plano padrão ativo em `saasPlansTable`.
  Calcular `trialExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)`.
  Inserir a nova clínica com `planStatus: 'trial'`, `planExpiresAt: trialExpiresAt`, `planId: defaultPlan?.id`.

- [ ] **Step 2: Commit**
  Comando: `git add src/actions/create-clinic/index.ts && git commit -m "feat(clinic): vincular 7 dias de trial automatico na criacao da clinica"`

---

### Task 4: Paywall de Expiração & Pausa da Página Pública

**Files:**
- Modify: `src/hocs/with-authentication.tsx`
- Modify: `src/lib/auth.ts`
- Modify: `src/app/agendar/[clinicId]/page.tsx`

**Interfaces:**
- Consumes: `clinic.planStatus`, `clinic.planExpiresAt`

- [ ] **Step 1: Atualizar `customSession` em `src/lib/auth.ts`**
  Carregar `planStatus`, `planExpiresAt`, `planId`, `customMaxDoctors` da clínica no objeto `session.user.clinic`.

- [ ] **Step 2: Implementar bloqueio por expiração em `with-authentication.tsx`**
  Verificar se a clínica está expirada (`planStatus === 'expired'` ou (`planStatus !== 'lifetime'` && `new Date() > planExpiresAt`)).
  Permitir acesso livre a Super Admins e à rota `/assinatura`. Para as demais rotas protegidas da clínica, redirecionar para `/assinatura?expirado=true`.

- [ ] **Step 3: Pausar agendamentos na página pública `/agendar/[clinicId]/page.tsx`**
  Consultar o status da clínica pelo slug/id. Se expirada, renderizar tela amigável informando que os agendamentos online desta clínica estão temporariamente pausados.

- [ ] **Step 4: Commit**
  Comando: `git add src/hocs/with-authentication.tsx src/lib/auth.ts src/app/agendar/[clinicId]/page.tsx && git commit -m "feat(billing): implementar paywall por expiracao e pausa na agenda publica"`

---

### Task 5: Banner Superior de Expiração do Trial no Layout

**Files:**
- Create: `src/app/(protected)/_components/trial-banner.tsx`
- Modify: `src/app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `session.data.user.clinic`

- [ ] **Step 1: Criar `TrialBanner` em `src/app/(protected)/_components/trial-banner.tsx`**
  Calcular dias restantes para `planExpiresAt`.
  Se `planStatus === 'trial'`:
    - Se dias restantes > 2: Exibir barra suave: *"⏳ Você está no período de teste gratuito: seu plano expira em X dias (em DD/MM/AAAA)."* com botão *"Ver Planos / Assinar"*.
    - Se dias restantes <= 2: Exibir barra em tom de alerta: *"⚠️ Atenção: Seu teste gratuito de 7 dias expira em X dias!"*.
  Se `planStatus === 'active'` e faltar <= 3 dias para a renovação: Exibir lembrete suave de renovação.
  Se `planStatus === 'lifetime'`: Não exibir nada.

- [ ] **Step 2: Inserir `TrialBanner` no `src/app/(protected)/layout.tsx`**
  Renderizar o banner logo acima do conteúdo principal (`<main className="w-full">`).

- [ ] **Step 3: Commit**
  Comando: `git add src/app/(protected)/_components/trial-banner.tsx src/app/(protected)/layout.tsx && git commit -m "feat(ui): adicionar banner de contagem regressiva do plano no layout"`

---

### Task 6: Limite de Médicos e Pacientes por Plano

**Files:**
- Modify: `src/actions/create-doctor/index.ts`
- Modify: `src/app/(protected)/medicos/_components/doctor-dialog.tsx` (ou botão de criação)

**Interfaces:**
- Consumes: `saasPlansTable.maxDoctors`, `clinicsTable.customMaxDoctors`

- [ ] **Step 1: Validar contagem de médicos em `createDoctor`**
  Consultar a quantidade atual de médicos vinculados à clínica.
  Consultar o limite do plano da clínica (`customMaxDoctors ?? plan.maxDoctors`).
  Se limite > 0 e quantidade atual >= limite, retornar erro informativo: *"Limite de médicos atingido para o seu plano (X médicos). Faça upgrade para adicionar mais profissionais."*

- [ ] **Step 2: Commit**
  Comando: `git add src/actions/create-doctor/index.ts && git commit -m "feat(plans): aplicar validacao de limite de medicos por plano"`

---

### Task 7: Painel Super Admin: Configurações Gerais e Pagamentos

**Files:**
- Create: `src/actions/admin/platform-settings.ts`
- Create: `src/app/(protected)/admin/configuracoes/page.tsx`
- Create: `src/app/(protected)/admin/configuracoes/_components/settings-form.tsx`

**Interfaces:**
- Produces: `getPlatformSettings`, `updatePlatformSettings`

- [ ] **Step 1: Criar Server Actions em `src/actions/admin/platform-settings.ts`**
  `getPlatformSettings()`: retorna configurações da plataforma.
  `updatePlatformSettings(data)`: atualiza configurações protegendo para Super Admin.

- [ ] **Step 2: Criar UI em `src/app/(protected)/admin/configuracoes/page.tsx`**
  Tela estilizada com cards para:
  - Dias de teste padrão (ex: 7 dias).
  - Pix Direto: Switch ativa/desativa, Chave Pix, Titular, WhatsApp com DDD para envio de comprovante.
  - Mercado Pago: Switch ativa/desativa, URL de pagamento.
  - Stripe: Switch ativa/desativa, URL de pagamento.

- [ ] **Step 3: Commit**
  Comando: `git add src/actions/admin/platform-settings.ts src/app/(protected)/admin/configuracoes && git commit -m "feat(admin): criar tela de configuracoes de pagamentos do saas"`

---

### Task 8: Painel Super Admin: Gestão de Planos & Limites

**Files:**
- Create: `src/actions/admin/plans.ts`
- Create: `src/app/(protected)/admin/planos/page.tsx`
- Create: `src/app/(protected)/admin/planos/_components/plan-dialog.tsx`

**Interfaces:**
- Produces: `getPlansAdmin`, `createOrUpdatePlan`, `togglePlanStatus`

- [ ] **Step 1: Criar Server Actions em `src/actions/admin/plans.ts`**
  Funções para listar todos os planos, criar novo plano, editar plano e ativar/desativar plano.

- [ ] **Step 2: Criar página `src/app/(protected)/admin/planos/page.tsx`**
  Tabela de planos com nome, preço, limite de médicos, limite de pacientes, status (ativo/inativo) e botão para cadastrar ou editar plano via Dialog.

- [ ] **Step 3: Commit**
  Comando: `git add src/actions/admin/plans.ts src/app/(protected)/admin/planos && git commit -m "feat(admin): criar gestao de planos e limites para o super admin"`

---

### Task 9: Painel Super Admin: Gestão de Empresas & Renovação Manual em 1 Clique

**Files:**
- Create: `src/actions/admin/clinics.ts`
- Create: `src/app/(protected)/admin/empresas/page.tsx`
- Create: `src/app/(protected)/admin/empresas/_components/renew-plan-dialog.tsx`

**Interfaces:**
- Produces: `getClinicsAdmin`, `renewClinicPlan`

- [ ] **Step 1: Criar Server Actions em `src/actions/admin/clinics.ts`**
  `getClinicsAdmin()`: retorna todas as clínicas com dono, plano, status, data de expiração e contagem de médicos.
  `renewClinicPlan({ clinicId, actionType, customDate, planId, notes })`: executa:
    - `+30d`: adiciona 30 dias à data de expiração (ou a partir de hoje se já expirado) e status='active'.
    - `+90d`: adiciona 90 dias e status='active'.
    - `+1y`: adiciona 365 dias e status='active'.
    - `+7d_trial`: prorroga 7 dias e status='trial'.
    - `lifetime`: status='lifetime'.
    - `expire`: status='expired'.
    - `custom_date`: define data específica.
    - Salva `planNotes` e revalida o cache.

- [ ] **Step 2: Criar página `src/app/(protected)/admin/empresas/page.tsx`**
  Lista de empresas com busca, badges de status coloridas, link de agendamento copiável e botão "Gerenciar Plano / Renovar".

- [ ] **Step 3: Commit**
  Comando: `git add src/actions/admin/clinics.ts src/app/(protected)/admin/empresas && git commit -m "feat(admin): criar painel de gestao de empresas com renovacao manual em 1 clique"`

---

### Task 10: Atualização da Página de Assinatura do Cliente (`/assinatura`)

**Files:**
- Modify: `src/app/(protected)/assinatura/page.tsx`
- Create: `src/app/(protected)/assinatura/_components/payment-methods-card.tsx`

**Interfaces:**
- Consumes: `platformSettingsTable`, `saasPlansTable`, `clinic`

- [ ] **Step 1: Atualizar `/assinatura/page.tsx`**
  Carregar planos ativos do banco e configurações de pagamento.
  Exibir banner com o status atual da clínica (Trial com X dias restantes, Ativo ou Expirado).
  Renderizar cards com os planos disponíveis mostrando limites de médicos e recursos.
  Renderizar os métodos de pagamento habilitados:
    - Se Pix: QR Code / Chave Pix copia-e-cola com botão direto "Enviar Comprovante via WhatsApp" com texto formatado.
    - Se Mercado Pago: Botão com link do Mercado Pago.
    - Se Stripe: Botão com link do Stripe.

- [ ] **Step 2: Commit**
  Comando: `git add src/app/(protected)/assinatura && git commit -m "feat(billing): atualizar tela de assinatura com metodos configuraveis e envio de pix por whatsapp"`

---

### Task 11: Menu Lateral (`AppSidebar`) para Super Admin

**Files:**
- Modify: `src/app/(protected)/_components/app-sidebar.tsx`

**Interfaces:**
- Consumes: `session.data.user.isSuperAdmin`

- [ ] **Step 1: Adicionar seção "Gestão SaaS" no `AppSidebar`**
  Se o usuário for Super Admin, exibir grupo exclusivo no menu:
  - 🏢 **Empresas**: `/admin/empresas`
  - 📦 **Planos & Limites**: `/admin/planos`
  - ⚙️ **Configurações SaaS**: `/admin/configuracoes`

- [ ] **Step 2: Commit**
  Comando: `git add src/app/(protected)/_components/app-sidebar.tsx && git commit -m "feat(sidebar): exibir menu master de gestao saas para super admin"`

---

### Task 12: Verificação Completa de Build e Push para Deploy no Vercel

**Files:**
- Full codebase validation

- [ ] **Step 1: Testar compilação do TypeScript e Next.js Build**
  Executar: `npx next build`
  Garantir 0 erros de tipagem, lint ou importação.

- [ ] **Step 2: Enviar alterações para o repositório Git remoto**
  Executar: `git push origin main`
  Garantir que a Vercel inicie o deploy com sucesso.
