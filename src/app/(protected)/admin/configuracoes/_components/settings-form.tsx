"use client";

import { useState } from "react";
import { Check, CreditCard, DollarSign, Globe, Loader2, MessageSquare, QrCode, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  type UpdatePlatformSettingsInput,
  updatePlatformSettings,
} from "@/actions/admin/platform-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsFormProps {
  initialSettings: {
    trialDays: number;
    pixEnabled: boolean;
    pixKey: string | null;
    pixKeyType: string | null;
    pixReceiverName: string | null;
    pixWhatsappNumber: string | null;
    mercadopagoEnabled: boolean;
    mercadopagoUrl: string | null;
    stripeEnabled: boolean;
    stripeUrl: string | null;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdatePlatformSettingsInput>({
    trialDays: initialSettings.trialDays || 7,
    pixEnabled: initialSettings.pixEnabled ?? true,
    pixKey: initialSettings.pixKey || "",
    pixKeyType: initialSettings.pixKeyType || "CNPJ",
    pixReceiverName: initialSettings.pixReceiverName || "",
    pixWhatsappNumber: initialSettings.pixWhatsappNumber || "",
    mercadopagoEnabled: initialSettings.mercadopagoEnabled ?? false,
    mercadopagoUrl: initialSettings.mercadopagoUrl || "",
    stripeEnabled: initialSettings.stripeEnabled ?? false,
    stripeUrl: initialSettings.stripeUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updatePlatformSettings({
        ...formData,
        trialDays: Number(formData.trialDays) || 7,
      });
      toast.success("Configurações do SaaS salvas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Bloco 1: Período de Teste Gratuito */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Período de Teste Gratuito (Trial)</CardTitle>
          </div>
          <CardDescription>
            Defina quantos dias de acesso completo sem cobrança uma nova empresa ganha ao se cadastrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="trialDays">Dias de Teste Inicial</Label>
            <div className="flex items-center gap-2">
              <Input
                id="trialDays"
                type="number"
                min={1}
                max={90}
                value={formData.trialDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    trialDays: Number(e.target.value),
                  }))
                }
                required
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Toda nova clínica terá a data de expiração calculada a partir deste valor.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bloco 2: Pix Direto + WhatsApp */}
      <Card className={formData.pixEnabled ? "border-emerald-500/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <CardTitle>Pagamento via Pix Direto (WhatsApp)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="pixEnabled" className="text-sm font-normal">
                {formData.pixEnabled ? "Habilitado" : "Desabilitado"}
              </Label>
              <Switch
                id="pixEnabled"
                checked={formData.pixEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, pixEnabled: checked }))
                }
              />
            </div>
          </div>
          <CardDescription>
            Permite que o cliente pague transferindo diretamente para o seu Pix e envie o comprovante no seu WhatsApp para você ativar em 1 clique.
          </CardDescription>
        </CardHeader>
        {formData.pixEnabled && (
          <CardContent className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pixKeyType">Tipo de Chave</Label>
                <Select
                  value={formData.pixKeyType || "CNPJ"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, pixKeyType: val }))
                  }
                >
                  <SelectTrigger id="pixKeyType" className="mt-1">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="Telefone">Celular / Telefone</SelectItem>
                    <SelectItem value="Email">E-mail</SelectItem>
                    <SelectItem value="Aleatoria">Chave Aleatória (EVP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="pixKey">Chave Pix</Label>
                <Input
                  id="pixKey"
                  placeholder="Ex: 12.345.678/0001-90 ou seu@email.com"
                  className="mt-1"
                  value={formData.pixKey || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pixKey: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pixReceiverName">Nome do Titular / Razão Social</Label>
                <Input
                  id="pixReceiverName"
                  placeholder="Ex: Nathan Gomes / Doutor Agenda Tecnologia"
                  className="mt-1"
                  value={formData.pixReceiverName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pixReceiverName: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="pixWhatsappNumber">
                  WhatsApp para Envio de Comprovante (com DDD)
                </Label>
                <Input
                  id="pixWhatsappNumber"
                  placeholder="Ex: 5511999999999"
                  className="mt-1"
                  value={formData.pixWhatsappNumber || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pixWhatsappNumber: e.target.value,
                    }))
                  }
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  O cliente verá um botão direto "Enviar Comprovante no WhatsApp".
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bloco 3: Mercado Pago */}
      <Card className={formData.mercadopagoEnabled ? "border-blue-500/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <CardTitle>Mercado Pago</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="mercadopagoEnabled" className="text-sm font-normal">
                {formData.mercadopagoEnabled ? "Habilitado" : "Desabilitado"}
              </Label>
              <Switch
                id="mercadopagoEnabled"
                checked={formData.mercadopagoEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    mercadopagoEnabled: checked,
                  }))
                }
              />
            </div>
          </div>
          <CardDescription>
            Exibe o botão de pagamento redirecionando para seu link de checkout do Mercado Pago.
          </CardDescription>
        </CardHeader>
        {formData.mercadopagoEnabled && (
          <CardContent className="space-y-4 pt-2 border-t">
            <div>
              <Label htmlFor="mercadopagoUrl">Link de Pagamento / Checkout do Mercado Pago</Label>
              <Input
                id="mercadopagoUrl"
                placeholder="https://mpago.la/..."
                className="mt-1"
                value={formData.mercadopagoUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mercadopagoUrl: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bloco 4: Stripe */}
      <Card className={formData.stripeEnabled ? "border-indigo-500/40" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <CardTitle>Stripe (Cartão de Crédito Internacional)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="stripeEnabled" className="text-sm font-normal">
                {formData.stripeEnabled ? "Habilitado" : "Desabilitado"}
              </Label>
              <Switch
                id="stripeEnabled"
                checked={formData.stripeEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    stripeEnabled: checked,
                  }))
                }
              />
            </div>
          </div>
          <CardDescription>
            Exibe o botão de pagamento via Stripe Checkout para cartões de crédito.
          </CardDescription>
        </CardHeader>
        {formData.stripeEnabled && (
          <CardContent className="space-y-4 pt-2 border-t">
            <div>
              <Label htmlFor="stripeUrl">Link de Checkout / Payment Link do Stripe</Label>
              <Input
                id="stripeUrl"
                placeholder="https://buy.stripe.com/..."
                className="mt-1"
                value={formData.stripeUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stripeUrl: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading} className="gap-2 px-6">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações do SaaS
        </Button>
      </div>
    </form>
  );
}
