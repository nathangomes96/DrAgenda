"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  QrCode,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  updateWhatsAppConfig,
} from "@/actions/whatsapp";
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
import { clinicsTable } from "@/db/schema";

interface WhatsAppSettingsViewProps {
  clinic: typeof clinicsTable.$inferSelect;
  userRole?: string;
  hasEnvConfig: boolean;
}

export function WhatsAppSettingsView({
  clinic,
  userRole = "admin",
  hasEnvConfig,
}: WhatsAppSettingsViewProps) {
  const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">(
    (clinic.whatsappStatus as any) || "disconnected",
  );
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState(
    clinic.whatsappInstanceName || clinic.slug || `clinica-${clinic.id.slice(0, 6)}`,
  );
  const [apiUrl, setApiUrl] = useState(clinic.whatsappApiUrl || "");
  const [apiKey, setApiKey] = useState(clinic.whatsappApiKey || "");

  // Action: Consulta status
  const getStatusAction = useAction(getWhatsAppStatus, {
    onSuccess: ({ data }) => {
      if (data?.isConnected) {
        setStatus("connected");
        setQrCodeBase64(null);
      } else if (data?.state === "connecting") {
        setStatus("connecting");
      } else {
        setStatus("disconnected");
      }
    },
  });

  // Action: Conectar e gerar QR Code
  const connectAction = useAction(connectWhatsApp, {
    onSuccess: ({ data }) => {
      if (data?.base64) {
        setQrCodeBase64(data.base64);
        setStatus("connecting");
        toast.info("Aponte a câmera do seu WhatsApp para o QR Code abaixo.");
      } else {
        toast.warning("Instância conectando, verifique o status em instantes.");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao conectar com a Evolution API.");
    },
  });

  // Action: Desconectar
  const disconnectAction = useAction(disconnectWhatsApp, {
    onSuccess: () => {
      setStatus("disconnected");
      setQrCodeBase64(null);
      toast.success("WhatsApp desconectado com sucesso.");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao desconectar WhatsApp.");
    },
  });

  // Action: Salvar configurações
  const updateConfigAction = useAction(updateWhatsAppConfig, {
    onSuccess: () => {
      toast.success("Configurações da Evolution API salvas!");
      getStatusAction.execute({});
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao salvar configurações.");
    },
  });

  // Checa status ao carregar
  useEffect(() => {
    getStatusAction.execute({});
  }, []);

  // Polling a cada 4 segundos quando o QR Code estiver visível na tela
  useEffect(() => {
    if (status !== "connecting" && !qrCodeBase64) return;

    const interval = setInterval(() => {
      getStatusAction.execute({});
    }, 4000);

    return () => clearInterval(interval);
  }, [status, qrCodeBase64]);

  const handleConnect = () => {
    connectAction.execute({});
  };

  const handleDisconnect = () => {
    if (confirm("Deseja realmente desconectar o WhatsApp desta clínica?")) {
      disconnectAction.execute({});
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigAction.execute({
      whatsappApiUrl: apiUrl,
      whatsappApiKey: apiKey,
      whatsappInstanceName: instanceName,
    });
  };

  const isAdmin = userRole === "admin";

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL: CONEXÃO E QR CODE */}
      <Card className="border-2 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/40 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-11 items-center justify-center rounded-xl text-white shadow-md ${
                  status === "connected"
                    ? "bg-emerald-600"
                    : status === "connecting"
                    ? "bg-amber-500"
                    : "bg-slate-700"
                }`}
              >
                <MessageCircle className="size-6" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Conexão WhatsApp (Evolution API)</span>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-0.5 font-bold ${
                      status === "connected"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : status === "connecting"
                        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "connected" ? (
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Conectado
                      </span>
                    ) : status === "connecting" ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin" />
                        Aguardando Leitura
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <WifiOff className="size-3" />
                        Desconectado
                      </span>
                    )}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Instância: <strong className="font-mono">{instanceName}</strong>
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => getStatusAction.execute({})}
              disabled={getStatusAction.isExecuting}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-auto"
            >
              <RefreshCw
                className={`size-3.5 ${
                  getStatusAction.isExecuting ? "animate-spin" : ""
                }`}
              />
              Atualizar Status
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* ESTADO 1: CONECTADO */}
          {status === "connected" && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="size-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-emerald-950 dark:text-emerald-200">
                    Seu WhatsApp está conectado e pronto para enviar mensagens!
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Todos os lembretes de consultas, confirmações automáticas anti no-show e notificações aos pacientes serão disparados através desta conexão.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnectAction.isExecuting}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0 text-xs gap-1.5"
                >
                  <LogOut className="size-3.5" />
                  Desconectar Número
                </Button>
              )}
            </div>
          )}

          {/* ESTADO 2: AGUARDANDO LEITURA DO QR CODE */}
          {status === "connecting" && qrCodeBase64 && (
            <div className="rounded-xl border bg-card p-6 flex flex-col items-center text-center space-y-4 max-w-md mx-auto shadow-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-base">Escaneie o QR Code no seu Celular</h4>
                <p className="text-xs text-muted-foreground">
                  Abra o WhatsApp no aparelho da clínica para autenticar a conexão.
                </p>
              </div>

              {/* QR Code Renderizado */}
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-primary/20">
                <img
                  src={
                    qrCodeBase64.startsWith("data:")
                      ? qrCodeBase64
                      : `data:image/png;base64,${qrCodeBase64}`
                  }
                  alt="QR Code WhatsApp Evolution API"
                  className="w-56 h-56 object-contain"
                />
              </div>

              {/* Instruções */}
              <div className="text-xs text-muted-foreground text-left bg-muted/60 p-3 rounded-lg space-y-1.5 w-full border">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-primary" /> Como conectar:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                  <li>Abra o WhatsApp no celular</li>
                  <li>Toque em <strong>Aparelhos Conectados</strong></li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                  <li>Aponte a câmera para este QR Code</li>
                </ol>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  disabled={connectAction.isExecuting}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw className="size-3.5" /> Gerar Novo QR Code
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus("disconnected")}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* ESTADO 3: DESCONECTADO (BOTÃO DE CONECTAR) */}
          {status === "disconnected" && (
            <div className="rounded-xl border border-dashed p-8 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <QrCode className="size-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-bold text-base">WhatsApp Não Conectado</h4>
                <p className="text-xs text-muted-foreground">
                  Gere o QR Code para conectar o WhatsApp oficial da clínica e automatizar o envio de lembretes aos seus pacientes.
                </p>
              </div>

              {isAdmin ? (
                <Button
                  onClick={handleConnect}
                  disabled={connectAction.isExecuting}
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
                >
                  {connectAction.isExecuting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Conectando ao Servidor...
                    </>
                  ) : (
                    <>
                      <QrCode className="size-4" /> Gerar QR Code para Leitura
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Apenas administradores podem iniciar a conexão do WhatsApp da clínica.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD SECUNDÁRIO: CONFIGURAÇÕES DA EVOLUTION API */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="size-4 text-primary" />
              Configuração do Servidor Evolution API
            </CardTitle>
            <CardDescription className="text-xs">
              Configure o endereço do seu servidor Evolution API. Se deixar em branco, o sistema usará as variáveis de ambiente padrão do servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="apiUrl" className="text-xs font-semibold">
                    URL da Evolution API
                  </Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://evolution.seudominio.com.br"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Exemplo: https://evolution.seudominio.com.br ou http://seu-ip:8080
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apiKey" className="text-xs font-semibold">
                    Chave de API (apikey)
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua Global API Key ou Instance Token"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Chave definida na variável AUTHENTICATION_API_KEY do seu servidor Evolution.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="instanceName" className="text-xs font-semibold">
                  Nome da Instância
                </Label>
                <Input
                  id="instanceName"
                  placeholder="clinica-minha-saude"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Identificador exclusivo desta clínica no servidor da Evolution API.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 text-primary" />
                  {hasEnvConfig ? (
                    <span>Servidor global configurado via .env ativo como fallback.</span>
                  ) : (
                    <span>Nenhum servidor global no .env detectado. Preencha os campos acima.</span>
                  )}
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={updateConfigAction.isExecuting}
                  className="gap-2 font-bold"
                >
                  {updateConfigAction.isExecuting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
