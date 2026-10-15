/**
 * Utilitário para verificar se um usuário possui privilégios de Super Administrador do SaaS.
 * O Super Admin tem acesso às telas de gestão de empresas, planos e pagamentos.
 */
export function checkIsSuperAdmin(user?: {
  id?: string;
  email?: string | null;
  isSuperAdmin?: boolean | null;
}): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  if (
    process.env.SUPERADMIN_EMAIL &&
    user.email &&
    user.email.toLowerCase().trim() === process.env.SUPERADMIN_EMAIL.toLowerCase().trim()
  ) {
    return true;
  }
  return false;
}
