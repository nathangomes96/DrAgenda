"use client";

import { LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function AccessBlockedPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/authentication");
          },
        },
      });
    } catch {
      router.push("/authentication");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Acesso Temporariamente Suspenso
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm pt-1">
            Seu acesso a esta clínica foi bloqueado pelo administrador do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Durante este período, você não poderá visualizar prontuários, agendamentos ou realizar ações na clínica.
          </p>
          <div className="rounded-lg bg-amber-500/10 p-3 text-left text-xs text-amber-800 dark:text-amber-300 border border-amber-500/20">
            💡 <strong>O que fazer?</strong>
            <br />
            Caso acredite que se trata de um engano ou precise reativar suas credenciais, solicite ao administrador da sua clínica a liberação do seu acesso.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Encerrando sessão..." : "Sair da Conta"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
