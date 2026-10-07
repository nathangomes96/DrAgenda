# Automação de Lembretes & Confirmação Anti No-Show (WhatsApp)

Este documento detalha o sistema de combate ao absenteísmo de consultas (*no-show*) através de mensagens direcionadas de WhatsApp com links de confirmação rápida em 1 clique.

---

## 1. O Problema do No-Show
No setor de saúde privado, a taxa de faltas sem aviso prévio varia habitualmente entre 20% e 35%, gerando perda de faturamento e ociosidade de especialistas. A comunicação ativa e simplificada reduz drasticamente essa perda.

---

## 2. Modelos de Notificação Disponíveis

Os modelos são gerados dinamicamente em `src/lib/whatsapp-templates.ts`:

### 2.1 Modelo 1: Lembrete 24h com Confirmação (Anti No-Show)
- **Quando enviar:** 24 horas antes do horário marcado da consulta.
- **Objetivo:** Garantir a presença do paciente ou liberar a vaga a tempo de remanejar outros pacientes em lista de espera.
- **Conteúdo:** Saudação com nome do paciente, nome da clínica, nome e especialidade do médico, dia da semana, data, hora e link único de confirmação:
  `https://seudominio.com.br/agendar/[slug]/confirmar/[appointmentId]`

### 2.2 Modelo 2: Lembrete do Dia (Hoje)
- **Quando enviar:** Na manhã do dia do atendimento (2 a 4 horas antes).
- **Objetivo:** Reforçar horário e instruir o paciente a chegar com antecedência necessária para preenchimento de ficha de recepção.

### 2.3 Modelo 3: Confirmação Imediata de Agendamento
- **Quando enviar:** No momento em que a recepcionista aceita a solicitação de agendamento online.
- **Objetivo:** Notificar o paciente instantaneamente que a vaga dele foi garantida, com link para acompanhamento em tempo real.

---

## 3. Página de Confirmação Rápida em 1 Clique

- **Rota:** `/agendar/[clinicId]/confirmar/[appointmentId]`
- **Comportamento Mobile-First:**
  - Carrega em menos de 1 segundo em qualquer smartphone;
  - Não exige login nem senha do paciente;
  - Exibe resumo do médico, data, hora e endereço da clínica;
  - Botão principal: **"Sim, Eu Vou Comparecer!"** -> atualiza o agendamento para `confirmed` instantaneamente no banco de dados e notifica a equipe da recepção;
  - Botão secundário: **"Não poderei comparecer / Cancelar"** -> atualiza o status para `cancelled` e disponibiliza botão para escolher novo horário.
