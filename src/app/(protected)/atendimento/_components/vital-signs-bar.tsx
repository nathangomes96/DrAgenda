"use client";

import { useMemo } from "react";
import { Activity, AlertTriangle, Heart, Pill, Scale, Thermometer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VitalSignsData {
  weight: string;
  height: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  respiratoryRate: string;
}

interface VitalSignsBarProps {
  data: VitalSignsData;
  onChange: (field: keyof VitalSignsData, value: string) => void;
  allergies?: string | null;
  currentMedications?: string | null;
}

export function VitalSignsBar({
  data,
  onChange,
  allergies,
  currentMedications,
}: VitalSignsBarProps) {
  // Cálculo automático do IMC: Peso (kg) / Altura (m)²
  const imcInfo = useMemo(() => {
    const weightNum = parseFloat(data.weight?.replace(",", ".") || "");
    const heightNum = parseFloat(data.height?.replace(",", ".") || "");

    if (!weightNum || !heightNum || heightNum <= 0) return null;

    // Converte cm para metros se o usuário digitou ex: 175 em vez de 1.75
    const heightInMeters = heightNum > 3 ? heightNum / 100 : heightNum;
    const imc = weightNum / (heightInMeters * heightInMeters);

    let classification = "Normal";
    let color = "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";

    if (imc < 18.5) {
      classification = "Baixo peso";
      color = "text-amber-600 bg-amber-500/10 border-amber-500/30";
    } else if (imc >= 25 && imc < 30) {
      classification = "Sobrepeso";
      color = "text-amber-600 bg-amber-500/10 border-amber-500/30";
    } else if (imc >= 30) {
      classification = "Obesidade";
      color = "text-rose-600 bg-rose-500/10 border-rose-500/30";
    }

    return {
      value: imc.toFixed(1),
      classification,
      color,
    };
  }, [data.weight, data.height]);

  return (
    <div className="bg-card rounded-2xl border p-4 shadow-xs space-y-3">
      {/* Inputs em Linha dos Sinais Vitais */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground mr-1">
          <Activity className="size-4 text-primary" />
          <span>Sinais Vitais</span>
        </div>

        {/* Peso */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">Peso (kg)</Label>
          <Input
            value={data.weight}
            onChange={(e) => onChange("weight", e.target.value)}
            placeholder="70"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* Altura */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">Altura (m)</Label>
          <Input
            value={data.height}
            onChange={(e) => onChange("height", e.target.value)}
            placeholder="1.75"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* IMC Calculado */}
        {imcInfo && (
          <div className="flex flex-col gap-1 justify-center">
            <Label className="text-[10px] text-muted-foreground font-medium">IMC</Label>
            <Badge
              variant="outline"
              className={cn("h-8 px-2.5 text-xs font-mono font-bold border", imcInfo.color)}
              title={imcInfo.classification}
            >
              {imcInfo.value} ({imcInfo.classification})
            </Badge>
          </div>
        )}

        {/* Pressão Arterial */}
        <div className="flex flex-col gap-1 w-24">
          <Label className="text-[10px] text-muted-foreground font-medium">PA (mmHg)</Label>
          <Input
            value={data.bloodPressure}
            onChange={(e) => onChange("bloodPressure", e.target.value)}
            placeholder="120/80"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* FC bpm */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">FC (bpm)</Label>
          <Input
            value={data.heartRate}
            onChange={(e) => onChange("heartRate", e.target.value)}
            placeholder="72"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* Temp °C */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">Temp (°C)</Label>
          <Input
            value={data.temperature}
            onChange={(e) => onChange("temperature", e.target.value)}
            placeholder="36.5"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* Sat O2 % */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">Sat O2 (%)</Label>
          <Input
            value={data.oxygenSaturation}
            onChange={(e) => onChange("oxygenSaturation", e.target.value)}
            placeholder="98"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>

        {/* FR irpm */}
        <div className="flex flex-col gap-1 w-20">
          <Label className="text-[10px] text-muted-foreground font-medium">FR (irpm)</Label>
          <Input
            value={data.respiratoryRate}
            onChange={(e) => onChange("respiratoryRate", e.target.value)}
            placeholder="16"
            className="h-8 text-xs text-center rounded-lg font-mono font-medium"
          />
        </div>
      </div>

      {/* Alertas Médicos Rápidos (Alergias e Medicamentos de Uso Contínuo) */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />
          <span className="font-bold text-rose-600 dark:text-rose-400">ALERGIAS:</span>
          <span className="text-foreground font-medium">
            {allergies?.trim() ? allergies : "Nenhuma alergia relatada"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 border-l pl-4">
          <Pill className="size-3.5 text-emerald-500 shrink-0" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400">USO CONTÍNUO:</span>
          <span className="text-foreground font-medium">
            {currentMedications?.trim() ? currentMedications : "Nada consta"}
          </span>
        </div>
      </div>
    </div>
  );
}
