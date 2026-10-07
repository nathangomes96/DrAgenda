# Plano de Implementação: Gestão de Usuários & Equipe com Níveis de Acesso (RBAC)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desenvolver o módulo completo de Gestão de Usuários da Clínica na rota `/users`, permitindo que Administradores cadastrem novos membros da equipe diretamente (Nome, E-mail, Senha e Papel: Admin, Médico, Recepção), alterem permissões e gerenciem acessos.

**Architecture:** Server Actions protegidas via `protectedWithRoleActionClient(["admin"])` interagindo com `usersTable`, `accountsTable` (hash seguro via `better-auth/crypto`) e `usersToClinicsTable`. Interface completa no App Router com validação de papéis, listagem tabular com badges visuais e diálogos de criação e edição.

**Tech Stack:** Next.js 15, React 19, TypeScript, Drizzle ORM, Better Auth, Tailwind CSS, Lucide React, Shadcn UI / Radix.

**Spec:** [docs/superpowers/specs/2026-10-02-gestao-usuarios-equipe-design.md](file:///c:/Users/User/Documents/TesteDrAgenda/docs/superpowers/specs/2026-10-02-gestao-usuarios-equipe-design.md)

## Global Constraints

- O módulo `/users` e as Server Actions devem ser estritamente restritos a usuários com papel `admin`.
- As senhas dos novos usuários devem ser hasheadas com `hashPassword` de `better-auth/crypto`, permitindo login imediato na tela normal de login.
- O administrador autenticado não pode remover a si mesmo da clínica.
- Todos os textos, validações de formulário e mensagens de feedback devem estar em Português do Brasil.

## Review Focus

- Tentativa de autoexclusão do admin logado (deve retornar erro amigável impedindo a ação).
- Cadastro de usuário cujo e-mail já existe na base (deve associar à clínica se não pertencer ainda, ou alertar se já estiver na clínica).
- Acesso à rota `/users` por usuários sem papel de admin (deve ser bloqueado pelo HOC/middleware).
- Validação de campos obrigatórios (nome mínimo 2 caracteres, e-mail válido, senha mínimo 6 caracteres).
- Compilação limpa sem erros de TypeScript (`npx tsc --noEmit`).

---

### Task 1: Server Actions & Schemas de Usuários da Clínica

**Files:**
- Create: `src/actions/users/schema.ts`
- Create: `src/actions/users/index.ts`

**Interfaces:**
- Produces:
  - `createClinicUserAction`: cria ou vincula usuário à clínica com role (`admin`, `doctor`, `receptionist`).
  - `updateUserRoleAction`: altera o papel do usuário na clínica.
  - `removeUserFromClinicAction`: remove a vinculação do usuário com a clínica.

- [ ] **Step 1: Criar `src/actions/users/schema.ts` com validação Zod para criação, alteração de papel e remoção**
- [ ] **Step 2: Criar `src/actions/users/index.ts` implementando `createClinicUserAction` com `hashPassword` de `better-auth/crypto`**
- [ ] **Step 3: Implementar `updateUserRoleAction` e `removeUserFromClinicAction` com trava anti-autoexclusão**
- [ ] **Step 4: Verificar integridade de tipos com `npx tsc --noEmit`**

---

### Task 2: Data Loader de Usuários da Clínica

**Files:**
- Create: `src/data/get-clinic-users.ts`

**Interfaces:**
- Produces: `getClinicUsers(clinicId: string)` retornando array com dados dos usuários vinculados à clínica.

- [ ] **Step 1: Criar a query Drizzle buscando `usersToClinicsTable` com relação `user` para a clínica fornecida**
- [ ] **Step 2: Mapear os campos retornados com tipagem consistente (id, name, email, image, role, createdAt)**

---

### Task 3: Componentes de Interface do Usuário (`/users`)

**Files:**
- Create: `src/app/(protected)/users/_components/user-dialog.tsx`
- Create: `src/app/(protected)/users/_components/user-table-actions.tsx`
- Create: `src/app/(protected)/users/_components/users-view.tsx`
- Create: `src/app/(protected)/users/page.tsx`

**Interfaces:**
- Consumes: `getClinicUsers`, `createClinicUserAction`, `updateUserRoleAction`, `removeUserFromClinicAction`.
- Produces: Página `/users` completa e protegida para administradores.

- [ ] **Step 1: Criar `user-dialog.tsx` com formulário de cadastro, campos de Nome, E-mail, Senha e Seleção de Cargo com descrições explicativas**
- [ ] **Step 2: Criar `user-table-actions.tsx` com ações de alterar cargo e diálogo de confirmação de exclusão**
- [ ] **Step 3: Criar `users-view.tsx` com tabela moderna, busca de colaboradores e badges visuais por cargo**
- [ ] **Step 4: Criar `src/app/(protected)/users/page.tsx` com validação de papel `admin` e carregamento de dados**

---

### Task 4: Atualização do Menu Lateral (Sidebar)

**Files:**
- Modify: `src/app/(protected)/_components/app-sidebar.tsx`

**Interfaces:**
- Consumes: Ícone `UserCheck` do Lucide.
- Produces: Item "Usuários" no menu principal com restrição para `roles: ["admin"]`.

- [ ] **Step 1: Adicionar o item "Usuários" em `allNavItems` apontando para `/users` com `roles: ["admin"]`**
- [ ] **Step 2: Validar a renderização da sidebar**

---

### Task 5: Validação Geral & Verificação TypeScript

**Files:**
- Test: Execução de compilação TypeScript e teste de carregamento da rota `/users`.

- [ ] **Step 1: Executar `npx tsc --noEmit` para assegurar 0 erros de tipagem**
- [ ] **Step 2: Verificar a rota `/users` via teste de requisição HTTP**
- [ ] **Step 3: Documentar a funcionalidade em `docs/features/gestao_usuarios_equipe.md`**
