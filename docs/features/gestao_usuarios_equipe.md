# Módulo: Gestão de Usuários & Equipe com Controle de Acesso (RBAC)

**Data de Implementação:** 02/10/2026  
**Status:** 100% Concluído e em Produção  
**Rota:** `/users` (restrita para o papel `admin`)

---

## 1. Visão Geral

O módulo de **Gestão de Usuários & Equipe** permite que os administradores da clínica gerenciem todos os colaboradores que possuem acesso ao sistema. O administrador pode cadastrar novos colaboradores diretamente, alterar seus níveis de acesso e revogar acessos quando necessário.

---

## 2. Níveis de Acesso (RBAC) e Permissões

Cada membro cadastrado na clínica possui um papel definido na tabela `users_to_clinics`:

| Papel (`role`) | Rótulo Visual | Acesso Permitido | Restrições |
|---|---|---|---|
| `admin` | **👑 Administrador** | Dashboard financeiro, Agendamentos, Médicos, Pacientes, Usuários & Equipe, Configurações da Clínica, Conexão WhatsApp e Assinatura | Nenhuma |
| `doctor` | **🩺 Médico** | Agendamentos da sua agenda, Pacientes e Prontuário Eletrônico do Paciente (EHR com histórico, queixas e prescrições) | Sem acesso a faturamento, médicos, gestão de usuários e configurações |
| `receptionist` | **📋 Recepção** | Agendamentos gerais e cadastro de pacientes | Sem acesso a prontuários médicos (LGPD/CFM), médicos, usuários e dashboard financeiro |

---

## 3. Fluxo de Cadastro de Novos Usuários

1. **Entrada de Dados:**
   - **Nome Completo:** Nome do colaborador.
   - **E-mail:** E-mail válido que será utilizado como login no sistema.
   - **Senha Provisória:** O administrador pode digitar uma senha ou clicar em *"Gerar senha"* para gerar uma credencial forte e aleatória.
   - **Cargo:** Seleção entre Administrador, Médico e Recepcionista com descrições em tela.

2. **Criptografia & Segurança:**
   - As senhas são processadas pela função criptográfica nativa do Better Auth (`hashPassword` de `better-auth/crypto`), gravando o hash seguro na tabela `accounts`.
   - O novo colaborador pode fazer login imediatamente com seu e-mail e senha na tela de login (`/authentication`).
   - Se o e-mail já existir na base geral de usuários, o sistema apenas adiciona o vínculo com a clínica atual sem redefinir a conta do usuário.

3. **Trava de Autoexclusão:**
   - O Administrador logado é impedido de remover a si mesmo da clínica e de rebaixar seu próprio papel para não administrador, garantindo que a clínica nunca fique sem gestão.

---

## 4. Estrutura de Arquivos

```
src/
  actions/
    users/
      schema.ts                 # Validações Zod (criação, edição e remoção)
      index.ts                  # Server Actions protegidas (createClinicUserAction, updateUserRoleAction, removeUserFromClinicAction)
  data/
    get-clinic-users.ts         # Query Drizzle trazendo membros vinculados à clínica
  app/
    (protected)/
      users/
        page.tsx                # Server Component com validateAuthentication({ allowedRoles: ["admin"] })
        _components/
          user-dialog.tsx       # Modal com formulário de cadastro de usuário
          user-table-actions.tsx# Menu de ações (alterar cargo e remover da clínica)
          users-view.tsx        # Tabela com busca, badges e cabeçalho
      _components/
        app-sidebar.tsx         # Item "Usuários" condicional para o papel "admin"
```

---

## 5. Verificação e Testes

- **Compilação:** `npx tsc --noEmit` validado com **0 erros**.
- **Proteção de Rota:** Tentativas de acesso não autenticadas a `/users` são redirecionadas para `/authentication` (HTTP 307).
- **Proteção de Papel:** Usuários com papel diferente de `admin` são bloqueados pelo HOC `validateAuthentication`.
