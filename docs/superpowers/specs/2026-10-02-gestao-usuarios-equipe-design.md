# Especificação Técnica: Gestão de Usuários & Equipe com Níveis de Acesso (RBAC)

**Data:** 02/10/2026  
**Status:** Aprovado em Brainstorming  
**Autor:** Antigravity (Pair Programming com Usuário)

---

## 1. Visão Geral & Objetivos

Implementar um módulo completo de **Gestão de Usuários da Clínica** acessível exclusivamente por Administradores na rota `/users`, permitindo listar, cadastrar, alterar o cargo e remover colaboradores da clínica com isolamento estrito de permissões (Administrador, Médico, Recepcionista).

### Objetivos
1. Permitir que o Administrador adicione novos colaboradores diretamente com Nome, E-mail, Senha provisória e Papel (`admin`, `doctor`, `receptionist`).
2. Garantir hashing criptográfico de senha compatível com o Better Auth (`hashPassword` de `better-auth/crypto`), permitindo login imediato pelo novo usuário.
3. Exibir tabela interativa de colaboradores com avatares, dados de contato, badges coloridos por papel e menu de ações.
4. Impedir autoexclusão do administrador logado para garantir governança da clínica.
5. Inserir o item "Usuários" no menu lateral da Sidebar para administradores.

---

## 2. Níveis de Acesso & Permissões (RBAC)

| Papel (`role`) | Rótulo Visual | Acesso Permitido | Restrições |
|---|---|---|---|
| `admin` | **Administrador** (Badge Primário) | Acesso total: Dashboard, Agendamentos, Médicos, Pacientes, Usuários, Configurações da Clínica, WhatsApp e Assinatura | Nenhuma |
| `doctor` | **Médico** (Badge Azul) | Agendamentos da sua agenda, Pacientes e Prontuário Eletrônico (EHR) | Não acessa Dashboard gerencial, Médicos, Usuários e Configurações |
| `receptionist` | **Recepção** (Badge Âmbar) | Agendamentos gerais, Pacientes e WhatsApp | Não acessa Prontuários Médicos confidenciais, Usuários e Dashboard |

---

## 3. Arquitetura de Dados & Camada de Serviços

### Banco de Dados (Drizzle ORM)
- `usersTable`:
  - `id`: string (UUID)
  - `name`: string
  - `email`: string
  - `emailVerified`: boolean
- `accountsTable`:
  - `id`: string
  - `accountId`: string
  - `providerId`: `"credential"`
  - `userId`: `usersTable.id`
  - `password`: string (hash seguro Better Auth)
- `usersToClinicsTable`:
  - `userId`: `usersTable.id`
  - `clinicId`: `clinicsTable.id`
  - `role`: `"admin" | "doctor" | "receptionist"`

---

## 4. Server Actions (`src/actions/users/`)

1. **`createClinicUserAction` (`schema.ts` & `index.ts`):**
   - **Permissão:** `protectedWithRoleActionClient(["admin"])`.
   - **Schema de Entrada:**
     - `name`: string (mínimo 2 caracteres)
     - `email`: string (formato e-mail válido)
     - `password`: string (mínimo 6 caracteres)
     - `role`: enum `["admin", "doctor", "receptionist"]`
   - **Fluxo:**
     - Verifica se o e-mail já existe em `usersTable`. Se não existir, cria o registro em `usersTable` e as credenciais com hash em `accountsTable`.
     - Verifica se o usuário já está vinculado à clínica atual (`usersToClinicsTable`). Se já estiver, retorna erro.
     - Cria o vínculo em `usersToClinicsTable` associando à `clinicId` com o papel selecionado.

2. **`updateUserRoleAction`:**
   - **Permissão:** `protectedWithRoleActionClient(["admin"])`.
   - **Schema de Entrada:** `userId`, `role`.
   - **Fluxo:** Altera a coluna `role` em `usersToClinicsTable`.

3. **`removeUserFromClinicAction`:**
   - **Permissão:** `protectedWithRoleActionClient(["admin"])`.
   - **Schema de Entrada:** `userId`.
   - **Fluxo:** Valida se `userId !== session.user.id`. Se for igual, lança erro de proteção. Se for diferente, exclui o vínculo de `usersToClinicsTable`.

---

## 5. Interface de Usuário & Componentes

```
src/
  app/
    (protected)/
      users/
        page.tsx                           # Página do servidor com proteção de admin
        _components/
          users-view.tsx                   # Visão principal com cabeçalho, busca e tabela
          user-dialog.tsx                  # Modal de criação de novo usuário
          update-role-dialog.tsx           # Modal rápido de alteração de cargo
          user-table-actions.tsx           # Menu de ações de cada linha
```

---

## 6. Critérios de Aceite & Verificação

1. **Proteção:** Usuários logados como `doctor` ou `receptionist` recebem redirecionamento ou acesso negado ao tentar acessar `/users`.
2. **Criação de Usuário:** Administrador consegue cadastrar um novo usuário com cargo específico e a senha digitada permite login imediato.
3. **Remoção Segura:** O Administrador não pode remover o próprio usuário da clínica.
4. **Sidebar:** O item "Usuários" aparece no menu para `admin` com badge ou ícone condizente.
5. **Tipagem:** `npx tsc --noEmit` executa sem nenhum erro em todo o projeto.
