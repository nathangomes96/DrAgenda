export interface ClinicalTemplate {
  id: string;
  title: string;
  category: "medical" | "dental" | "general";
  badge: string;
  description: string;
  isCustom?: boolean;
  defaults: {
    recordType: "medical" | "dental" | "general";
    symptoms?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    prescription?: string;
    notes: string;
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    procedureName?: string;
    teeth?: string;
    materialsUsed?: string;
    postOpInstructions?: string;
  };
}

export interface QuickPhrase {
  id: string;
  label: string;
  text: string;
  category: "anamnese" | "exame" | "conduta" | "odonto";
  targetField?: "notes" | "symptoms" | "treatmentPlan" | "prescription";
}

// Modelos Clínicos Padronizados Inspirados no ClinicSuite
export const BUILTIN_CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "anamnese-completa",
    title: "1ª Consulta / Anamnese Médica Completa",
    category: "medical",
    badge: "1ª Consulta",
    description: "Estrutura completa com HDA, interrogatório sobre diversos aparelhos, exame físico sistemático e conduta inicial.",
    defaults: {
      recordType: "medical",
      symptoms: "Paciente comparece à consulta médica referindo...",
      diagnosis: "Z00.0 - Exame médico geral / Rotina",
      treatmentPlan: "1. Solicitados exames complementares de rotina (Hemograma, Perfil Lipídico, Glicemia de jejum, Função Renal/Hepática, Urina tipo I).\n2. Orientações sobre hábitos de vida saudáveis, hidratação regular e atividade física.\n3. Retorno com os resultados dos exames em até 30 dias.",
      prescription: "",
      notes: "ECTOSCOPIA & SINAIS VITAIS:\n- Paciente em Bom Estado Geral (BEG), Lúcido e Orientado no Tempo e Espaço (LOTE).\n- Corado, hidratado, acianótico, anictérico, afebril, eupneico.\n\nAPARELHO CARDIOVASCULAR:\n- Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas sem sopros ou estalidos.\n\nAPARELHO RESPIRATÓRIO:\n- Murmúrio vesicular universalmente audível, sem ruídos adventícios.\n\nABDOME:\n- Plano, flácido, indolor à palpação superficial e profunda, sem massas ou visceromegalias palpáveis. RHA presentes.\n\nMEMBROS INFERIORES:\n- Livres de edema, pulsos periféricos palpáveis e simétricos, sem sinais de TVP.",
    },
  },
  {
    id: "retorno-acompanhamento",
    title: "Consulta de Retorno / Checagem de Exames",
    category: "medical",
    badge: "Retorno",
    description: "Ideal para avaliação de exames laboratoriais/imagem e ajuste de conduta terapêutica.",
    defaults: {
      recordType: "medical",
      symptoms: "Retorno para avaliação de exames complementares solicitados e seguimento clínico.",
      diagnosis: "Z09.0 - Exame de seguimento após tratamento",
      treatmentPlan: "1. Exames analisados, correlacionados e explicados detalhadamente ao paciente.\n2. Mantido esquema terapêutico atual.\n3. Novo retorno agendado em 90 a 180 dias para monitoramento contínuo.",
      prescription: "",
      notes: "EVOLUÇÃO:\n- Paciente relata boa adesão ao tratamento proposto na consulta anterior com melhora sintomática.\n- Nega eventos adversos ou intolerância aos fármacos.\n- Exames laboratoriais dentro dos parâmetros de referência esperados para a faixa etária.\n- Parâmetros vitais estáveis.",
    },
  },
  {
    id: "renovacao-cronicos",
    title: "Renovação de Receitas & Doenças Crônicas (HAS / DM)",
    category: "medical",
    badge: "Crônicos",
    description: "Rápido registro para acompanhamento de Hipertensão Arterial, Diabetes e renovação de receituário contínuo.",
    defaults: {
      recordType: "medical",
      symptoms: "Paciente assintomático, comparece para controle periódico de doenças crônicas e renovação de receituário de uso contínuo.",
      diagnosis: "I10 - Hipertensão essencial (primária) / E11 - Diabetes mellitus tipo 2",
      treatmentPlan: "1. Renovado receituário para 180 dias de tratamento contínuo.\n2. Reforçada adesão à dieta hipossódica e com controle de carboidratos simples.\n3. Orientada medição domiciliar da pressão arterial e glicemia capilar.",
      prescription: "1. Losartana Potássica 50mg ------- Tomar 1 comprimido VO pela manhã em jejum.\n2. Hidroclorotiazida 25mg ---------- Tomar 1 comprimido VO pela manhã.\n3. Metformina 850mg --------------- Tomar 1 comprimido VO após almoço e 1 após jantar.",
      notes: "AVALIAÇÃO DE CONTROLE:\n- Sem queixas de cefaleia, alterações visuais, palpitações, pré-síncope ou poliúria.\n- Níveis pressóricos e glicêmicos domiciliares referidos dentro do alvo terapêutico estabelecido.\n- Exame clínico sumário sem anormalidades agudas.",
    },
  },
  {
    id: "checkup-rapido",
    title: "Atendimento Rápido / Atestado e Sintomas Agudos",
    category: "medical",
    badge: "Agudo",
    description: "Atendimento dinâmico para queixas leves e agudas (resfriado, dor leve, gastroenterite) com menos digitação.",
    defaults: {
      recordType: "medical",
      symptoms: "Início dos sintomas há aproximadamente 48h, caracterizado por...",
      diagnosis: "J00 - Nasofaringite aguda (resfriado comum)",
      treatmentPlan: "1. Repouso relativo e hidratação oral vigorosa (mínimo 2 a 3 litros/dia).\n2. Tratamento sintomático conforme prescrição.\n3. Retorno ao pronto-atendimento se febre persistente por > 72h, dispneia ou prostração.",
      prescription: "1. Dipirona Monoidratada 500mg/mL gotas ---- Tomar 40 gotas de 6/6h se dor ou febre > 37.8°C.\n2. Solução Fisiológica 0,9% spray nasal ----- Aplicar 2 jatos em cada narina várias vezes ao dia.",
      notes: "Oroscopia com hiperemia leve de orofaringe, sem placas purulentas. Otoscopia bilateral sem alterações. Ausculta pulmonar limpa. Paciente orientado quanto aos sinais de alarme.",
    },
  },
  {
    id: "odonto-restauracao",
    title: "Odonto: Restauração Direta em Resina Composta",
    category: "dental",
    badge: "Restauração",
    description: "Modelo odontológico padronizado para procedimentos restauradores em dentes anteriores e posteriores.",
    defaults: {
      recordType: "dental",
      procedureName: "Restauração Estética em Resina Composta Fotopolimerizável",
      teeth: "Dente 16 (Classe I - Face Oclusal)",
      materialsUsed: "Anestésico Mepivacaína 2% 1:100.000, Sistema Adesivo Single Bond Universal, Resina Filtek Z350 XT cor A2, Fita matriz e cunha",
      postOpInstructions: "Evitar ingestão de alimentos duros ou pegajosos nas primeiras 4 horas. Em caso de desconforto mastigatório ou mordida alta, retornar ao consultório.",
      symptoms: "Paciente relata leve sensibilidade com alimentos doces ou gelados na região do dente.",
      diagnosis: "K02.1 - Cárie de dentina",
      treatmentPlan: "Procedimento restaurador concluído com sucesso. Próxima sessão para profilaxia geral.",
      notes: "PROTOCOLO CLÍNICO:\n1. Anestesia infiltrativa terminal local sem intercorrências.\n2. Isolamento absoluto do campo operatório com lençol de borracha.\n3. Remoção de tecido cariado amolecido com broca esférica e cureta de dentina.\n4. Condicionamento seletivo de esmalte com ácido fosfórico 37% por 15s.\n5. Aplicação de adesivo e fotopolimerização com LED Valo.\n6. Inserção incremental da resina composta fotopolimerizável e escultura oclusal anatômica.\n7. Checagem oclusal em máxima intercuspidação e movimentos excursivos com papel carbono.\n8. Acabamento e polimento final com discos Sof-Lex e pontas siliconadas.",
    },
  },
  {
    id: "odonto-profilaxia",
    title: "Odonto: Profilaxia, Raspagem & Aplicação de Flúor",
    category: "dental",
    badge: "Prevenção",
    description: "Atendimento preventivo e periodontal de rotina com registro de cálculo, placa e orientações de higiene oral.",
    defaults: {
      recordType: "dental",
      procedureName: "Profilaxia Completa, Raspagem Supragengival e Fluorterapia",
      teeth: "Arcada Superior e Inferior Completa",
      materialsUsed: "Ultrassom odontológico com insertos periodontais, curetas Gracey, taça de borracha, pasta profilática e flúor gel neutro a 2%",
      postOpInstructions: "Aguardar no mínimo 30 minutos antes de ingerir líquidos ou alimentos para máxima eficácia do flúor tópico.",
      symptoms: "Comparece para consulta semestral de prevenção odontológica e remoção de tártaro.",
      diagnosis: "K05.1 - Gengivite crônica simples",
      treatmentPlan: "Manutenção preventiva semestral recomendada. Orientado uso diário de fio dental antes da escovação noturna.",
      notes: "PROTOCOLO PREVENTIVO:\n- Exame clínico periodontal evidenciando acúmulo moderado de cálculo supragengival na face lingual dos ântero-inferiores.\n- Realizada raspagem supragengival com ultrassom e instrumentação manual com curetas de Gracey.\n- Jateamento de bicarbonato para remoção de pigmentos extrínsecos de café/chá.\n- Polimento coronário com pasta profilática e taça de borracha.\n- Passagem de fio dental interproximal em todos os dentes.\n- Aplicação tópica de flúor gel por 1 minuto.\n- Paciente instruído sobre a técnica de escovação de Bass modificada.",
    },
  },
  {
    id: "odonto-exodontia",
    title: "Odonto: Exodontia Simples / Cirurgia Ambulatorial",
    category: "dental",
    badge: "Cirurgia",
    description: "Registro de procedimento cirúrgico, anestesia utilizada, sutura e orientações pós-operatórias estritas.",
    defaults: {
      recordType: "dental",
      procedureName: "Exodontia Simples com Sutura",
      teeth: "Dente 38 (Terceiro Molar)",
      materialsUsed: "Articaína 4% 1:100.000 (2 tubetes), Alavancas reta e curva, Fórceps odontológico, Fio de sutura Seda 3-0 agulhado",
      postOpInstructions: "1. Manter a gaze comprimindo o local por 40 minutos.\n2. Aplicar compressa fria/gelo na face nas primeiras 24 horas (20min sim / 20min não).\n3. Dieta líquida a pastosa, estritamente fria ou morna nos dois primeiros dias.\n4. Não cuspir, não bochechar com vigor e não fumar nas primeiras 48h.\n5. Retorno em 7 dias para retirada da sutura.",
      symptoms: "Dor recorrente e impactação do elemento dentário provocando pericoronarite.",
      diagnosis: "K01.1 - Dentes inclusos / Pericoronarite aguda",
      treatmentPlan: "Cirurgia transcorrida sem intercorrências operatórias. Prescrito antibiótico e analgésico pós-operatório. Retorno em 7 dias.",
      prescription: "1. Amoxicilina 500mg ---------- Tomar 1 cápsula de 8 em 8 horas durante 7 dias.\n2. Nimesulida 100mg ----------- Tomar 1 comprimido de 12 em 12 horas durante 3 dias.\n3. Dipirona 500mg ------------- Tomar 1 comprimido de 6 em 6 horas se dor.",
      notes: "RELATO CIRÚRGICO:\n- Assepsia e antissepsia intra e extraoral com clorexidina.\n- Bloqueio anestésico local realizado com sucesso e hemostasia adequada.\n- Sindesmotomia e luxação com alavanca reta sem necessidade de osteotomia invasiva.\n- Curetagem cuidadosa do alvéolo e irrigação com soro fisiológico estéril 0,9%.\n- Sutura oclusiva simples com fio de seda 3-0. Hemostasia alcançada.",
    },
  },
  {
    id: "puericultura-pediatria",
    title: "Pediatria: Puericultura & Crescimento Infantil",
    category: "general",
    badge: "Pediatria",
    description: "Acompanhamento do desenvolvimento neuropsicomotor, vacinação e alimentação da infância.",
    defaults: {
      recordType: "general",
      symptoms: "Consulta de rotina de puericultura para monitoramento do crescimento e marcos de desenvolvimento infantil.",
      diagnosis: "Z00.1 - Exame de rotina da saúde da criança",
      treatmentPlan: "1. Curvas de crescimento plotadas (OMS) e compatíveis com a idade.\n2. Caderneta de vacinação checada: em dia com o calendário nacional.\n3. Estimulada alimentação equilibrada rica em frutas, legumes e hidratação adequada.\n4. Próxima consulta em 3 meses.",
      prescription: "",
      notes: "AVALIAÇÃO DO DESENVOLVIMENTO:\n- Criança ativa, reativa, corada, hidratada e em excelente estado geral.\n- Marcos do desenvolvimento neuropsicomotor adequados para a idade cronológica.\n- Ausculta cardíaca e respiratória sem ruídos patológicos.\n- Abdome globoso, inocente, flácido e indolor.\n- Tônus e força muscular simétricos.",
    },
  },
];

