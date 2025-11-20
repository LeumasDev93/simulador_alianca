import { getSession } from "next-auth/react";

/**
 * Gera o payload de simulação dinamicamente baseado no bodyTemplate
 */
export function generateSimulationPayload(
  bodyTemplate: string,
  formValues: Record<string, any>
): any {
  try {
    // Substitui placeholders no template
    let payloadString = bodyTemplate;

    // Função auxiliar para obter valor do formulário
    const getValue = (key: string): any => {
      const value = formValues[key];
      if (value === null || value === undefined || value === "") {
        return "";
      }
      return value;
    };

    // Função para escapar strings JSON
    const escapeJsonString = (str: string): string => {
      return str.replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"')
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t");
    };

    // Substitui todos os placeholders $variableName
    const specialArrayFields = new Set(["emails", "mobiles"]);
    const valueMap: Record<string, any> = {};

    Object.keys(formValues).forEach((key) => {
      const value = formValues[key];
      if (specialArrayFields.has(key)) {
        if (Array.isArray(value)) {
          valueMap[key] = value;
        } else if (value !== undefined && value !== null && value !== "") {
          valueMap[key] = [String(value)];
        } else {
          valueMap[key] = [];
        }
      } else if (value !== undefined && value !== null) {
        valueMap[key] = value;
      } else {
        valueMap[key] = "";
      }
    });

    const getJsonLiteral = (key: string, rawValue: any): string => {
      if (specialArrayFields.has(key)) {
        const arrayValue = rawValue
          ? Array.isArray(rawValue)
            ? rawValue
            : [String(rawValue)]
          : [];
        return JSON.stringify(arrayValue);
      }

      if (rawValue === undefined || rawValue === null) {
        return '""';
      }

      if (Array.isArray(rawValue) || typeof rawValue === "object") {
        try {
          return JSON.stringify(rawValue);
        } catch (err) {
          console.error("Erro ao serializar objeto para placeholder", key, err);
          return '""';
        }
      }

      const valueStr = String(rawValue);
      const trimmed = valueStr.trim();

      if (trimmed === "") {
        return '""';
      }

      if (typeof rawValue === "number") {
        return String(rawValue);
      }

      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return trimmed;
      }

      return `"${escapeJsonString(valueStr)}"`;
    };

    // Primeiro substitui placeholders que estão entre aspas
    payloadString = payloadString.replace(
      /"\$(\w+)"/g,
      (match, key: string) => {
        const literal = getJsonLiteral(key, valueMap[key]);
        return literal;
      }
    );

    // Depois substitui os restantes (fora de aspas)
    payloadString = payloadString.replace(/\$(\w+)/g, (match, key) => {
      return getJsonLiteral(key, valueMap[key]);
    });

    // Trata campos que podem ter nomes diferentes (email -> emails)
    if (formValues.email && !formValues.emails) {
      payloadString = payloadString.replace(/\$emails/g, JSON.stringify([formValues.email]));
    }
    if (formValues.mobile && !formValues.mobiles) {
      payloadString = payloadString.replace(/\$mobiles/g, JSON.stringify([formValues.mobile]));
    }

    // Parse do JSON resultante
    let payload;
    try {
      payload = JSON.parse(payloadString);
    } catch (parseError) {
      console.error("Payload inválido. Conteúdo gerado:", payloadString);
      throw new Error(
        "Erro ao gerar payload da simulação. Verifique os campos preenchidos."
      );
    }

    // Adiciona campos adicionais necessários
    const generateRandomSimulationId = (): number => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
      return Number(timestamp);
    };

    // Adiciona campos padrão se não existirem
    if (!payload.idSimulationTel) {
      payload.idSimulationTel = generateRandomSimulationId();
    }
    if (!payload.registerDateSimulationTel) {
      payload.registerDateSimulationTel = new Date().toISOString();
    }
    if (!payload.currency) {
      payload.currency = "CVE";
    }
    if (!payload.producer) {
      payload.producer = 2;
    }

    return payload;
  } catch (error) {
    console.error("Erro ao gerar payload dinâmico:", error);
    throw new Error("Erro ao gerar payload da simulação");
  }
}

/**
 * Executa a simulação com payload dinâmico
 */
export const fetchDynamicSimulation = async (
  bodyTemplate: string,
  formValues: Record<string, any>,
  setIsLoading: (loading: boolean) => void
) => {
  setIsLoading(true);
  
  try {
    // Gera o payload dinamicamente
    const payload = generateSimulationPayload(bodyTemplate, formValues);

    // Tenta obter token da sessão, mas se não houver, a rota API gerará um novo
    const session = await getSession();
    const token = session?.user?.accessToken || "";

    console.log("Enviando simulação:", {
      hasToken: !!token,
      payloadKeys: Object.keys(payload)
    });

    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        token: token, // Se vazio, a rota API gerará um novo
        ...payload,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const simulationResult = await response.json();
    return simulationResult;
  } catch (error) {
    console.error("Falha na simulação:", {
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });
    // Não redireciona para login - produtos públicos não precisam de sessão
    // A rota API já gera token automaticamente se necessário
    throw error;
  } finally {
    setIsLoading(false);
  }
};

