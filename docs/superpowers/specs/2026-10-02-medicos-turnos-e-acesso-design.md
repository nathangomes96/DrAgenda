# Especificação Técnica: Cadastro de Médicos com Acesso ao Sistema, Turnos e Dias da Semana

**Data:** 02/10/2026  
**Status:** Aprovado em Brainstorming  
**Autor:** Antigravity (Pair Programming com Usuário)

---

## 1. Visão Geral & Objetivos

Evoluir o módulo de cadastro e gestão de médicos (`/doctors`) para:
1. **Organização em Abas:** Eliminar a sobrecarga visual do formulário atual, dividindo-o em duas abas intuitivas: *Perfil & Acesso* e *Atendimento & Horários*.
2. **Criação Integrada de Acesso:** Permitir ao administrador definir o e-mail e a senha do médico diretamente no formulário, criando automaticamente a conta com papel `doctor` no sistema para que o médico possa logar, visualizar sua agenda e consultar prontuários.
3. **Seleção Flexível de Dias da Semana:** Substituir o intervalo rígido por botões/chips individuais para cada dia da semana (`Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sáb`, `Dom`) com atalhos rápidos (*Seg a Sex*).
4. **Seleção de Turnos:** Disponibilizar botões rápidos de turnos:
   - ☀️ **Manhã:** 08:00 às 12:00
   - 🌤️ **Tarde:** 13:00 às 18:00
   - 🕒 **Dia Todo (Manhã & Tarde):** 08:00 às 18:00
   - ⚙️ **Personalizado:** Permite digitar horários customizados de início e fim.

---

## 2. Modelagem de Dados

### Tabela `doctors` (Novas Colunas)
- `email`: `text` (e-mail de contato e login do médico)
- `userId`: `text` (chave estrangeira referenciando `users.id` com `onDelete: set null`)
- `shift`: `text` (enum: `"morning"`, `"afternoon"`, `"all_day"`, `"custom"`, default: `"all_day"`)
- `availableDays`: `jsonb` (array de inteiros representando os dias da semana atendidos: `0` = Domingo, `1` = Segunda ... `6` = Sábado, default: `[1, 2, 3, 4, 5]`)

### Compatibilidade Retroativa (Cálculo de Slots)
Em `src/actions/get-available-times/` e `src/actions/get-public-available-times/`:
```ts
const doctorIsAvailable = doctor.availableDays?.length
  ? doctor.availableDays.includes(selectedDayOfWeek)
  : (selectedDayOfWeek >= doctor.availableFromWeekDay && selectedDayOfWeek <= doctor.availableToWeekDay);
```

---

## 3. Server Action `upsertDoctor`

- **Schema de Entrada (`schema.ts`):**
  - `id`: uuid opcional (para edição)
  - `name`: string obrigatória
  - `specialty`: string obrigatória
  - `email`: string opcional (formato e-mail)
  - `password`: string opcional (mínimo 6 caracteres se preenchida)
  - `appointmentPrice`: número positivo
  - `shift`: `"morning" | "afternoon" | "all_day" | "custom"`
  - `availableDays`: array de números `[1, 2, 3, 4, 5]`
  - `availableFromTime`: string HH:mm
  - `availableToTime`: string HH:mm
- **Fluxo de Acesso do Usuário:**
  - Se `email` for informado:
    - Verifica se o usuário já existe na tabela `users`.
    - Se não existir e houver `password`, cria o usuário em `usersTable`, gera o hash com `hashPassword` de `better-auth/crypto` em `accountsTable`, e vincula à clínica com papel `doctor` em `usersToClinicsTable`.
    - Associa o `userId` do novo usuário na coluna `userId` do médico.

---

## 4. Interface do Usuário

1. **`upsert-doctor-form.tsx`:**
   - Tabs:
     - **Aba 1: Perfil & Acesso**
       - Nome Completo
       - Especialidade
       - E-mail de Login
       - Senha Provisória (com toggle de visualização 👁️ e botão *"Gerar senha"*)
     - **Aba 2: Atendimento, Turnos & Horários**
       - Valor da Consulta (R$)
       - Seleção de Dias: Chips clicáveis `[Seg]` `[Ter]` `[Qua]` `[Qui]` `[Sex]` `[Sáb]` `[Dom]` e atalho *"Seg a Sex"*
       - Seleção de Turno: Cards ou botões de rádio para *Manhã*, *Tarde*, *Dia Todo* e *Personalizado*.
2. **`doctor-card.tsx`:**
   - Exibição de e-mail do médico, turno de atendimento e badge de dias atendidos.

---

## 5. Critérios de Aceite

1. **Organização:** O formulário de médico deve carregar em abas com visual moderno, sem poluição.
2. **Acesso do Médico:** Ao cadastrar o médico com e-mail e senha, o usuário é gerado com papel `doctor` e consegue logar no sistema.
3. **Turnos e Dias:** O médico configurado para atendimento no turno da tarde (13h-18h) só exibe horários da tarde no agendamento público e no agendamento interno.
4. **Tipagem:** `npx tsc --noEmit` executa sem nenhum erro.
