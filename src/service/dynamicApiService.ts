/**
 * URLs base para diferentes providers (rotas internas)
 */
const API_BASE_URLS = {
  Anywhere: "/api/dynamic/Anywhere",
  Alianca: "/api/alianca",
};

export interface ApiOption {
  id: number | string;
  name: string;
}

/**
 * Busca dados de API dinamicamente baseado no provider e sourceData
 */
export async function fetchDynamicApiData(
  sourceData: string,
  provider: string | null,
  targetFieldValue?: string | number,
  formValues?: Record<string, unknown>
): Promise<ApiOption[]> {
  const providerName = provider || "Anywhere";

  let endpoint = sourceData;

  if (targetFieldValue !== undefined && targetFieldValue !== null) {
    endpoint = endpoint.replace(/\{\{id\}\}/g, String(targetFieldValue));
    endpoint = endpoint.replace(/\{\{brand\}\}/g, String(targetFieldValue));
  }

  if (formValues) {
    Object.entries(formValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        endpoint = endpoint.replace(placeholder, String(value));
      }
    });
  }

  // Remove barra inicial duplicada, se existir
  let normalizedEndpoint = endpoint.trim();
  if (normalizedEndpoint.startsWith("/")) {
    normalizedEndpoint = normalizedEndpoint.substring(1);
  }

  let apiUrl: string;

  if (providerName === "Alianca") {
    apiUrl = `${
      API_BASE_URLS.Alianca
    }?endpoint=${encodeURIComponent(normalizedEndpoint)}`;
  } else {
    const baseUrl =
      API_BASE_URLS[providerName as keyof typeof API_BASE_URLS] ||
      API_BASE_URLS.Anywhere;
    apiUrl = `${baseUrl}?endpoint=${encodeURIComponent(normalizedEndpoint)}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Não faz throw, apenas loga o erro e retorna array vazio
      console.error(`Erro ao buscar dados da API: ${response.status} ${response.statusText}`);
      return []; // Retorna array vazio ao invés de fazer throw
    }

    const data = await response.json();

    let normalizedData: ApiOption[] = [];

    interface ApiResponseItem {
      id?: string | number;
      value?: string | number;
      code?: string | number;
      name?: string;
      label?: string;
    }

    if (Array.isArray(data)) {
      normalizedData = (data as ApiResponseItem[]).map((item) => ({
        id: item.id || item.value || item.code || item.name || "",
        name: String(
          item.name || item.label || item.value || item.id || ""
        ),
      }));
    } else if (
      data &&
      typeof data === "object" &&
      "data" in data &&
      Array.isArray(data.data)
    ) {
      normalizedData = (data.data as ApiResponseItem[]).map((item) => ({
        id: item.id || item.value || item.code || item.name || "",
        name: String(
          item.name || item.label || item.value || item.id || ""
        ),
      }));
    } else if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray(data.results)
    ) {
      normalizedData = (data.results as ApiResponseItem[]).map((item) => ({
        id: item.id || item.value || item.code || item.name || "",
        name: String(
          item.name || item.label || item.value || item.id || ""
        ),
      }));
    } else {
      normalizedData = [];
    }

    return normalizedData;
  } catch (error) {
    // Não faz throw, apenas loga o erro e retorna array vazio
    // O hook useDynamicFieldData tratará o erro e mostrará mensagem amigável
    console.error(`Erro ao buscar dados da API (${apiUrl}):`, error);
    return []; // Retorna array vazio ao invés de fazer throw
  }
}

