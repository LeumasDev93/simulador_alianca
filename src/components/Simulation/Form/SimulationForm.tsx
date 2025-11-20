/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicFormField from "./DynamicFormField";
import FormActions from "./FormActions";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import { LoadingContainer } from "../../ui/loading-container";
import { useProductDetails } from "@/hooks/useProdutsDetails";
import { Tabs, TabsContent, TabsList } from "@radix-ui/react-tabs";
import { FaCarAlt } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import { fetchSimulation } from "@/service/simulationService";
import { fetchDynamicSimulation } from "@/service/dynamicSimulationService";
import { getSafeGridClass } from "@/lib/utils";
import { validateFieldPattern } from "@/lib/validations";
import { fetchVehicleBrands } from "@/service/marcaService";
import { fetchVehicleModels } from "@/service/modeloService";
import { SimulationResults } from "../SimulationResults";
import { ModalContratacao } from "../ModalContratacao";
import { InstallmentValue, SimulationResponse } from "@/types/typesData";
// import { useSimulationActivity } from "@/lib/activityExamples";

import * as RiIcons from "react-icons/ri";
import * as MdIcons from "react-icons/md";
import * as AiIcons from "react-icons/ai";

const iconPacks: Record<string, any> = {
  Ri: RiIcons,
  Fa: FaIcons,
  Md: MdIcons,
  Ai: AiIcons,
};

export function getDynamicIcon(
  iconName?: string | null,
  className: string = "w-6 h-6 md:w-8 md:h-8"
): JSX.Element | null {
  if (!iconName) return null; // Se for null, undefined ou vazio, retorna null

  const normalized = iconName.trim();
  if (!normalized) return null;

  const prefix = normalized.slice(0, 2); // Ex: FaUser -> Fa
  const icons = iconPacks[prefix];
  if (!icons) return null;

  const IconComponent = icons[normalized];
  return IconComponent ? <IconComponent className={className} /> : null;
}

interface SimulationFormProps {
  productId: string;
  onClose?: () => void;
  reset: () => void;
  initialData?: any; // Dados iniciais da simulação para preencher o formulário
}

