"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Phone,
  Plus,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { createClinicAdmin } from "@/actions/admin/clinics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface PlanItem {
  id: string;
  name: string;
  price: string;
  maxDoctors: number;
}

interface CreateClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanItem[];
}

export function CreateClinicDialog({
  open,
  onOpenChange,
  plans,
}: CreateClinicDialogProps) {
  const [activeTab, setActiveTab] = useState("empresa");
  const [isLoading, setIsLoading] = useState(false);

  // Dados da Empresa
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");

  // Dados do Responsável
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Plano & Validade
  const [planId, setPlanId] = useState<string>("");
  const [expirationOption, setExpirationOption] = useState<string>("7d");
  const [customDate, setCustomDate] = useState<string>("");
  const [customMaxDoctors, setCustomMaxDoctors] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Auto-seleciona o primeiro plano se disponível
  useEffect(() => {
    if (plans.length > 0 && !planId) {
      setPlanId(plans[0].id);
    }
  }, [plans, planId]);

  // Limpa o formulário quando abre
  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setSlugManuallyEdited(false);
      setWhatsappPhone("");
      setOwnerName("");
      setOwnerEmail("");
      setPassword(generateRandomPassword());
      setShowPassword(false);
      setExpirationOption("7d");
      setCustomDate("");
      setCustomMaxDoctors("");
      setNotes("");
      setActiveTab("empresa");
      if (plans.length > 0) setPlanId(plans[0].id);
    }
  }, [open, plans]);

  // Gera slug automaticamente ao digitar o nome se não editou manualmente
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    const cleaned = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
  };

  function generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res + "@1";
  }

  const handleGenerateNewPassword = () => {
    setPassword(generateRandomPassword());
    toast.info("Nova senha aleatória gerada!");
  };

  const selectedPlan = plans.find((p) => p.id === planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setActiveTab("empresa");
      toast.error("Informe o nome da empresa.");
      return;
    }
    if (!ownerName.trim()) {
      setActiveTab("responsavel");
      toast.error("Informe o nome do responsável.");
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes("@")) {
      setActiveTab("responsavel");
      toast.error("Informe um e-mail válido para o responsável.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setActiveTab("responsavel");
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (expirationOption === "custom_date" && !customDate) {
      setActiveTab("plano");
      toast.error("Selecione a data de validade personalizada.");
      return;
    }

    try {
      setIsLoading(true);

      const parsedMaxDoctors = customMaxDoctors.trim()
        ? parseInt(customMaxDoctors.trim(), 10)
        : null;

      await createClinicAdmin({
        name: name.trim(),
        slug: slug.trim() || null,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password: password.trim(),
        planId: planId || null,
        planStatus:
          expirationOption === "7d"
            ? "trial"
            : expirationOption === "lifetime"
              ? "lifetime"
              : "active",
        expirationOption: expirationOption as any,
        customDate: expirationOption === "custom_date" ? customDate : null,
        customMaxDoctors:
          parsedMaxDoctors !== null && !isNaN(parsedMaxDoctors)
            ? parsedMaxDoctors
            : null,
        whatsappPhone: whatsappPhone.trim() || null,
        notes: notes.trim() || null,
      });

      toast.success(`Empresa "${name}" cadastrada com sucesso!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar empresa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Cadastrar Empresa Manualmente
              </DialogTitle>
              <DialogDescription className="text-xs">
                Adicione uma nova empresa/clínica, configure o usuário administrador e defina o plano de assinatura.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="empresa" className="text-xs gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="responsavel" className="text-xs gap-1.5">
                <User className="w-3.5 h-3.5" />
                Responsável
              </TabsTrigger>
              <TabsTrigger value="plano" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Plano & Validade
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: DADOS DA EMPRESA */}
            <TabsContent value="empresa" className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-clinic-name" className="text-xs font-semibold">
                  Nome da Empresa / Clínica *
                </Label>
                <Input
                  id="create-clinic-name"
                  placeholder="Ex: Clínica Bem Viver, Consultório Dr. Marcos"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-clinic-slug" className="text-xs font-semibold">
                  Link Público de Agendamento (Slug)
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="create-clinic-slug"
                      placeholder="link-exclusivo"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      disabled={isLoading}
                      className="pl-9 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-muted/50 rounded-lg border border-dashed text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Preview do link de agendamento:</span>{" "}
                  <code className="text-primary font-mono font-medium">
                    /agendar/{slug || "link-da-clinica"}
                  </code>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-clinic-phone" className="text-xs font-semibold">
                  Telefone / WhatsApp da Clínica (Opcional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="create-clinic-phone"
                    placeholder="Ex: (11) 99999-8888"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 text-xs"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Usado para notificações automáticas de lembrete aos pacientes.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("responsavel")}
                >
                  Próximo: Responsável →
                </Button>
              </div>
            </TabsContent>

            {/* ABA 2: DADOS DO RESPONSÁVEL */}
            <TabsContent value="responsavel" className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-owner-name" className="text-xs font-semibold">
                  Nome do Responsável / Administrador *
                </Label>
                <Input
                  id="create-owner-name"
                  placeholder="Ex: Dr. Roberto Guimarães"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-owner-email" className="text-xs font-semibold">
                  E-mail de Login *
                </Label>
                <Input
                  id="create-owner-email"
                  type="email"
                  placeholder="roberto@clinica.com.br"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Se o e-mail já existir no sistema, a empresa será vinculada à conta existente como administrador.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-owner-password" className="text-xs font-semibold">
                    Senha Inicial de Acesso *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                    onClick={handleGenerateNewPassword}
                  >
                    <KeyRound className="w-3 h-3 text-primary" />
                    Gerar nova senha
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="create-owner-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10 font-mono text-xs"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Anote ou envie esta senha para o cliente fazer o primeiro login.
                </p>
              </div>

              <div className="pt-2 flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("empresa")}
                >
                  ← Voltar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("plano")}
                >
                  Próximo: Plano & Validade →
                </Button>
              </div>
            </TabsContent>

            {/* ABA 3: PLANO & VALIDADE */}
            <TabsContent value="plano" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Plano SaaS *</Label>
                  <Select value={planId} onValueChange={setPlanId} disabled={isLoading}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} (R$ {p.price}/mês • {p.maxDoctors === 0 ? "Ilimitados" : `${p.maxDoctors} méd.`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Período / Validade Inicial *</Label>
                  <Select
                    value={expirationOption}
                    onValueChange={setExpirationOption}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d" className="text-xs">
                        🎁 7 Dias Grátis (Trial inicial)
                      </SelectItem>
                      <SelectItem value="30d" className="text-xs">
                        📅 30 Dias (Mensal ativo)
                      </SelectItem>
                      <SelectItem value="90d" className="text-xs">
                        📅 90 Dias (Trimestral)
                      </SelectItem>
                      <SelectItem value="1y" className="text-xs">
                        ⭐ 1 Ano (Anual completo)
                      </SelectItem>
                      <SelectItem value="lifetime" className="text-xs">
                        💎 Acesso Vitalício (Sem expiração)
                      </SelectItem>
                      <SelectItem value="custom_date" className="text-xs">
                        📆 Data Personalizada...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {expirationOption === "custom_date" && (
                <div className="space-y-1.5 p-3 rounded-lg border bg-muted/40">
                  <Label htmlFor="create-custom-date" className="text-xs font-semibold">
                    Data de Vencimento Específica
                  </Label>
                  <Input
                    id="create-custom-date"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    disabled={isLoading}
                    className="text-xs"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="create-max-doctors" className="text-xs font-semibold">
                  Limite Especial de Médicos (Opcional)
                </Label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="create-max-doctors"
                    type="number"
                    min="0"
                    placeholder={`Padrão do plano (${selectedPlan?.maxDoctors ?? 3} médicos). Use 0 para ilimitado.`}
                    value={customMaxDoctors}
                    onChange={(e) => setCustomMaxDoctors(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 text-xs"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Deixe vazio para manter o limite natural do plano selecionado.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-notes" className="text-xs font-semibold">
                  Anotações Internas (Visível apenas para Super Admin)
                </Label>
                <Textarea
                  id="create-notes"
                  placeholder="Ex: Fechou plano anual via Pix direto em 15/10. WhatsApp do responsável: ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("responsavel")}
                >
                  ← Voltar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Cadastrar Empresa
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
