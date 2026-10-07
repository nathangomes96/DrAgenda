"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2, Sparkles, UserPlus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createClinicUserAction } from "@/actions/users";
import { createClinicUserSchema } from "@/actions/users/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = z.infer<typeof createClinicUserSchema>;

export function UserDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(createClinicUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "doctor",
    },
  });

  const { execute, isExecuting } = useAction(createClinicUserAction, {
    onSuccess: ({ data }) => {
      toast.success(data?.message ?? "Usuário criado com sucesso!");
      form.reset();
      setOpen(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao cadastrar usuário.");
    },
  });

  const onSubmit = (values: FormData) => {
    execute(values);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password, { shouldValidate: true });
    setShowPassword(true);
    toast.info("Senha aleatória gerada!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar Novo Colaborador
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo membro para a sua equipe e defina o nível de acesso adequado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dr. Roberto Alcantara" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de Login</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="roberto@clinica.com.br"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O colaborador usará este e-mail para acessar o sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Senha Provisória</FormLabel>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <Sparkles className="h-3 w-3" /> Gerar senha
                    </button>
                  </div>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        {...field}
                        className="pr-10"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Acesso (Cargo)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-semibold text-primary">👑 Administrador</span>
                          <span className="text-xs text-muted-foreground">
                            Acesso total: dashboard, médicos, equipe e configurações
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="doctor">
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">🩺 Médico</span>
                          <span className="text-xs text-muted-foreground">
                            Atendimento da sua agenda e prontuários médicos (EHR)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="receptionist">
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">📋 Recepção</span>
                          <span className="text-xs text-muted-foreground">
                            Agendamentos e cadastro básico (sem prontuários)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isExecuting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isExecuting}>
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Colaborador"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
