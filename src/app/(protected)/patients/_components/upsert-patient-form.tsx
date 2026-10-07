"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Building2,
  HeartPulse,
  Home,
  Loader2,
  PhoneCall,
  User,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
import { upsertPatientSchema } from "@/actions/upsert-patient/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { patientsTable } from "@/db/schema";

type FormValues = z.infer<typeof upsertPatientSchema>;

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

const UpsertPatientForm = ({
  patient,
  onSuccess,
  isOpen,
}: UpsertPatientFormProps) => {
  const [activeTab, setActiveTab] = useState<string>("personal");

  const form = useForm<FormValues>({
    shouldUnregister: false,
    resolver: zodResolver(upsertPatientSchema),
    defaultValues: {
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      phoneNumber: patient?.phoneNumber ?? "",
      sex: (patient?.sex as "male" | "female") ?? undefined,
      cpf: patient?.cpf ?? "",
      birthDate: patient?.birthDate ?? "",
      allergies: patient?.allergies ?? "",
      medicalHistory: patient?.medicalHistory ?? "",
      currentMedications: patient?.currentMedications ?? "",
      bloodType: patient?.bloodType ?? "",
      emergencyContactName: patient?.emergencyContactName ?? "",
      emergencyContactPhone: patient?.emergencyContactPhone ?? "",
      emergencyContactRelationship: patient?.emergencyContactRelationship ?? "",
      healthInsurance: patient?.healthInsurance ?? "Particular",
      healthInsuranceNumber: patient?.healthInsuranceNumber ?? "",
      addressZipCode: patient?.addressZipCode ?? "",
      addressStreet: patient?.addressStreet ?? "",
      addressNumber: patient?.addressNumber ?? "",
      addressComplement: patient?.addressComplement ?? "",
      addressNeighborhood: patient?.addressNeighborhood ?? "",
      addressCity: patient?.addressCity ?? "",
      addressState: patient?.addressState ?? "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: patient?.name ?? "",
        email: patient?.email ?? "",
        phoneNumber: patient?.phoneNumber ?? "",
        sex: (patient?.sex as "male" | "female") ?? undefined,
        cpf: patient?.cpf ?? "",
        birthDate: patient?.birthDate ?? "",
        allergies: patient?.allergies ?? "",
        medicalHistory: patient?.medicalHistory ?? "",
        currentMedications: patient?.currentMedications ?? "",
        bloodType: patient?.bloodType ?? "",
        emergencyContactName: patient?.emergencyContactName ?? "",
        emergencyContactPhone: patient?.emergencyContactPhone ?? "",
        emergencyContactRelationship: patient?.emergencyContactRelationship ?? "",
        healthInsurance: patient?.healthInsurance ?? "Particular",
        healthInsuranceNumber: patient?.healthInsuranceNumber ?? "",
        addressZipCode: patient?.addressZipCode ?? "",
        addressStreet: patient?.addressStreet ?? "",
        addressNumber: patient?.addressNumber ?? "",
        addressComplement: patient?.addressComplement ?? "",
        addressNeighborhood: patient?.addressNeighborhood ?? "",
        addressCity: patient?.addressCity ?? "",
        addressState: patient?.addressState ?? "",
      });
      setActiveTab("personal");
    }
  }, [isOpen, form, patient]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      const message = patient
        ? `Paciente ${patient.name} atualizado com sucesso!`
        : "Paciente adicionado com sucesso!";
      toast.success(message);
      onSuccess?.();
    },
    onError: ({ error }) => {
      if (error?.validationErrors) {
        toast.error("Por favor, revise os campos do paciente.");
        return;
      }
      toast.error(error?.serverError || "Erro ao salvar/atualizar paciente.");
    },
  });

  const onSubmit = (values: FormValues) => {
    upsertPatientAction.execute({
      ...values,
      id: patient?.id,
    });
  };

  const onInvalid = (errors: any) => {
    if (errors.name) {
      toast.error(errors.name.message || "Nome do paciente é obrigatório.");
      setActiveTab("personal");
      return;
    }
    if (errors.email) {
      toast.error(errors.email.message || "E-mail inválido.");
      setActiveTab("personal");
      return;
    }
    if (errors.phoneNumber) {
      toast.error(errors.phoneNumber.message || "Telefone é obrigatório.");
      setActiveTab("personal");
      return;
    }
    if (errors.sex) {
      toast.error(errors.sex.message || "Selecione o sexo biológico.");
      setActiveTab("personal");
      return;
    }
    const firstMsg = Object.values(errors)[0] as any;
    toast.error(firstMsg?.message || "Por favor, revise os campos obrigatórios.");
  };

  return (
    <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">
              {patient ? `Editar: ${patient.name}` : "Cadastrar Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              Ficha cadastral completa com informações clínicas, contatos e endereço.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/60">
              <TabsTrigger value="personal" className="flex items-center gap-1.5 py-2 text-xs font-medium">
                <User className="size-3.5" />
                <span>Identificação</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-1.5 py-2 text-xs font-medium relative">
                <HeartPulse className="size-3.5 text-rose-500" />
                <span>Saúde & Alergias</span>
              </TabsTrigger>
              <TabsTrigger value="insurance" className="flex items-center gap-1.5 py-2 text-xs font-medium">
                <Building2 className="size-3.5" />
                <span>Convênio & Contato</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-1.5 py-2 text-xs font-medium">
                <Home className="size-3.5" />
                <span>Endereço</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: Identificação & Dados Básicos */}
            <TabsContent value="personal" className="space-y-4 pt-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Carlos Eduardo de Oliveira"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="###.###.###-##"
                          mask="_"
                          placeholder="000.000.000-00"
                          value={field.value || ""}
                          onValueChange={(val) => field.onChange(val.value)}
                          customInput={Input}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo Biológico *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o sexo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Sanguíneo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="NaoInformado">Não Informado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp *</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="(##) #####-####"
                          mask="_"
                          placeholder="(11) 99999-9999"
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value.value);
                          }}
                          customInput={Input}
                        />
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
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="paciente@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            {/* ABA 2: Saúde, Alergias e Comorbidades */}
            <TabsContent value="health" className="space-y-4 pt-3">
              <div className="rounded-lg border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold text-sm">
                  <AlertTriangle className="size-4 text-rose-600 animate-pulse" />
                  <span>Alergias Conhecidas (Atenção Crítica)</span>
                </div>
                <p className="text-xs text-rose-700/90 dark:text-rose-300/80">
                  Informe alergias medicamentosas (ex: Penicilina, Dipirona, AINEs), anestésicos, látex ou alimentos. Este campo ficará em destaque no topo do prontuário para médicos e dentistas.
                </p>
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Ex: Alérgico a Penicilina, Dipirona e Látex"
                          className="bg-white dark:bg-zinc-900 border-rose-300 focus-visible:ring-rose-500"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico Médico / Comorbidades</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Ex: Hipertenso, Diabético tipo 2, Asma crônica, Portador de marcapasso..."
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentMedications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicamentos de Uso Contínuo</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Ex: Losartana 50mg 1x/dia, Metformina 850mg 2x/dia, AAS 100mg..."
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* ABA 3: Convênio & Contato de Emergência */}
            <TabsContent value="insurance" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="healthInsurance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano / Convênio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Particular, Unimed, Bradesco Saúde, Amil..."
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="healthInsuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº da Carteirinha / Matrícula</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 0023.9482.1192-00"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <PhoneCall className="size-4 text-primary" />
                  Contato de Emergência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Nome do Contato</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Maria (Esposa)"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Telefone de Emergência</FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="(##) #####-####"
                            mask="_"
                            placeholder="(11) 98888-8888"
                            value={field.value || ""}
                            onValueChange={(val) => field.onChange(val.value)}
                            customInput={Input}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Parentesco / Vínculo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Cônjuge, Mãe, Filho"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ABA 4: Endereço Completo */}
            <TabsContent value="address" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="addressZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="#####-###"
                          mask="_"
                          placeholder="00000-000"
                          value={field.value || ""}
                          onValueChange={(val) => field.onChange(val.value)}
                          customInput={Input}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="addressStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logradouro / Rua</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Av. Paulista, Rua das Flores"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="addressNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 123"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="addressComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Apto 42, Bloco B"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="addressNeighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Bela Vista"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: São Paulo"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: SP"
                          maxLength={2}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={upsertPatientAction.isPending} className="font-semibold">
              {upsertPatientAction.isPending && (
                <Loader2 className="mr-2 animate-spin size-4" />
              )}
              {patient ? "Salvar Alterações" : "Cadastrar Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
