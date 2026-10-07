# Prontuário Eletrônico do Paciente (EHR) e Conformidade LGPD

Este documento descreve o funcionamento do módulo de Prontuário Eletrônico e as salvaguardas técnicas adotadas em estrita observância à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e às resoluções do Conselho Federal de Medicina (CFM).

---

## 1. Fundamentação Jurídica e Normativa

### 1.1 LGPD - Dados Pessoais Sensíveis
Conforme o **Art. 5º, inciso II da LGPD**, dados referentes à saúde são classificados como **dados pessoais sensíveis**.
O tratamento desses dados no Doutor Agenda ocorre com fundamento no:
- **Art. 7º, inciso VIII e Art. 11, inciso II, alínea 'f' da LGPD:** Tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária.

### 1.2 Sigilo Médico e Código de Ética (CFM)
- O sigilo sobre a anamnese, hipóteses diagnósticas, receituários e condutas clínicas é inviolável.
- **Recepcionistas e atendentes administrativos NÃO têm autorização para ler ou modificar evoluções clínicas.**
- O acesso a esse módulo no sistema é estritamente condicionado ao papel de `doctor` (médico) ou `admin` (diretor clínico).

---

## 2. Estrutura Técnica do Prontuário

O prontuário é persistido na tabela `medical_records`:

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identificador único do registro clínico. |
| `clinic_id` | UUID (FK) | Vínculo multitenant com a clínica. |
| `patient_id` | UUID (FK) | Paciente titular dos dados clínicos. |
| `doctor_id` | UUID (FK) | Médico responsável pela evolução. |
| `appointment_id` | UUID (FK) | Consulta associada (opcional). |
| `symptoms` | TEXT | Queixa principal relatada e anamnese. |
| `diagnosis` | TEXT | Hipótese diagnóstica ou código CID-10. |
| `prescription` | TEXT | Prescrição médica e posologia. |
| `treatment_plan` | TEXT | Conduta, recomendações e exames. |
| `notes` | TEXT | Evolução clínica detalhada e notas confidenciais. |
| `created_at` | TIMESTAMP | Data e hora exatas do registro para auditoria. |
| `updated_at` | TIMESTAMP | Registro de modificações. |

---

## 3. Fluxo de Operação do Médico

1. O médico acessa o menu **Pacientes & Prontuários** (`/patients`).
2. Localiza o paciente e clica no botão dedicado **"Prontuário"** ou no menu de ações do paciente.
3. O modal protegido abre diretamente na aba **Histórico Clínico**, apresentando uma linha do tempo cronológica com:
   - Data e horário do atendimento formatados;
   - Nome e especialidade do médico assistente;
   - Badges de diagnóstico / CID;
   - Detalhes de prescrições e conduta;
   - Notas confidenciais protegidas.
4. Para realizar um novo atendimento, clica na aba **Nova Evolução / Atendimento**:
   - Seleciona o médico responsável;
   - Preenche queixa, diagnóstico, prescrição, conduta e notas;
   - Clica em **"Salvar no Prontuário"**.
5. O registro é persistido de forma imediata e auditável, atualizando a linha do tempo do paciente.

---

## 4. Medidas de Segurança Implementadas
1. **Validação de Role no Backend:** A Server Action `createMedicalRecord` e `getPatientMedicalRecords` utilizam `protectedWithRoleActionClient(["admin", "doctor"])`. Mesmo que uma requisição seja forjada no frontend, o backend rejeita qualquer usuário com papel de `receptionist`.
2. **Validação Cruzada de Clínica:** O backend valida que o paciente e o médico pertencem obrigatoriamente à mesma `clinic_id` do usuário autenticado, impedindo vazamentos cross-tenant.
