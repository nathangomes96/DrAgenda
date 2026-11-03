"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageCircle,
  Save,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { updateClinicAiAgentAction } from "@/actions/ai-agent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ClinicData {
  id: string;
  name: string;
  whatsappStatus: "connected" | "disconnected" | "connecting" | null;
  whatsappInstanceName: string | null;
  aiAgentEnabled: boolean;
  aiAgentActive: boolean;
  aiAssistantName: string | null;
  aiCustomInstructions: string | null;
  aiAllowBooking: boolean;
  aiAllowCancelOrConfirm: boolean;
}

interface AiAgentSettingsViewProps {
  clinic: ClinicData;
}

export function AiAgentSettingsView({ clinic }: AiAgentSettingsViewProps) {
  const isEnabled = clinic.aiAgentEnabled;

  // Estados do formulário
  const [aiAgentActive, setAiAgentActive] = useState(clinic.aiAgentActive ?? false);
  const [aiAssistantName, setAiAssistantName] = useState(
    clinic.aiAssistantName || "Sofia",
  );
  const [aiCustomInstructions, setAiCustomInstructions] = useState(
    clinic.aiCustomInstructions || "",
  );
  const [aiAllowBooking, setAiAllowBooking] = useState(
    clinic.aiAllowBooking ?? true,
  );
  const [aiAllowCancelOrConfirm, setAiAllowCancelOrConfirm] = useState(
    clinic.aiAllowCancelOrConfirm ?? true,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiAssistantName.trim()) {
      toast.error("Por favor, informe o nome da secretária virtual.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateClinicAiAgentAction({
        aiAgentActive,
        aiAssistantName: aiAssistantName.trim(),
        aiCustomInstructions: aiCustomInstructions.trim() || null,
        aiAllowBooking,
        aiAllowCancelOrConfirm,
      });

      if (res?.data?.success) {
        toast.success(res.data.message);
      } else {
        toast.error("Erro ao salvar configurações.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar configurações da IA.");
    } finally {
      setIsSaving(false);
    }
  };

  // 1. CASO O MÓDULO PAGO NÃO ESTEJA LIBERADO PELO SUPERADMIN
  if (!isEnabled) {
    return (
      <div className="max-w-4xl space-y-6">
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-card to-background shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-primary" />
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1.5 px-2.5 py-1 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Módulo Adicional Exclusivo
              </Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400 shrink-0" />
              Ative a Secretária IA 24h no WhatsApp da sua clínica
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
              Elimine o tempo de espera dos seus pacientes. Nossa inteligência artificial conectada ao WhatsApp da sua clínica atende com empatia, responde dúvidas frequentes, consulta horários livres e realiza agendamentos automáticos 24 horas por dia.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Grade de Vantagens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/60">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Atendimento Instantâneo 24/7
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pacientes que mandam mensagem à noite ou no final de semana recebem resposta imediata e agendam na hora.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/60">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Agendamento Direto no Sistema
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A IA consulta a agenda dos médicos em tempo real e marca a consulta com código localizador seguro.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/60">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Confirmações e Cancelamentos
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O paciente pode verificar suas consultas agendadas, confirmar presença ou desmarcar com segurança.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border bg-card/60">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    Tira-Dúvidas Personalizado
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Instrua a IA sobre convênios aceitos, endereço, estacionamento, formas de pagamento e preparo para exames.
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso de contratação */}
            <div className="p-4 rounded-xl border border-dashed bg-muted/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">
                    Módulo sob demanda para sua clínica
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicite a ativação com nosso time comercial e comece a usar no mesmo dia.
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm shrink-0"
              >
                <a
                  href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20ativar%20o%20m%C3%B3dulo%20Secret%C3%A1ria%20IA%20no%20meu%20Doutor%20Agenda!"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar com o Suporte e Contratar
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. CASO O MÓDULO ESTEJA HABILITADO PELO SUPERADMIN
  return (
    <div className="max-w-4xl space-y-6">
      {/* Alerta de WhatsApp Desconectado */}
      {clinic.whatsappStatus !== "connected" && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-xs font-medium">
              O WhatsApp da sua clínica ainda não está conectado via QR Code. Para a Secretária IA responder mensagens, conecte seu número na aba do WhatsApp.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-500/40 shrink-0 text-xs gap-1.5">
            <Link href="/settings/whatsapp">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              Conectar WhatsApp
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Principal: Chave Liga/Desliga */}
        <Card className="border-purple-500/20 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    Atendimento IA no WhatsApp
                    {aiAgentActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Ativo & Respondendo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Pausado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ligue ou desligue o atendimento automático da sua secretária virtual a qualquer momento.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border">
                <Label htmlFor="ai-active-toggle" className="text-xs font-semibold cursor-pointer">
                  {aiAgentActive ? "IA Ligada" : "IA Desligada"}
                </Label>
                <Switch
                  id="ai-active-toggle"
                  checked={aiAgentActive}
                  onCheckedChange={setAiAgentActive}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card de Configurações da Secretária */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              Identidade e Regras da Secretária Virtual
            </CardTitle>
            <CardDescription className="text-xs">
              Defina como ela deve se apresentar aos pacientes e quais instruções da clínica ela deve seguir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Nome da Secretária */}
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="assistant-name" className="text-xs font-semibold">
                Nome da Secretária Virtual *
              </Label>
              <Input
                id="assistant-name"
                placeholder="Ex: Sofia, Amanda, Mariana, Dra. Virtual..."
                value={aiAssistantName}
                onChange={(e) => setAiAssistantName(e.target.value)}
                disabled={isSaving}
                className="text-sm h-10"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Ela se apresentará com este nome nas primeiras saudações com o paciente.
              </p>
            </div>

            {/* Instruções Personalizadas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-instructions" className="text-xs font-semibold">
                  Informações e Regras da Clínica (Instruções Livres)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Alimente a IA com detalhes da clínica
                </span>
              </div>
              <Textarea
                id="custom-instructions"
                rows={6}
                placeholder={`Escreva em tópicos as regras que a secretária virtual deve saber. Exemplo:
- Endereço: Av. Paulista, 1000 - Sala 402 (próximo ao metrô Trianon-Masp).
- Estacionamento: Convênio com o ParkEstapar no subsolo do prédio.
- Convênios atendidos: Unimed, Bradesco Saúde, Amil e SulAmérica. Para outros convênios, emitimos nota para reembolso.
- Formas de pagamento: Pix, Cartão de Crédito e Débito. Não aceitamos cheques.
- Avisos de preparo: Para exames de ultrassom de abdome, o paciente deve estar em jejum de 8 horas.`}
                value={aiCustomInstructions}
                onChange={(e) => setAiCustomInstructions(e.target.value)}
                disabled={isSaving}
                className="text-xs leading-relaxed font-sans"
              />
              <p className="text-[11px] text-muted-foreground">
                Quanto mais claro você descrever as dúvidas frequentes da sua clínica, mais precisa e humana será a resposta da IA.
              </p>
            </div>

            {/* Permissões de Ação */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Permissões de Ação no Sistema
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start justify-between p-3.5 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5 pr-3">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <CalendarPlus className="w-4 h-4 text-primary" />
                      <span>Agendar Novas Consultas</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Permite que a IA consulte a agenda médica e marque novas consultas diretamente no DrAgenda.
                    </p>
                  </div>
                  <Switch
                    checked={aiAllowBooking}
                    onCheckedChange={setAiAllowBooking}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-start justify-between p-3.5 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5 pr-3">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Confirmar ou Cancelar</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Permite que o paciente confirme presença ou solicite cancelamento de sua consulta pelo WhatsApp.
                    </p>
                  </div>
                  <Switch
                    checked={aiAllowCancelOrConfirm}
                    onCheckedChange={setAiAllowCancelOrConfirm}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-4 border-t flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando Alterações...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Configurações da IA
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
