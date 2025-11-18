import { useState, useEffect, useCallback, useRef } from "react";
import { fetchDomainData, fetchApiData, fetchSessionData, FieldOption } from "@/service/dynamicFieldService";

interface FieldConfig {
  name: string;
  sourceData?: string;
  sourceDataType?: string;
  provider?: string | null;
  targetField?: string | null;
  defaultValue?: string;
  isReadOnly?: boolean;
}

interface UseDynamicFieldDataReturn {
  options: FieldOption[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para gerenciar dados dinâmicos de campos
 * Suporta: API, DOMAIN, SESSION, INDEFINIDO
 */
export function useDynamicFieldData(
  field: FieldConfig,
  dependencies?: Record<string, any>
): UseDynamicFieldDataReturn {
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usa refs para evitar loops infinitos
  const loadingRef = useRef(false);
  const lastLoadKeyRef = useRef<string>("");
  
  // Cria uma chave única para identificar quando recarregar
  const getLoadKey = useCallback(() => {
    const dependencyValue = field.targetField && dependencies 
      ? String(dependencies[field.targetField] || "") 
      : "";
    return `${field.name}-${field.sourceData}-${field.sourceDataType}-${field.targetField}-${dependencyValue}`;
  }, [field.name, field.sourceData, field.sourceDataType, field.targetField, dependencies]);

  const loadData = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas
    if (loadingRef.current) {
      return;
    }

    const loadKey = getLoadKey();
    
    // Se já carregou com essas mesmas dependências, não recarrega
    if (lastLoadKeyRef.current === loadKey && lastLoadKeyRef.current !== "") {
      return;
    }

    // Se não tem sourceData ou é INDEFINIDO, não carrega nada
    if (!field.sourceData || field.sourceDataType === "INDEFINIDO") {
      setOptions([]);
      lastLoadKeyRef.current = loadKey;
      return;
    }

    // Se é SESSION, busca da sessão e retorna como valor único
    if (field.sourceDataType === "SESSION") {
      try {
        setLoading(true);
        loadingRef.current = true;
        setError(null);
        await fetchSessionData(field.name);
        // Para campos de sessão, não retornamos opções, apenas o valor
        setOptions([]);
        lastLoadKeyRef.current = loadKey;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao buscar dados de sessão");
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
      return;
    }

    // Se tem targetField, verifica se a dependência está preenchida
    if (field.targetField && dependencies) {
      const dependencyValue = dependencies[field.targetField];
      if (!dependencyValue) {
        setOptions([]);
        lastLoadKeyRef.current = loadKey;
        return;
      }
    }

    try {
      setLoading(true);
      loadingRef.current = true;
      setError(null);

      let data: FieldOption[] = [];

      if (field.sourceDataType === "DOMAIN") {
        // Busca dados de domínio
        // Se sourceData parece ser um endpoint completo (começa com http ou /), usa como API
        if (field.sourceData.startsWith("http") || field.sourceData.startsWith("/")) {
          // Trata como API quando sourceData é um endpoint completo
          data = await fetchApiData(field.sourceData, field.provider || null, {});
        } else {
          // Usa a função de domínio padrão
          data = await fetchDomainData(field.sourceData);
        }
      } else if (field.sourceDataType === "API") {
        // Busca dados de API
        // Se tem targetField, passa o valor como parâmetro
        const params: Record<string, any> = {};
        if (field.targetField && dependencies) {
          const dependencyValue = dependencies[field.targetField];
          // Para campos como brand, precisa buscar o ID
          // Se o sourceData tem {{id}}, substitui
          if (field.sourceData.includes("{{id}}")) {
            // Tenta buscar o ID do valor selecionado
            // Primeiro tenta buscar da API de brands para obter o ID
            if (field.targetField === "brand") {
              try {
                const brandsResponse = await fetch("/api/brands");
                if (brandsResponse.ok) {
                  const brands = await brandsResponse.json();
                  const brand = brands.find((b: any) => b.name === dependencyValue);
                  if (brand) {
                    params.id = brand.id;
                  } else {
                    params.id = dependencyValue; // Fallback
                  }
                } else {
                  params.id = dependencyValue; // Fallback
                }
              } catch {
                params.id = dependencyValue; // Fallback
              }
            } else {
              params.id = dependencyValue;
            }
          } else {
            // Se não tem {{id}}, passa o valor diretamente
            params[field.targetField] = dependencyValue;
          }
        }
        data = await fetchApiData(field.sourceData, field.provider || null, params);
      }

      setOptions(data);
      lastLoadKeyRef.current = loadKey;
    } catch (err) {
      console.error(`Erro ao carregar dados para campo ${field.name}:`, err);
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      setOptions([]);
      lastLoadKeyRef.current = loadKey;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [field, dependencies, getLoadKey]);

  useEffect(() => {
    const loadKey = getLoadKey();
    // Só recarrega se a chave mudou
    if (lastLoadKeyRef.current !== loadKey) {
      loadData();
    }
  }, [loadData, getLoadKey]);

  return {
    options,
    loading,
    error,
    refresh: loadData,
  };
}
