# Links Personalizados (Slugs) e Controle de Acesso (RBAC)

Este documento descreve o funcionamento do sistema de URLs amigáveis para clínicas e a matriz de controle de acesso baseada em papéis (Role-Based Access Control - RBAC).

---

## 1. Slugs Amigáveis (`/agendar/[slug]`)

### 1.1 Objetivo
Permitir que cada clínica ou profissional de saúde tenha um link limpo e memorável para divulgar no Instagram, WhatsApp, cartões de visita e Google Meu Negócio, em vez de um UUID ilegível.

### 1.2 Regras de Formato
- Apenas caracteres alfanuméricos minúsculos e hífens: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Tamanho entre 3 e 50 caracteres.
- Unicidade garantida por índice único no PostgreSQL (`clinics_slug_unique`).

### 1.3 Resolução Dinâmica Resiliente
O helper `getClinicByIdOrSlug` em `src/data/get-clinic-by-id-or-slug.ts` verifica se o valor recebido na rota é um UUID válido ou um slug alfanumérico:
- Se for UUID: busca por `id = val OR slug = val`.
- Se não for UUID: busca exclusivamente por `slug = val`.
Isso previne completamente erros de conversão de tipos do banco (`invalid input syntax for type uuid`).

### 1.4 Gerenciamento no Painel
- Qualquer administrador pode visualizar e personalizar seu slug através do botão **"Portal do Paciente"** na barra lateral.
- A alteração dispara a Server Action `updateClinicSlug`, validando unicidade antes de persistir.

---

## 2. Matriz de Níveis de Acesso (RBAC)

Os papéis são definidos na coluna `role` da tabela `users_to_clinics`:

| Módulo / Rota | Administrador (`admin`) | Médico (`doctor`) | Recepção (`receptionist`) |
| :--- | :---: | :---: | :---: |
| **Dashboard Financeiro & Métricas (`/dashboard`)** | ✅ Total | ❌ Sem acesso | ❌ Sem acesso |
| **Agendamentos (`/appointments`)** | ✅ Total | ✅ Apenas consultas | ✅ Aprovar / Recusar / Lembretes |
| **Gerenciamento de Médicos (`/doctors`)** | ✅ Cadastrar / Editar | ❌ Sem acesso | ❌ Sem acesso |
| **Lista de Pacientes (`/patients`)** | ✅ Ver / Cadastrar | ✅ Ver / Cadastrar | ✅ Ver / Cadastrar |
| **Prontuário Eletrônico EHR (LGPD)** | ✅ Visualizar / Evoluir | ✅ Visualizar / Evoluir | ❌ **Bloqueado por LGPD** |
| **Personalização do Link / Slug** | ✅ Permitido | ❌ Sem acesso | ❌ Sem acesso |
| **Assinatura e Planos (`/subscription`)** | ✅ Gerenciar | ❌ Sem acesso | ❌ Sem acesso |

---

## 3. Camadas de Proteção
1. **Sessão (`auth.ts`):** O papel (`role`) é anexado ao objeto de sessão do usuário no login.
2. **Páginas (`with-authentication.tsx`):** `validateAuthentication({ allowedRoles: [...] })` redireciona automaticamente usuários sem permissão para suas respectivas áreas autorizadas.
3. **Ações de Backend (`next-safe-action.ts`):** `protectedWithRoleActionClient(["admin", ...])` valida no servidor se o usuário autenticado possui o papel adequado para executar a mutação.
4. **Interface (`app-sidebar.tsx`):** Itens não permitidos são ocultados do menu, e um badge do papel é renderizado no perfil do usuário.
