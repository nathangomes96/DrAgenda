"use client";

import { useState } from "react";
import { Check, Copy, CreditCard, ExternalLink, MessageCircle, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethodsCardProps {
  settings: {
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
  clinicName: string;
}

export function PaymentMethodsCard({
  settings,
  clinicName,
}: PaymentMethodsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPix = () => {
    if (!settings.pixKey) return;
    navigator.clipboard.writeText(settings.pixKey);
    setCopied(true);
    toast.success("Chave Pix copiada para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanWhatsapp = (settings.pixWhatsappNumber || "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Olá! Fiz o pagamento da mensalidade do Dr. Agenda para a clínica "${clinicName}". Segue o comprovante para ativação:`,
  );
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}`
    : null;

  const hasAnyMethod =
    settings.pixEnabled ||
    settings.mercadopagoEnabled ||
    settings.stripeEnabled;

  if (!hasAnyMethod) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Nenhuma forma de pagamento configurada no momento. Por favor, entre em contato com o suporte.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-xl font-bold tracking-tight mb-1">
          Formas de Pagamento Disponíveis
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja efetuar o pagamento da sua assinatura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opção Pix Direto */}
        {settings.pixEnabled && settings.pixKey && (
          <Card className="border-emerald-500/30 bg-gradient-to-b from-card to-emerald-50/10 dark:to-emerald-950/10 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pix Instantâneo</CardTitle>
                  <CardDescription>
                    Ativação rápida via comprovante no WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/60 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tipo de Chave ({settings.pixKeyType || "Pix"}):
                  </span>
                  <span className="font-semibold text-foreground select-all">
                    {settings.pixKey}
                  </span>
                </div>
                {settings.pixReceiverName && (
                  <div className="flex justify-between border-t border-muted pt-1">
                    <span className="text-muted-foreground">Titular:</span>
                    <span className="font-medium text-foreground">
                      {settings.pixReceiverName}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPix}
                  className="w-full gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      Chave Copiada!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Chave Pix
                    </>
                  )}
                </Button>

                {whatsappUrl && (
                  <Button
                    asChild
                    className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar Comprovante pelo WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opção Mercado Pago */}
        {settings.mercadopagoEnabled && settings.mercadopagoUrl && (
          <Card className="border-blue-500/30 bg-gradient-to-b from-card to-blue-50/10 dark:to-blue-950/10 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mercado Pago</CardTitle>
                  <CardDescription>
                    Pague com Pix, Saldo Mercado Pago ou Cartão
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Clique no botão abaixo para ser direcionado à página segura de checkout do Mercado Pago.
              </p>
              <Button
                asChild
                className="w-full gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <a
                  href={settings.mercadopagoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ir para Checkout Mercado Pago
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Opção Stripe */}
        {settings.stripeEnabled && settings.stripeUrl && (
          <Card className="border-indigo-500/30 bg-gradient-to-b from-card to-indigo-50/10 dark:to-indigo-950/10 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cartão de Crédito (Stripe)</CardTitle>
                  <CardDescription>
                    Assinatura com renovação automática
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Pagamento seguro através da plataforma Stripe com cartão de crédito internacional.
              </p>
              <Button
                asChild
                className="w-full gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <a
                  href={settings.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CreditCard className="w-4 h-4" />
                  Pagar com Cartão (Stripe)
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
