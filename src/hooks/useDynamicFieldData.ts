import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchDomainData,
  fetchSessionData,
  FieldOption,
} from "@/service/dynamicFieldService";
import { fetchDynamicApiData } from "@/service/dynamicApiService";

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
          data = await fetchDynamicApiData(
            field.sourceData,
            field.provider || null,
            undefined,
            dependencies
          );
        } else {
          // Usa a função de domínio padrão
          data = await fetchDomainData(field.sourceData);
        }
      } else if (field.sourceDataType === "API") {
        let targetValue: string | number | undefined;

        if (field.targetField && dependencies) {
          const dependencyValue = dependencies[field.targetField];
          if (dependencyValue !== undefined && dependencyValue !== null) {
            targetValue = dependencyValue;

            // Para campos de marca, tentar resolver o ID numérico
            if (field.targetField === "brand" && typeof dependencyValue === "string") {
              try {
                const brandsResponse = await fetch("/api/brands");
                if (brandsResponse.ok) {
                  const brands = await brandsResponse.json();
                  const brand = brands.find(
                    (b: any) =>
                      b.name === dependencyValue ||
                      String(b.id) === dependencyValue
                  );
                  if (brand) {
                    targetValue = brand.id;
                  }
                }
              } catch {
                targetValue = dependencyValue;
              }
            }
          }
        }

        data = await fetchDynamicApiData(
          field.sourceData,
          field.provider || null,
          targetValue,
          dependencies
        );
      }

      setOptions(data);
      lastLoadKeyRef.current = loadKey;
      setError(null); // Limpa erro se carregou com sucesso
    } catch (err) {
      console.error(`Erro ao carregar dados para campo ${field.name}:`, err);
      // Não faz throw, apenas mostra mensagem amigável no campo
      setError("Sem dados no momento");
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
