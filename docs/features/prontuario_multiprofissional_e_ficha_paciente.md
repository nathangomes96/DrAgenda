# Prontuário Multiprofissional, Ficha do Paciente e Privacidade por Médico

Este módulo estabelece um fluxo completo e seguro para clínicas médicas, consultórios odontológicos e centros multiprofissionais no Brasil.

---

## 1. Ficha Completa do Paciente (`/patients`)

Cadastro e edição organizados em 4 abas completas:

### 1.1 Identificação & Contato
- **Nome Completo**
- **CPF** com máscara de validação (`000.000.000-00`)
- **Data de Nascimento** (com cálculo automático de idade)
- **Sexo Biológico**
- **Tipo Sanguíneo** (O+, O-, A+, A-, B+, B-, AB+, AB-)
- **Telefone / WhatsApp** com máscara
- **E-mail**

### 1.2 Saúde & Alergias (Atenção Crítica)
- ⚠️ **Alergias Conhecidas:** exibidas em destaque vermelho no topo do prontuário e na tabela de pacientes (evita prescrições de risco a Penicilina, Dipirona, AINEs, Anestésicos, Látex, etc.).
- **Histórico Clínico / Comorbidades:** Hipertensão, Diabetes tipo 2, Cardiopatia, Gestante, Asma.
- **Medicamentos de Uso Contínuo:** nomes e posologias dos medicamentos regulares.

### 1.3 Convênio & Contato de Emergência
- **Plano de Saúde:** Particular ou Convênio (Unimed, Bradesco, Amil, etc.) e Nº da Carteirinha.
- **Contato de Emergência:** Nome do contato, telefone e parentesco/relação.

### 1.4 Endereço Completo
- **CEP**, Logradouro, Número, Complemento, Bairro, Cidade e Estado (UF).

---

## 2. Prontuário Eletrônico Multiprofissional (`medical-record-dialog.tsx`)

- 🛡️ **Banner Superior Fixo:** Paciente, idade calculada, sexo, tipo sanguíneo, convênio e **Card de Alergias em Vermelho Vivo**.
- 📋 **Aba 1: Linha do Tempo / Histórico Clínico:** histórico completo de atendimentos com filtros por tipo (**Todos**, **Médico** 🩺, **Odonto** 🦷 e **Geral** 📋), exibição de sinais vitais, dentes tratados, procedimentos realizados e botão **"Copiar Prescrição"** em 1 clique.
- ➕ **Aba 2: Novo Atendimento:**
  - 🩺 **Consulta Médica / Geral:** Sinais vitais (PA, FC, Temperatura, Peso, Altura e cálculo de IMC automático), Anamnese, CID-10, Prescrição e Conduta.
  - 🦷 **Atendimento Odontológico:** Queixa odontológica, Dente(s)/Arcada/Região, Procedimento Realizado, Anestésico e Materiais Utilizados, Orientações Pós-Operatórias e Prescrição Odontológica.
  - 📋 **Multiprofissional:** Avaliação, conduta e orientações para fisioterapeutas, psicólogos e nutricionistas.
- 🩺 **Aba 3: Ficha de Saúde (Atualização Rápida):** Atualização instantânea de alergias e remédios contínuos sem fechar o prontuário.

---

## 3. Isolamento e Privacidade de Consultas (Agenda por Médico)

Em estrita conformidade com as regras de sigilo profissional e solicitação do gestor:
- **Médico logado:**
  - Na página de **Agendamentos** (`/appointments`): visualiza **exclusivamente as suas próprias consultas** agendadas. Não vê os pacientes nem os horários dos outros médicos da clínica.
  - Na página de **Pacientes** (`/patients`): visualiza **apenas os pacientes que estão sob seus cuidados** (que possuem consulta marcada ou prontuário registrado com ele).
- **Administrador & Recepção:**
  - Visualizam a agenda completa de todos os médicos para gerenciamento, aprovação de horários e remarcações.

---

## 4. Cadastro de Profissionais com Login Direto (`/doctors`)

O modal de cadastro de profissionais agora conta com 3 abas:
1. **Dados & Preço:** Nome, **Registro Profissional (CRM, CRO, CRP com UF)**, Especialidade (médica, odontológica ou terapia), Telefone/WhatsApp, Preço da Consulta formatado em R$ e Biografia/Apresentação.
2. **Acesso & Login:** Permite marcar "Habilitar acesso ao sistema com E-mail e Senha", definir a senha (com gerador automático de senha segura) e já cria o usuário com papel `doctor` vinculado à clínica.
3. **Dias & Turnos:** Seleção rápida de turnos com botões (**Manhã: 08h-12h**, **Tarde: 13h-18h**, **Dia Todo: 08h-18h**, **Noite: 18h-22h** ou **Personalizado**) e seleção de dias da semana.
