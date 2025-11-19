import { getSession } from "next-auth/react";

export interface FieldOption {
  id: number | string;
  name: string;
  value?: string | number;
  label?: string;
}

/**
 * Busca dados de domínio da API
 */
export async function fetchDomainData(domainCode: string): Promise<FieldOption[]> {
  try {
    // Usa a rota de API local que chama a API correta
    // A rota /api/domain/[domainCode] usa: https://api.aliancaseguros.cv/domain/find/1.0.0?name={domainCode}
    const response = await fetch(`/api/domain/${domainCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Não faz throw, apenas loga o erro e retorna array vazio
      console.error(`Erro ao buscar dados de domínio: ${response.status}`);
      return []; // Retorna array vazio ao invés de fazer throw
    }

    const data = await response.json();
    
    // Função auxiliar para normalizar um item
    const normalizeItem = (item: any): FieldOption => {
      // Tenta diferentes formatos de propriedades
      const id = item.id || item.value || item.name || item.code;
      const name = item.name || item.label || item.description || item.value || String(id);
      const value = item.value || item.code || item.id || item.name;
      const label = item.label || item.name || item.description || item.value || String(value);
      
      return {
        id: id,
        name: name,
        value: value,
        label: label,
      };
    };

    // Normaliza os dados para o formato esperado
    if (Array.isArray(data)) {
      return data.map(normalizeItem);
    }

    // Se for um objeto com propriedades, tenta extrair os valores
    if (data.values && Array.isArray(data.values)) {
      return data.values.map(normalizeItem);
    }

    // Se for um objeto com results (formato padrão da API)
    if (data.results && Array.isArray(data.results)) {
      return data.results.map(normalizeItem);
    }

    // Se for um objeto com data
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(normalizeItem);
    }

    // Se for um objeto com info e results (formato ApiResponse)
    if (data.info && data.results) {
      if (Array.isArray(data.results)) {
        return data.results.map(normalizeItem);
      }
    }

    console.warn("Formato de dados não reconhecido:", data);
    return [];
  } catch (error) {
    // Não faz throw, apenas loga o erro e retorna array vazio
    console.error(`Erro ao buscar dados de domínio ${domainCode}:`, error);
    return []; // Retorna array vazio ao invés de fazer throw
  }
}

/**
 * Busca dados de API dinamicamente baseado no sourceData e provider
 */
export async function fetchApiData(
  sourceData: string,
  provider?: string | null,
  params?: Record<string, any>
): Promise<FieldOption[]> {
  try {
    // Substitui placeholders na URL (ex: {{id}})
    let endpoint = sourceData;
    if (params) {
      Object.keys(params).forEach((key) => {
        endpoint = endpoint.replace(`{{${key}}}`, String(params[key]));
      });
    }

    // Usa a rota de API local
    const providerParam = provider || "Alianca";
    const url = `/api/dynamic/${providerParam}?endpoint=${encodeURIComponent(endpoint)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Não faz throw, apenas loga o erro e retorna array vazio
      console.error(`Erro ao buscar dados da API: ${response.status}`);
      return []; // Retorna array vazio ao invés de fazer throw
    }

    const data = await response.json();

    // Normaliza os dados para o formato esperado
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id || item.value || item.name,
        name: item.name || item.label || item.value,
        value: item.value || item.id || item.name,
        label: item.label || item.name || item.value,
      }));
    }

    // Se for um objeto com propriedades, tenta extrair os valores
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((item: any) => ({
        id: item.id || item.value || item.name,
        name: item.name || item.label || item.value,
        value: item.value || item.id || item.name,
        label: item.label || item.name || item.value,
      }));
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        id: item.id || item.value || item.name,
        name: item.name || item.label || item.value,
        value: item.value || item.id || item.name,
        label: item.label || item.name || item.value,
      }));
    }

    return [];
  } catch (error) {
    // Não faz throw, apenas loga o erro e retorna array vazio
    console.error(`Erro ao buscar dados da API ${sourceData}:`, error);
    return []; // Retorna array vazio ao invés de fazer throw
  }
}

/**
 * Busca dados de sessão (dados do usuário logado)
 */
export async function fetchSessionData(fieldName: string): Promise<string> {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return "";
    }

    // Mapeia nomes de campos para propriedades da sessão
    const user = session.user as any;
    const sessionMap: Record<string, string> = {
      name: user.name || "",
      email: user.email || "",
      nif: user.nif || "",
      bi: user.bi || "",
      emails: user.email || "",
      mobiles: user.mobile || "",
    };

    return sessionMap[fieldName] || "";
  } catch (error) {
    console.error(`Erro ao buscar dados de sessão para ${fieldName}:`, error);
    return "";
  }
}

