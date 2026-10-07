/**
 * Gera um código curto, legível e amigável para consultas/agendamentos.
 * Formato padrão: AG-XXXXX (onde XXXXX são 5 dígitos numéricos fáceis de ditar ou memorizar)
 * Exemplo: AG-48920
 */
export function generateAppointmentCode(): string {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `AG-${digits}`;
}

/**
 * Normaliza o termo de busca informado pelo paciente ou atendente.
 * Se o paciente digitar apenas "48920" ou "ag-48920" ou "ag48920",
 * converte para as variantes pesquisáveis.
 */
export function normalizeAppointmentCodeQuery(input: string): {
  raw: string;
  upper: string;
  withPrefix?: string;
} {
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  const digitsOnly = trimmed.replace(/\D/g, "");

  let withPrefix: string | undefined = undefined;
  if (digitsOnly.length >= 4 && digitsOnly.length <= 6 && !upper.startsWith("AG-")) {
    withPrefix = `AG-${digitsOnly}`;
  } else if (upper.startsWith("AG") && !upper.startsWith("AG-")) {
    withPrefix = `AG-${upper.slice(2)}`;
  }

  return {
    raw: trimmed,
    upper,
    withPrefix,
  };
}