export default function SimulationForm({
  productId,
  onClose,
  reset,
  initialData,
}: SimulationFormProps) {
  const router = useRouter();
  const { product, loading, error } = useProductDetails(productId);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [models, setModels] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setError] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Previne envios duplicados
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] =
    useState<InstallmentValue | null>(null);
  const [lastSimulationDetails, setLastSimulationDetails] =
    useState<SimulationResponse | null>(null);
  
  // Load vehicle brands when token available or brand changes
  useEffect(() => {
    const loadBrands = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchVehicleBrands(); // Passa token se precisar autenticar
        setBrands(data);

        // Se o campo brand já estiver preenchido no formValues, atualiza selectedBrandId
        if (formValues.brand) {
          const selectedBrand = data.find(
            (brand) => brand.name === formValues.brand
          );
          if (selectedBrand) {
            setSelectedBrandId(selectedBrand.id);
            // Carregar modelos da marca selecionada
            loadModels(selectedBrand.id);
          } else {
            setSelectedBrandId(null);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar marcas:", err);
        setError("Erro ao carregar marcas. Tente novamente mais tarde.");
        setBrands([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrands();
  }, [formValues.brand]);

  // Função para carregar modelos
  const loadModels = async (brandId: number) => {
    try {
      const data = await fetchVehicleModels(brandId);
      setModels(data);
    } catch (err) {
      console.error("Erro ao buscar modelos:", err);
      setModels([]);
    }
  };

  // Carregar modelos quando marca for selecionada
  useEffect(() => {
    if (selectedBrandId) {
      loadModels(selectedBrandId);
    } else {
      setModels([]);
    }
  }, [selectedBrandId]);

  // Inicializa valores do formulário
  useEffect(() => {
    if (!product) return;
    const tabs = (product.tabs || []) as any[];
    const initialValues: Record<string, any> = {};
    
    // Inicializa valores padrão dos campos
    tabs.forEach((tab: any) => {
      tab.form.fields.forEach((field: any) => {
        // Se tem defaultValue, usa ele
        if (field.defaultValue) {
          initialValues[field.name] = field.defaultValue;
        } else {
          initialValues[field.name] = "";
        }
      });
    });
    
    setFormValues(initialValues);
    if (tabs.length > 0) setActiveTab(tabs[0].title);
  }, [product]);

  // Atualiza valores do formulário e limpa erro no campo
  const handleFieldChange = (name: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Valida campos obrigatórios e padrões de uma aba
  const validateTabFields = (tab: any): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tab || !tab.form || !tab.form.fields) {
      console.log("Tab inválido ou sem campos");
      return true; // Se não tem campos, considera válido
    }

    tab.form.fields.forEach((field: any) => {
      const value = formValues[field.name] || "";
      const isRequired = field.required === true; // Apenas se explicitamente true
      
      // Validação de campo obrigatório
      if (isRequired && (!value || value.trim() === "")) {
        newErrors[field.name] = "Este campo é obrigatório.";
        return; // Pula para próximo campo
      }

      // Validação de padrão (pattern) se o campo tem valor
      // Para campos NIF e telefone, valida sempre (mesmo sem pattern)
      const isNIFOrPhone = field.name.toLowerCase() === "nif" || 
                          field.name.toLowerCase() === "mobiles" ||
                          field.name.toLowerCase() === "telefone" ||
                          field.name.toLowerCase() === "phone" ||
                          field.name.toLowerCase() === "mobile";
      
      if (value && value.trim() !== "" && (field.pattern || isNIFOrPhone)) {
        const validation = validateFieldPattern(value, field.pattern, field.name);
        if (!validation.isValid) {
          newErrors[field.name] = validation.error || "Valor não corresponde ao formato esperado.";
        }
      }
    });

    console.log("Validação concluída. Erros encontrados:", Object.keys(newErrors).length, newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Avança para a próxima aba ou finaliza a simulação
  const goToNextTab = async () => {
    console.log("goToNextTab chamado");
    if (!product) {
      console.log("Sem produto, retornando");
      return;
    }

    const tabs = (product.tabs || []) as any[];
    const currentIndex = tabs.findIndex(
      (tab: any) => tab.title === activeTab
    );
    const currentTab = tabs[currentIndex];

    console.log("Validando campos da aba:", currentTab?.title, "Índice:", currentIndex);
    if (!validateTabFields(currentTab)) {
      console.log("Validação falhou, erros:", errors);
      return;
    }

    if (currentIndex === tabs.length - 1) {
      console.log("Última aba - iniciando simulação");
      // Previne envios duplicados - verifica tempo desde último envio
      const now = Date.now();
      if (isSubmitting) {
        console.log("Já existe uma simulação em andamento. Aguarde...");
        return;
      }
      
      // Previne envios em menos de 3 segundos
      if (now - lastSubmitTime < 3000) {
        console.log("Aguarde alguns segundos antes de enviar novamente.");
        setSimulationError("Por favor, aguarde alguns segundos antes de enviar novamente.");
        return;
      }

      try {
        console.log("Iniciando simulação com valores:", formValues);
        setIsSubmitting(true);
        setIsLoadingSimulation(true);
        setSimulationError(null);
        setLastSubmitTime(now);

        // Usa simulação dinâmica se o produto tem bodyTemplate
        let data;
        if (product.bodyTemplate) {
          data = await fetchDynamicSimulation(
            product.bodyTemplate,
            formValues,
            setIsLoading
          );
        } else {
          // Fallback para simulação estática
          data = await fetchSimulation(
            formValues as any,
            setIsLoading
          );
        }
        
        // Verificar se a resposta tem erro
        if (data?.hasError) {
          // Pega o primeiro erro do array errors, ou error string, ou message
          let errorMessage = "Erro ao executar simulação.";
          if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            errorMessage = data.errors[0];
          } else if (data?.error && typeof data.error === 'string' && data.error.trim() !== "") {
            errorMessage = data.error;
          } else if (data?.message && typeof data.message === 'string' && data.message.trim() !== "") {
            errorMessage = data.message;
          }
          setSimulationError(errorMessage);
          setSimulationResult(null);
          setIsModalOpen(false);
        } else {
          setSimulationResult(data);
          setLastSimulationDetails(data);
          setIsModalOpen(true);
          setSimulationError(null);
        }
        // Registro de atividade desativado conforme solicitação
      } catch (error: any) {
        console.error("Erro na simulação:", error);
        setSimulationError(error.message || "Erro ao executar simulação.");
      } finally {
        setIsLoadingSimulation(false);
        setIsSubmitting(false);
      }
      return;
    }

    const nextTab = tabs[currentIndex + 1];
    if (nextTab) {
      setActiveTab(nextTab.title);
      setErrors({});
    }
  };

  // Volta para a aba anterior ou fecha o formulário
  const goToPreviousTab = () => {
    if (!product) return;

    const tabs = (product.tabs || []) as any[];
    const currentIndex = tabs.findIndex(
      (tab: any) => tab.title === activeTab
    );
    const previousTab = tabs[currentIndex - 1];
    if (previousTab) {
      setActiveTab(previousTab.title);
      setErrors({});
    } else {
      onClose?.();
    }
  };

  const handleSelectInstallment = (installment: InstallmentValue) => {
    console.log("🔍 handleSelectInstallment chamado com formValues:", formValues);
    setSelectedInstallment(installment);
    setIsContractModalOpen(true);
  };

  // Debug: log quando modal é aberto
  useEffect(() => {
    if (isContractModalOpen) {
      console.log("🔍 Modal de contratação aberto - formValues:", formValues);
      console.log("🔍 Modal de contratação aberto - lastSimulationDetails:", lastSimulationDetails);
    }
  }, [isContractModalOpen, formValues, lastSimulationDetails]);

  // Função para cancelar tudo e voltar à página inicial
  const handleCancel = () => {
    // Limpa todos os estados
    setFormValues({});
    setErrors({});
    setSimulationResult(null);
    setSimulationError(null);
    setIsModalOpen(false);
    setIsContractModalOpen(false);
    setSelectedInstallment(null);
    setLastSimulationDetails(null);
    
    // Chama reset se disponível
    if (reset) {
      reset();
    }
    
    // Volta para a página inicial
    router.push('/');
  };

  // Muda a aba ao clicar no menu de abas, validando antes se for avanço
  const handleTabChange = (nextTabTitle: string) => {
    if (!product) return;

    const tabs = (product.tabs || []) as any[];
    const currentIndex = tabs.findIndex(
      (tab: any) => tab.title === activeTab
    );
    const nextIndex = tabs.findIndex(
      (tab: any) => tab.title === nextTabTitle
    );

    if (nextIndex === currentIndex) return;

    // Se for para aba anterior, permite direto
    if (nextIndex < currentIndex) {
      setActiveTab(nextTabTitle);
      return;
    }

    // Se for para aba seguinte, valida os campos da aba atual
    const currentTab = tabs[currentIndex];
    if (!validateTabFields(currentTab)) return;

    setActiveTab(nextTabTitle);
    setErrors({});
  };

  // Submit no formulário atual (não usado no seu fluxo, mas mantido)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentTab = (product?.tabs as any[] | undefined)?.find(
      (tab: any) => tab.title === activeTab
    );
    if (!currentTab) return;

    if (!validateTabFields(currentTab)) return;

    console.log("Formulário enviado com valores:", formValues);
  };

  if (loading) return <LoadingContainer message="CARREGANDO FORMULÁRIO..." />;
  if (error)
    return <ErrorState error={error} onClose={onClose || (() => {})} />;
  if (!product || !product.tabs || product.tabs.length === 0) return <EmptyState />;

  const tabs = product.tabs as any[];

  const currentIndex = tabs.findIndex(
    (tab: any) => tab.title === activeTab
  );

  const HeaderIcon = getDynamicIcon(product?.webIcon, "w-8 h-8 text-blue-950");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen ">
      {/* Header */}
      <div className="relative border-b-2 border-[#002B5B] flex justify-center">
       
        <div className="flex flex-col items-center justify-center bg-gray-50/70 backdrop-blur-sm p-3 md:px-8 md:py-6 shadow-xl rounded-t-xl w-full sm:w-2/3 lg:w-1/2 relative items-center gap-1">
          {HeaderIcon || <FaCarAlt className="w-8 h-8 " />}
          <div className="text-blue-950">
           
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#002B5B] uppercase text-center">
              {product.name || "Simulador Seguro"}
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs List */}
      <div className="w-full py-6">
        <TabsList className="flex items-center justify-between w-full relative">
          {tabs.map((tab: any, index: number) => {
            const isActive = activeTab === tab.title;
            const activeIndex = tabs.findIndex(
              (t: any) => t.title === activeTab
            );
            const isCompleted = activeIndex > index;
            const isLast = index === tabs.length - 1;

            return (
              <div
                key={tab.title}
                className="flex-1 flex flex-col items-center relative"
              >
                {!isLast && (
                  <div className="absolute top-7 left-1/2 w-full h-1 -translate-y-1/2">
                    <div
                      className={`h-1 transition-all duration-300 ${
                        isCompleted ? "bg-[#002B5B]" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                )}

                {/* Botão do step */}
                <button
                  type="button"
                  onClick={() => handleTabChange(tab.title)}
                  className={`
              z-10 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full transition-all duration-300
              ${
                isActive || isCompleted
                  ? "bg-[#002B5B] text-white"
                  : "border-2 border-gray-300 bg-white text-gray-400"
              }
            `}
                >
                  <span className="flex items-center justify-center">
                    {getDynamicIcon(tab.webIcon)}
                  </span>
                </button>

                <span
                  className={`mt-2 text-xs md:text-lg text-center font-semibold
              ${
                isActive || isCompleted
                  ? "text-[#002B5B] font-bold"
                  : "text-gray-400"
              }
            `}
                >
                  {tab.title}
                </span>
              </div>
            );
          })}
        </TabsList>
      </div>

      {/* Tabs Content */}
      {tabs.map((tab: any) => (
        <TabsContent key={tab.title} value={tab.title}>
          <form onSubmit={handleSubmit}>
            {/* Mensagem de erro sempre no topo */}
            {simulationError && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{simulationError}</p>
                  </div>
                </div>
              </div>
            )}
          
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 mt-4 sm:mt-6">
              <div className="border-b border-gray-200 pb-4 sm:pb-6 lg:pb-8 last:border-0">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:${getSafeGridClass(
                    tab.form.webGridSize
                  )} gap-3 sm:gap-4 lg:gap-6`}
                >
                  {tab.form.fields
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((field: any) => {
                      const fieldValue = formValues[field.name] || "";
                      console.log(
                        `Renderizando campo ${field.name} com valor:`,
                        fieldValue
                      );
                      return (
                        <DynamicFormField
                          key={field.name}
                          field={field}
                          value={fieldValue}
                          error={errors[field.name]}
                          onChange={(value: string) =>
                            handleFieldChange(field.name, value)
                          }
                          dependencies={formValues}
                          isPublic={Boolean(product.public)}
                        />
                      );
                    })}
                </div>
              </div>
            </div>

            <FormActions
              onNext={goToNextTab}
              onPrevious={currentIndex > 0 ? goToPreviousTab : undefined}
              onCancel={handleCancel}
              submitting={isLoadingSimulation || isSubmitting}
              nextLabel={
                currentIndex === tabs.length - 1
                  ? (isSubmitting || isLoadingSimulation ? "PROCESSANDO..." : "SIMULAR")
                  : "AVANÇAR ▶"
              }
            />
          </form>
        </TabsContent>
      ))}

                  {/* Só renderiza SimulationResults se não houver erro e houver resultado */}
                  {isModalOpen && simulationResult && !simulationError && (
                    <SimulationResults
                      data={simulationResult}
                      isOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                      reset={() => {
                        setIsModalOpen(false);
                        reset();
                      }}
                      onSelectInstallment={handleSelectInstallment}
                    />
                  )}

      <ModalContratacao
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        simulationDetails={lastSimulationDetails}
        selectedInstallment={selectedInstallment}
        formValues={formValues}
        productName={product?.name}
        onCloseSimulationResults={() => setIsModalOpen(false)}
      />
    </Tabs>
  );
}
