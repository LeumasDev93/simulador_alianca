import { getSession, signIn } from "next-auth/react";

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
    // Primeiro, trata valores que são arrays ou objetos (não strings)
    const processedValues: Record<string, any> = {};
    Object.keys(formValues).forEach((key) => {
      const value = formValues[key];
      if (value !== null && value !== undefined && value !== "") {
        // Campos que devem ser arrays
        if (key === "emails" || key === "mobiles") {
          // Se já é array, mantém; senão, converte para array
          if (Array.isArray(value)) {
            processedValues[key] = JSON.stringify(value);
          } else {
            processedValues[key] = JSON.stringify([String(value)]);
          }
        } else if (Array.isArray(value)) {
          processedValues[key] = JSON.stringify(value);
        } else if (typeof value === "object") {
          processedValues[key] = JSON.stringify(value);
        } else {
          processedValues[key] = String(value);
        }
      } else {
        // Para arrays vazios, retorna array vazio
        if (key === "emails" || key === "mobiles") {
          processedValues[key] = "[]";
        } else {
          processedValues[key] = "";
        }
      }
    });

    // Substitui placeholders simples (strings)
    payloadString = payloadString.replace(/\$(\w+)/g, (match, key) => {
      const value = processedValues[key];
      if (value === undefined || value === "") {
        // Se é um campo de array, retorna array vazio
        if (key === "emails" || key === "mobiles") {
          return "[]";
        }
        return '""';
      }
      // Se já é JSON (array ou objeto), retorna direto
      if ((value.startsWith("[") && value.endsWith("]")) || 
          (value.startsWith("{") && value.endsWith("}"))) {
        return value;
      }
      // Se é número, retorna sem aspas
      if (!isNaN(Number(value)) && value.trim() !== "") {
        return value;
      }
      // Se é string, escapa e adiciona aspas
      return `"${escapeJsonString(value)}"`;
    });

    // Trata campos que podem ter nomes diferentes (email -> emails)
    if (formValues.email && !formValues.emails) {
      payloadString = payloadString.replace(/\$emails/g, JSON.stringify([formValues.email]));
    }
    if (formValues.mobile && !formValues.mobiles) {
      payloadString = payloadString.replace(/\$mobiles/g, JSON.stringify([formValues.mobile]));
    }

    // Parse do JSON resultante
    const payload = JSON.parse(payloadString);

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
  setIsLoading: (loading: boolean) => void,
  setSimulationResult: (result: any) => void,
  csrfToken?: string
) => {
  setIsLoading(true);
  const session = await getSession();

  if (!session?.user?.accessToken) {
    console.warn("Nenhum token encontrado - redirecionando para login");
    signIn();
    return null;
  }

  try {
    // Valida se tem CSRF token
    if (!csrfToken) {
      throw new Error("Token de segurança não disponível. Recarregue a página.");
    }

    // Gera o payload dinamicamente
    const payload = generateSimulationPayload(bodyTemplate, formValues);

    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        token: session.user.accessToken,
        ...payload,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Se for erro 403 (CSRF), mostra mensagem específica
      if (response.status === 403) {
        throw new Error('Erro de segurança. Por favor, recarregue a página e tente novamente.');
      }
      
      throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const simulationResult = await response.json();
    setSimulationResult(simulationResult.installmentValues);

    return simulationResult;
  } catch (error) {
    console.error("Falha na simulação:", {
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });
    if (error instanceof Error && error.message.includes("401")) {
      signIn();
    }
    throw error;
  } finally {
    setIsLoading(false);
  }
};

