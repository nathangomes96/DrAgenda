# Design Técnico: Sistema SaaS Multi-tenant com Trial de 7 Dias, Planos Configuráveis e Gestão de Pagamentos

**Data:** 15 de Outubro de 2026  
**Status:** Aprovado para Especificação  
**Autor:** Antigravity & Nathan Gomes  

---

## 1. Visão Geral

Transformar a plataforma Dr. Agenda em um SaaS multi-tenant completo, permitindo:
1. **Cadastro autônomo de novas empresas/clínicas**, cada uma com seu link público exclusivo (`/agendar/[slug]`).
2. **Período de Teste Gratuito de 7 Dias** gerado automaticamente no momento do cadastro.
3. **Banner persistente de expiração** informando a contagem regressiva de dias restantes no topo do painel.
4. **Desacoplamento de gateways**: sistema de assinatura guiado por datas de expiração e status no banco de dados, permitindo renovações manuais ou automáticas.
5. **Gestão de Planos & Limites**: Super Administrador pode criar e editar planos definindo preços, limites de médicos e limites de pacientes.
6. **Meios de Pagamento Customizáveis**: Super Administrador pode ativar/desativar Pix Direto (com envio de comprovante no WhatsApp), Mercado Pago e Stripe.
7. **Painel Master do Super Administrador**: visão global de todas as clínicas, status, datas de vencimento e ações de 1 clique para renovar (+30d, +90d, +1 ano, Vitalício, prorrogar teste ou bloquear).
8. **Paywall & Bloqueio**: ao expirar o prazo sem renovação, o painel da clínica é bloqueado com redirecionamento para `/assinatura` e o link público de agendamentos é pausado.

---

## 2. Modelo de Dados (Database Schema)

### 2.1. Tabela `saas_plans` (Planos do SaaS)
Permite ao Super Admin cadastrar e editar os planos da plataforma:
```typescript
export const saasPlansTable = pgTable("saas_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Ex: "Básico", "Profissional", "Clínica Master"
  description: text("description"), // Breve descrição
  price: text("price").notNull(), // Ex: "59,90"
  interval: text("interval").default("month").notNull(), // "month" | "year"
  maxDoctors: integer("max_doctors").default(3).notNull(), // 0 para ilimitado, ou número limite
  maxPatients: integer("max_patients").default(0).notNull(), // 0 para ilimitado
  isPopular: boolean("is_popular").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  features: jsonb("features").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

### 2.2. Tabela `platform_settings` (Configurações Gerais do SaaS)
Armazena as configurações únicas da plataforma:
```typescript
export const platformSettingsTable = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  trialDays: integer("trial_days").default(7).notNull(),
  
  // Configuração Pix
  pixEnabled: boolean("pix_enabled").default(true).notNull(),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type"), // "CPF", "CNPJ", "Email", "Telefone", "Aleatória"
  pixReceiverName: text("pix_receiver_name"),
  pixWhatsappNumber: text("pix_whatsapp_number"), // Número com DDD para envio de comprovante

  // Configuração Mercado Pago
  mercadopagoEnabled: boolean("mercadopago_enabled").default(false).notNull(),
  mercadopagoUrl: text("mercadopago_url"),

  // Configuração Stripe
  stripeEnabled: boolean("stripe_enabled").default(false).notNull(),
  stripeUrl: text("stripe_url"),

  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
