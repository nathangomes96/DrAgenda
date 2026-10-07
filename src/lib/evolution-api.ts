export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface EvolutionConnectionState {
  state: "open" | "connecting" | "close" | "refused" | "not_created" | "error";
  instanceName?: string;
  phone?: string;
  profileName?: string;
  profilePictureUrl?: string;
}

export interface EvolutionQrCodeResponse {
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  state?: string;
}

/**
 * Normaliza a URL removendo barras finais
 */
function cleanUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Resolve a configuração da Evolution API usando os dados da clínica com fallback para .env
 */
export function resolveEvolutionConfig(clinic: {
  id: string;
  slug?: string | null;
  whatsappApiUrl?: string | null;
  whatsappApiKey?: string | null;
  whatsappInstanceName?: string | null;
}): EvolutionConfig {
  const envUrl = process.env.EVOLUTION_API_URL || "";
  const envKey = process.env.EVOLUTION_API_KEY || "";
  const defaultInstance =
    clinic.whatsappInstanceName ||
    clinic.slug ||
    `clinica-${clinic.id.slice(0, 8)}`;

  return {
    apiUrl: cleanUrl(clinic.whatsappApiUrl || envUrl),
    apiKey: clinic.whatsappApiKey || envKey,
    instanceName: defaultInstance,
  };
}

/**
 * Verifica o estado atual de conexão da instância
 */
export async function getEvolutionConnectionState(
  config: EvolutionConfig,
): Promise<EvolutionConnectionState> {
  if (!config.apiUrl || !config.apiKey) {
    return { state: "not_created" };
  }

  try {
    const url = `${config.apiUrl}/instance/connectionState/${config.instanceName}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      return { state: "not_created", instanceName: config.instanceName };
    }

    if (!res.ok) {
      return { state: "error", instanceName: config.instanceName };
    }

    const data = await res.json();
    const rawState = data?.instance?.state || data?.state || "close";

    return {
      state: rawState === "open" ? "open" : rawState === "connecting" ? "connecting" : "close",
      instanceName: config.instanceName,
    };
  } catch (error) {
    console.error("Erro ao verificar status na Evolution API:", error);
    return { state: "error", instanceName: config.instanceName };
  }
}

/**
 * Cria a instância na Evolution API caso não exista
 */
export async function createEvolutionInstance(
  config: EvolutionConfig,
): Promise<{ success: boolean; data?: any }> {
  try {
    const res = await fetch(`${config.apiUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        instanceName: config.instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (error) {
    console.error("Erro ao criar instância na Evolution API:", error);
    return { success: false };
  }
}

/**
 * Solicita a conexão e o QRCode da instância
 */
export async function connectEvolutionInstance(
  config: EvolutionConfig,
): Promise<EvolutionQrCodeResponse> {
  if (!config.apiUrl || !config.apiKey) {
    throw new Error(
      "A URL e a Chave de API da Evolution API precisam estar configuradas.",
    );
  }

  // Tenta conectar
  let res = await fetch(
    `${config.apiUrl}/instance/connect/${config.instanceName}`,
    {
      method: "GET",
      headers: {
        apikey: config.apiKey,
      },
      cache: "no-store",
    },
  );

  // Se a instância não existe ainda (404), cria e tenta novamente
  if (res.status === 404) {
    await createEvolutionInstance(config);
    res = await fetch(
      `${config.apiUrl}/instance/connect/${config.instanceName}`,
      {
        method: "GET",
        headers: {
          apikey: config.apiKey,
        },
        cache: "no-store",
      },
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Falha ao conectar na Evolution API: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    base64: data?.base64 || data?.qrcode?.base64,
    code: data?.code || data?.qrcode?.code,
    pairingCode: data?.pairingCode,
    count: data?.count,
  };
}

/**
 * Desconecta/Logout da instância do WhatsApp
 */
export async function logoutEvolutionInstance(
  config: EvolutionConfig,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${config.apiUrl}/instance/logout/${config.instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: config.apiKey,
        },
      },
    );
    return res.ok;
  } catch (error) {
    console.error("Erro ao desconectar instância na Evolution API:", error);
    return false;
  }
}

/**
 * Envia mensagem de texto via Evolution API
 */
export async function sendEvolutionTextMessage(
  config: EvolutionConfig,
  params: {
    number: string;
    text: string;
    delay?: number;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.apiUrl || !config.apiKey) {
    return {
      success: false,
      error: "Servidor da Evolution API não está configurado.",
    };
  }

  const cleanPhone = params.number.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  try {
    const res = await fetch(
      `${config.apiUrl}/message/sendText/${config.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: JSON.stringify({
          number: fullPhone,
          text: params.text,
          delay: params.delay ?? 1200,
          linkPreview: true,
        }),
      },
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg =
        errData?.response?.message?.[0] ||
        errData?.message ||
        `Erro ${res.status} retornado pelo servidor Evolution.`;
      return { success: false, error: errMsg };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data?.key?.id,
    };
  } catch (error: any) {
    console.error("Erro ao enviar mensagem via Evolution API:", error);
    return {
      success: false,
      error: error?.message || "Falha na comunicação com o servidor Evolution API.",
    };
  }
}