// Frases Rápidas (Macros) para inserção em 1 clique
export const QUICK_CLINICAL_PHRASES: QuickPhrase[] = [
  // Exame físico
  {
    id: "ef-1",
    label: "BEG, LOTE, Eupneico",
    category: "exame",
    targetField: "notes",
    text: "Paciente em Bom Estado Geral (BEG), Lúcido e Orientado no Tempo e Espaço (LOTE), acianótico, anictérico, corado, hidratado e eupneico em ar ambiente.",
  },
  {
    id: "ef-2",
    label: "Cardiovascular e Respiratório Normais",
    category: "exame",
    targetField: "notes",
    text: "ACV: Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas sem sopros. AR: Murmúrio vesicular presente bilateralmente, sem ruídos adventícios.",
  },
  {
    id: "ef-3",
    label: "Abdome Inocente",
    category: "exame",
    targetField: "notes",
    text: "Abdome flácido, depressível, indolor à palpação superficial e profunda, sem massas ou visceromegalias palpáveis. Ruídos hidroaéreos presentes e normoativos.",
  },
  {
    id: "ef-4",
    label: "Sem Sinais de Alarme",
    category: "exame",
    targetField: "notes",
    text: "Ausência de sinais meníngeos, sem déficit neurológico focal agudo e sem sinais de alarme clínicos no momento.",
  },
  // Anamnese / Queixa
  {
    id: "an-1",
    label: "Sem Queixas Agudas",
    category: "anamnese",
    targetField: "symptoms",
    text: "Paciente assintomático no momento, sem queixas álgicas agudas ou intercorrências recentes.",
  },
  {
    id: "an-2",
    label: "Boa Adesão ao Tratamento",
    category: "anamnese",
    targetField: "symptoms",
    text: "Refere excelente adesão às medicações prescritas, sem interrupção e sem relatos de reações adversas.",
  },
  // Conduta
  {
    id: "cd-1",
    label: "Retorno em 30 Dias",
    category: "conduta",
    targetField: "treatmentPlan",
    text: "Retorno agendado em 30 dias para reavaliação clínica e acompanhamento da evolução dos sintomas.",
  },
  {
    id: "cd-2",
    label: "Hidratação & Repouso",
    category: "conduta",
    targetField: "treatmentPlan",
    text: "Orientada hidratação oral vigorosa (mínimo 2 a 3 litros de água por dia), repouso relativo e evitar sobrecarga física.",
  },
  {
    id: "cd-3",
    label: "Alerta para Pronto-Socorro",
    category: "conduta",
    targetField: "treatmentPlan",
    text: "Orientado a buscar imediatamente o pronto-atendimento em caso de febre alta persistente, falta de ar, dor intensa súbita ou piora do quadro.",
  },
  // Odonto
  {
    id: "od-1",
    label: "Isolamento & Fotopolimerização",
    category: "odonto",
    targetField: "notes",
    text: "Realizado isolamento absoluto com lençol de borracha, ataque ácido seletivo de esmalte por 15s e fotopolimerização com luz LED.",
  },
  {
    id: "od-2",
    label: "Ajuste Oclusal Concluído",
    category: "odonto",
    targetField: "notes",
    text: "Checagem de contatos oclusais estáticos e dinâmicos com papel carbono; restauração sem contatos prematuros nem interferências.",
  },
];

// Funções para gerenciar modelos customizados no navegador (localStorage)
const STORAGE_KEY = "dragenda_custom_clinical_templates";

export function getCustomTemplates(): ClinicalTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: Omit<ClinicalTemplate, "id" | "isCustom">): ClinicalTemplate {
  const customList = getCustomTemplates();
  const newTemplate: ClinicalTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isCustom: true,
  };
  const updated = [newTemplate, ...customList];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao salvar template customizado:", err);
  }
  return newTemplate;
}

export function deleteCustomTemplate(templateId: string): ClinicalTemplate[] {
  const customList = getCustomTemplates();
  const updated = customList.filter((t) => t.id !== templateId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao remover template:", err);
  }
  return updated;
}
