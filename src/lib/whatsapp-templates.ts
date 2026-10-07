import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface AppointmentNotificationData {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  clinicName: string;
  clinicId: string;
  clinicSlug?: string | null;
  appointmentId: string;
  date: Date | string;
  baseUrl?: string;
}

export function formatWhatsAppPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("55")) return clean;
  return `55${clean}`;
}

export function getQuickConfirmUrl(
  data: Pick<AppointmentNotificationData, "clinicId" | "clinicSlug" | "appointmentId" | "baseUrl">,
): string {
  const base = data.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const identifier = data.clinicSlug || data.clinicId;
  return `${base}/agendar/${identifier}/confirmar/${data.appointmentId}`;
}

export function getStatusTrackingUrl(
  data: Pick<AppointmentNotificationData, "clinicId" | "clinicSlug" | "appointmentId" | "baseUrl">,
): string {
  const base = data.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const identifier = data.clinicSlug || data.clinicId;
  return `${base}/agendar/${identifier}/status/${data.appointmentId}`;
}

/**
 * Template 1: Lembrete Anti No-Show (24h antes) com link de confirmação em 1 clique
 */
export function build24hReminderMessage(data: AppointmentNotificationData): string {
  const appointmentDate = new Date(data.date);
  const dateFormatted = format(appointmentDate, "dd/MM/yyyy (EEEE)", {
    locale: ptBR,
  });
  const timeFormatted = format(appointmentDate, "HH:mm", { locale: ptBR });
  const confirmUrl = getQuickConfirmUrl(data);

  return (
    `Olá, *${data.patientName}*! 👋\n\n` +
    `Lembramos da sua consulta amanhã na clínica *${data.clinicName}*:\n\n` +
    `👨‍⚕️ *Profissional:* Dr(a). ${data.doctorName} (${data.doctorSpecialty})\n` +
    `📅 *Data:* ${dateFormatted}\n` +
    `⏰ *Horário:* ${timeFormatted}\n\n` +
    `Para garantir seu horário reservado, por favor *confirme sua presença no link abaixo*:\n` +
    `👉 ${confirmUrl}\n\n` +
    `Caso precise remarcar, entre em contato respondendo esta mensagem.\n` +
    `Atenciosamente,\n*${data.clinicName}*`
  );
}

/**
 * Template 2: Lembrete do Dia (Hoje) com orientações
 */
export function buildTodayReminderMessage(data: AppointmentNotificationData): string {
  const appointmentDate = new Date(data.date);
  const timeFormatted = format(appointmentDate, "HH:mm", { locale: ptBR });
  const confirmUrl = getQuickConfirmUrl(data);

  return (
    `Olá, *${data.patientName}*! Tudo bem? 🩺\n\n` +
    `Lembrando que sua consulta na clínica *${data.clinicName}* é *HOJE* às *${timeFormatted}* com o(a) Dr(a). ${data.doctorName}.\n\n` +
    `Pedimos a gentileza de comparecer com 10 minutos de antecedência.\n\n` +
    `Confirme seu comparecimento:\n` +
    `👉 ${confirmUrl}\n\n` +
    `Te esperamos em breve!`
  );
}

/**
 * Template 3: Confirmação Imediata de Agendamento Aceito
 */
export function buildApprovedAppointmentMessage(data: AppointmentNotificationData): string {
  const appointmentDate = new Date(data.date);
  const dateFormatted = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
  const trackingUrl = getStatusTrackingUrl(data);

  return (
    `Olá, *${data.patientName}*! 🎉\n\n` +
    `Sua consulta na clínica *${data.clinicName}* foi *APROVADA E CONFIRMADA* pela nossa equipe!\n\n` +
    `👨‍⚕️ *Especialista:* Dr(a). ${data.doctorName} (${data.doctorSpecialty})\n` +
    `📅 *Data & Horário:* ${dateFormatted}\n\n` +
    `Você pode consultar os detalhes da consulta a qualquer momento pelo link:\n` +
    `👉 ${trackingUrl}\n\n` +
    `Agradecemos a confiança!\n*${data.clinicName}*`
  );
}