```

### 2.3. Alterações na Tabela `clinicsTable`
Campos adicionados para controlar o ciclo de vida do plano e limites:
- `planStatus`: `text("plan_status", { enum: ["trial", "active", "expired", "lifetime"] }).default("trial").notNull()`
- `planExpiresAt`: `timestamp("plan_expires_at")` (ao criar clínica, recebe `Date.now() + trialDays`)
- `planId`: `uuid("plan_id").references(() => saasPlansTable.id)`
- `customMaxDoctors`: `integer("custom_max_doctors")` (opcional, para sobrescrever o limite do plano para clientes especiais)
- `planNotes`: `text("plan_notes")` (histórico de anotações do admin)

### 2.4. Alterações na Tabela `usersTable`
- `isSuperAdmin`: `boolean("is_super_admin").default(false).notNull()`

---

## 3. Arquitetura e Controle de Acesso (Super Admin vs. Clínica)

### 3.1. Identificação do Super Admin
Uma função utilitária `checkIsSuperAdmin(user)` verifica se o usuário é Super Administrador:
1. Verifica se `user.isSuperAdmin === true` no banco; OU
2. Verifica se o email do usuário é igual a `process.env.SUPERADMIN_EMAIL`.

### 3.2. Menu Lateral (`AppSidebar`)
Quando o usuário logado for Super Admin:
- Uma nova seção de menu **"Gestão SaaS"** é adicionada:
  - 🏢 **Empresas**: `/admin/empresas` (listagem, status de expiração e renovação manual).
  - 📦 **Planos & Limites**: `/admin/planos` (criação e edição de planos, médicos e pacientes).
  - ⚙️ **Configurações & Pagamentos**: `/admin/configuracoes` (Pix, Mercado Pago, Stripe, dias de trial).

---

## 4. Ciclo de Vida do Trial e Banner de Expiração

### 4.1. Cadastro e Inicialização
1. O usuário acessa `/authentication` e cria uma conta.
2. É direcionado para `/clinic-form` e cadastra o nome da sua clínica.
3. A action `createClinic`:
   - Gera o slug único da clínica.
   - Consulta `platformSettingsTable.trialDays` (padrão 7 dias).
   - Define `planStatus = 'trial'` e `planExpiresAt = hoje + 7 dias`.
   - Associa o primeiro plano ativo padrão ou o plano Trial.

### 4.2. Banner Superior no Layout Protegido (`TrialBanner`)
Componente renderizado no topo de todas as páginas da área de membros da clínica:
- **Trial Ativo (> 2 dias restantes):**
  - Barra azul suave / esmeralda:
  - *"⏳ Você está no período de teste gratuito: seu plano expira em **X dias** (em DD/MM/AAAA)."*
  - Botão destacado: **"Ver Planos / Assinar"** (leva a `/assinatura`).
- **Trial em Reta Final (<= 2 dias restantes):**
  - Barra de alerta âmbar/alaranjada pulsante:
  - *"⚠️ Atenção: Seu período de teste de 7 dias expira em breve! Renove agora para não interromper seus agendamentos."*
- **Plano Pago Ativo:**
  - Oculto normalmente. Se faltarem menos de 3 dias para renovação da mensalidade, exibe lembrete suave.
- **Plano Vitalício:**
  - Não exibe banners.

### 4.3. Bloqueio por Expiração (Paywall)
1. No `validateAuthentication` (`with-authentication.tsx`):
   - Se `clinic.planStatus === 'expired'` OU (`clinic.planStatus !== 'lifetime'` E `new Date() > clinic.planExpiresAt`):
     - Se o usuário não estiver na rota `/assinatura` ou rotas de admin, redireciona imediatamente para `/assinatura?expirado=true`.
2. Na rota pública de agendamento `/agendar/[slug]`:
   - Se a clínica estiver com plano expirado:
   - Exibe tela amigável informando: *"Os agendamentos online para esta clínica estão temporariamente pausados. Entre em contato diretamente com a clínica."*

---

## 5. Aplicação dos Limites de Médicos e Pacientes

1. **Limite de Médicos:**
   - Na action `createDoctor` e na listagem de médicos:
   - O sistema conta quantos médicos a clínica já possui cadastrados.
   - Compara com `clinic.customMaxDoctors ?? plan.maxDoctors`.
   - Se o limite foi atingido (e não for 0 / ilimitado), o botão "Novo Médico" exibe um aviso ou a action recusa a criação com mensagem clara:
     *"Limite de médicos atingido para o seu plano (X médicos). Faça upgrade para adicionar mais profissionais."*
2. **Limite de Pacientes:**
   - Na action `createPatient`, se `plan.maxPatients > 0`, verifica e bloqueia se exceder.

---

## 6. Painel Master de Gestão SaaS (`/admin`)

### 6.1. `/admin/empresas` (Gerenciador de Empresas e Renovações)
- **Tabela com filtros e busca rápida:**
  - Nome da Empresa, Slug e Link público copiável.
  - Email do criador/responsável.
  - Plano atual e limites.
  - Data de expiração e dias restantes.
  - Badge de status: Trial (amarelo), Ativo (verde), Expirado (vermelho), Vitalício (roxo).
- **Modal "Renovar / Gerenciar Plano":**
  - **Botões de 1 clique:**
    - `+30 dias` (renovação mensal padrão).
    - `+90 dias` (trimestral).
    - `+1 ano` (anual).
    - `+7 dias` (estender teste).
    - `Tornar Vitalício` (define `planStatus = 'lifetime'`).
    - `Bloquear / Expirar Agora` (marca como expirado).
  - Seleção de data exata no calendário.
  - Seleção do Plano da clínica (ex: Básico, Profissional).
  - Campo de notas internas (ex: *"Recebido Pix R$ 59,90 em 15/10"*).

### 6.2. `/admin/planos` (Gestão de Planos & Limites)
- Lista dos planos cadastrados.
- Botão "Novo Plano" e edição de planos existentes:
  - Nome do plano (ex: Básico, Avançado).
  - Preço (R$/mês).
  - Limite de Médicos (ex: 1, 3, 10 ou 0 para ilimitado).
  - Limite de Pacientes (0 para ilimitado).
  - Lista de itens/benefícios em tópicos.
  - Switch para ativar/desativar plano.

### 6.3. `/admin/configuracoes` (Configurações Gerais e Pagamentos)
- **Formulário simples com switches:**
  - **Dias de Teste Inicial**: Número de dias padrão (ex: 7).
  - **Pix Direto**:
    - Switch Habilitar/Desabilitar.
    - Chave Pix.
    - Tipo de Chave (CPF, CNPJ, Telefone, Email, Aleatória).
    - Nome do Titular da Conta.
    - WhatsApp com DDD para envio do comprovante.
  - **Mercado Pago**:
    - Switch Habilitar/Desabilitar.
    - Link de Checkout do Mercado Pago.
  - **Stripe**:
    - Switch Habilitar/Desabilitar.
    - Link de Checkout do Stripe.

---

## 7. Página do Cliente `/assinatura`

A página de assinatura que as empresas visualizam:
1. Exibe os **Planos Disponíveis** com seus limites de médicos e recursos.
2. Exibe o status da assinatura atual da clínica:
   - Se em teste: *"Você está utilizando o período de teste de 7 dias (termina em DD/MM/AAAA)."*
   - Se expirado: Alerta vermelho de paywall: *"Seu período de teste expirou. Escolha uma forma de pagamento abaixo para reativar seu acesso imediatamente."*
3. Exibe as **Formas de Pagamento Habilitadas**:
   - **Opção Pix:** Box com a chave Pix, botão de "Copiar Chave Pix" e botão verde com ícone do WhatsApp: **"Enviar Comprovante pelo WhatsApp"** (já abre a conversa com o texto pré-formatado com o nome da clínica).
   - **Opção Mercado Pago:** Botão para abrir o link do Mercado Pago configurado.
   - **Opção Stripe:** Botão para abrir o link do Stripe configurado.

---

## 8. Estratégia de Migração e Compatibilidade

1. **Migração do Banco de Dados**:
   - Criar `saas_plans` e `platform_settings` via script Drizzle/SQL.
   - Inserir um plano inicial ("Plano Essencial" - R$ 59,90, 3 médicos) e as configurações padrão.
   - Adicionar colunas `plan_status`, `plan_expires_at`, `plan_id`, `plan_notes` em `clinics`.
   - Adicionar coluna `is_super_admin` em `users`.
   - Atualizar clínicas existentes para `plan_status = 'active'` ou `lifetime` para não prejudicar a clínica atual de testes.
   - Definir o usuário criador existente como `is_super_admin = true`.
2. **Deploy Seguro no Vercel**:
   - Manter compatibilidade com rotas existentes.
   - Executar migrações sem downtime.
   - Garantir build limpo (`npx next build`).
