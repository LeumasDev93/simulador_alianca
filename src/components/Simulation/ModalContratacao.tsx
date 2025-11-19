"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaFileInvoiceDollar, FaSpinner, FaUpload, FaCheckCircle, FaWhatsapp } from "react-icons/fa";
import { X, Trash2 } from "lucide-react";
import { PaymentSecurityLogos } from "../ui/PaymentSecurityLogos";
import {
  InstallmentValue,
  SimulationResponse,
} from "@/types/typesData";
import { formatCurrency } from "@/lib/utils";

type DocumentRequirement = {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  supportedTypes?: string[];
  attach_type?: string; // Tipo de anexo da API
};

interface ModalContratacaoProps {
  isOpen: boolean;
  onClose: () => void;
  simulationDetails?: SimulationResponse | null;
  selectedInstallment?: InstallmentValue | null;
  formValues?: Record<string, any>;
  productName?: string;
  onCloseSimulationResults?: () => void; // Callback para fechar modal de resultados
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("pt-PT");
  } catch {
    return value;
  }
};

export function ModalContratacao({
  isOpen,
  onClose,
  simulationDetails,
  selectedInstallment,
  formValues = {},
  productName,
  onCloseSimulationResults,
}: ModalContratacaoProps) {
  const [activeTab, setActiveTab] = useState<"dados" | "documentos">("dados");
  const [documents, setDocuments] = useState<DocumentRequirement[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>(
    {}
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [successData, setSuccessData] = useState<{
    policyDTO?: any;
    invoiceDTO?: any;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Debug: log dos dados recebidos
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 ModalContratacao - Dados recebidos:", {
        isOpen,
        productName,
        formValues,
        simulationDetails,
        selectedInstallment,
        formValuesKeys: Object.keys(formValues),
      });
    }
  }, [isOpen, productName, formValues, simulationDetails, selectedInstallment]);

  const displayInstallment = useMemo(() => {
    if (!selectedInstallment) return "-";
    switch (selectedInstallment.name) {
      case "A":
        return "Anual";
      case "S":
        return "Semestral";
      case "T":
        return "Trimestral";
      case "M":
        return "Mensal";
      default:
        return selectedInstallment.name;
    }
  }, [selectedInstallment]);

  // Buscar documentos da API quando o modal abrir
  useEffect(() => {
    if (!isOpen) return;
    
    setStatus("idle");
    setFeedbackMessage(null);
    setActiveTab("dados");
    setUploadedFiles({});

    // Buscar documentos da API se tiver productName
    const fetchDocuments = async () => {
      if (!productName) {
        console.log("⚠️ Nenhum productName fornecido");
        setDocuments([]);
        setLoadingDocuments(false);
        return;
      }

      setLoadingDocuments(true);
      try {
        console.log(`🔍 Buscando documentos para produto: ${productName}`);
        const response = await fetch(
          `/api/category/documents?name=${encodeURIComponent(productName)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `Erro ${response.status}` };
          }
          console.error("❌ Erro ao buscar documentos:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          setDocuments([]);
          setFeedbackMessage(
            errorData.error || `Erro ao buscar documentos: ${response.status}`
          );
          setStatus("error");
          return;
        }

        const data = await response.json();
        console.log("✅ Documentos recebidos da API:", data);

        // Normalizar os dados da API para o formato esperado
        if (data.results && Array.isArray(data.results)) {
          const normalizedDocs: DocumentRequirement[] = data.results.map(
            (doc: any) => ({
              id: doc.id || doc.documentId || doc.name?.toLowerCase().replace(/\s+/g, "-"),
              // Usa description como nome principal (mais amigável), fallback para name
              name: doc.description || doc.name || "Documento",
              description: doc.description || doc.name || null,
              required: doc.required !== undefined ? doc.required : true,
              supportedTypes: doc.supported_types || doc.supportedTypes || ["pdf"],
              attach_type: doc.attach_type || doc.attachType || doc.id, // Usa attach_type da API ou fallback para id
            })
          );
          setDocuments(normalizedDocs);
          console.log("✅ Documentos normalizados:", normalizedDocs);
        } else if (Array.isArray(data)) {
          // Se a resposta for um array direto
          const normalizedDocs: DocumentRequirement[] = data.map((doc: any) => ({
            id: doc.id || doc.documentId || doc.name?.toLowerCase().replace(/\s+/g, "-"),
            // Usa description como nome principal (mais amigável), fallback para name
            name: doc.description || doc.name || "Documento",
            description: doc.description || doc.name || null,
            required: doc.required !== undefined ? doc.required : true,
            supportedTypes: doc.supported_types || doc.supportedTypes || ["pdf"],
            attach_type: doc.attach_type || doc.attachType || doc.id, // Usa attach_type da API ou fallback para id
          }));
          setDocuments(normalizedDocs);
        } else {
          console.warn("⚠️ Formato de resposta inesperado");
          setDocuments([]);
        }
      } catch (error) {
        console.error("❌ Erro ao buscar documentos:", error);
        setDocuments([]);
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : "Erro ao buscar documentos. Tente novamente."
        );
        setStatus("error");
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [isOpen, productName]);

  const handleFileChange = (docId: string, file: File | null) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docId]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    const missingDocs = documents.filter(
      (doc) => doc.required && !uploadedFiles[doc.id]
    );

    if (missingDocs.length > 0) {
      setStatus("error");
      setFeedbackMessage(
        `Envie os documentos obrigatórios: ${missingDocs
          .map((doc) => doc.name)
          .join(", ")}.`
      );
      return;
    }

    try {
      setStatus("loading");
      setFeedbackMessage(null);

      // Token será obtido no servidor via getServerSession
      const reference = simulationDetails?.reference;
      const idSimulationTel = simulationDetails?.idSimulationTel;

      if (!reference || !idSimulationTel) {
        throw new Error("Dados da simulação não encontrados.");
      }

      // Enviar arquivos um a um
      const filesToUpload = Object.entries(uploadedFiles).filter(
        ([, file]) => file !== null
      );

      if (filesToUpload.length === 0) {
        throw new Error("Nenhum arquivo para enviar.");
      }

      console.log(`📎 Enviando ${filesToUpload.length} arquivo(s)...`);

      for (const [docId, file] of filesToUpload) {
        if (!file) continue;

        // Encontrar o documento para obter o attach_type
        const doc = documents.find((d) => d.id === docId);
        if (!doc) {
          console.warn(`⚠️ Documento não encontrado para ID: ${docId}`);
          continue;
        }

        // Usar attach_type da API ou fallback para docId
        const attachType = doc.attach_type || docId;

        // Criar FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("reference", reference);
        formData.append("system", "ALIANCA_DIGITAL");
        formData.append("attachType", attachType); // Usar attach_type da API
        formData.append("attachTo", "idSimulationTel");
        formData.append("refAttachTo", String(idSimulationTel));

        console.log(`📤 Enviando arquivo: ${file.name} (attachType: ${attachType})`);

        // Enviar para a rota do servidor (evita CORS)
        const response = await fetch("/api/contract/attach", {
          method: "POST",
          // Não definir Content-Type, o browser define automaticamente com boundary para FormData
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `Erro ${response.status}` };
          }
          console.error(`❌ Erro ao enviar arquivo ${file.name}:`, errorData);
          throw new Error(
            `Erro ao enviar arquivo ${file.name}: ${errorData.error || errorData.message || `Erro ${response.status}`}`
          );
        }

        const result = await response.json();
        console.log(`✅ Arquivo ${file.name} enviado com sucesso:`, result);
      }

      // Após enviar todos os documentos, chamar a API de contrato
      console.log("📋 Todos os documentos enviados. Chamando API de contrato...");
      
      const contractResponse = await fetch("/api/contract/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idSimulationTel: idSimulationTel,
          idContract: (simulationDetails as any)?.idContract,
          proposalReference: reference,
          newStartDate: new Date().toISOString(),
          installment: selectedInstallment?.name || "A",
          useDirectDebit: false,
        }),
      });

      if (!contractResponse.ok) {
        const errorData = await contractResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao aceitar contrato");
      }

      const contractResult = await contractResponse.json();
      console.log("✅ Contrato aceito:", contractResult);

      // Verificar se tem erro (mesmo que hasError seja false, pode ter mensagem de erro)
      // Se error tiver conteúdo (string não vazia), trata como erro
      if (contractResult.hasError || (contractResult.error && contractResult.error.trim() !== "")) {
        // Se tiver erro, mantém o modal aberto e mostra o erro
        setStatus("error");
        setFeedbackMessage(contractResult.error || "Erro ao aceitar contrato");
        return; // Não fecha o modal, deixa aberto para mostrar o erro
      }

      // Se chegou aqui, não tem erro
      // Verificar se tem policyDTO e invoiceDTO (sucesso completo)
      if (contractResult.policyDTO && contractResult.invoiceDTO) {
        setSuccessData({
          policyDTO: contractResult.policyDTO,
          invoiceDTO: contractResult.invoiceDTO,
        });
        
        // NÃO fechar modais - mostrar modal de sucesso por cima
        setShowSuccessModal(true);
      } else {
        // Sucesso parcial ou sem invoice - mostrar mensagem no modal atual
        setStatus("success");
        setFeedbackMessage(
          "Contrato aceito e documentos enviados com sucesso! Nossa equipe entrará em contato em breve."
        );
      }
    } catch (error) {
      setStatus("error");
      setFeedbackMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar contratação. Tente novamente."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#002855] to-[#004080] text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <FaFileInvoiceDollar />
              Contratar Seguro
            </h2>
            <p className="text-sm text-white/80">
              Referência #{simulationDetails?.reference || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X />
          </button>
        </div>

        {/* Mensagem de erro no topo */}
        {status === "error" && feedbackMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">
                  {feedbackMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase">ID Simulação</p>
              <p className="text-sm font-semibold text-gray-900">
                {simulationDetails?.idSimulationTel || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Fracionamento</p>
              <p className="text-sm font-semibold text-gray-900">
                {displayInstallment}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Valor</p>
              <p className="text-lg font-semibold text-[#002855]">
                {selectedInstallment?.value
                  ? formatCurrency(
                      selectedInstallment.value,
                      simulationDetails?.currency || "CVE"
                    )
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Produto</p>
              <p className="text-sm font-semibold text-gray-900">
                {simulationDetails?.product?.name || "Automóvel"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("dados")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "dados"
                  ? "text-[#002855] border-b-2 border-[#002855]"
                  : "text-gray-500"
              }`}
            >
              Dados da simulação
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("documentos")}
              className={`pb-2 text-sm font-medium ${
                activeTab === "documentos"
                  ? "text-[#002855] border-b-2 border-[#002855]"
                  : "text-gray-500"
              }`}
            >
              Documentos
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "dados" && (
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                  {/* Nome do Tomador */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nome do Tomador
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={String(
                        formValues?.name ||
                        (simulationDetails as any)?.client?.name ||
                        ""
                      ) || "—"}
                      disabled
                    />
                  </div>
                  
                  {/* NIF */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      NIF
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={String(
                        formValues?.nif ||
                        (simulationDetails as any)?.client?.nif ||
                        ""
                      ) || "—"}
                      disabled
                    />
                  </div>
                  
                  {/* BI */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      BI
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={String(
                        formValues?.bi ||
                        (simulationDetails as any)?.client?.bi ||
                        ""
                      ) || "—"}
                      disabled
                    />
                  </div>
                  
                  {/* Passaporte */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Passaporte
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={String(
                        formValues?.passport ||
                        (simulationDetails as any)?.client?.passport ||
                        ""
                      ) || "—"}
                      disabled
                    />
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={(() => {
                        // Prioriza dados do formulário
                        if (formValues?.emails) {
                          const email = Array.isArray(formValues.emails)
                            ? formValues.emails[0]
                            : formValues.emails;
                          return String(email || "");
                        }
                        if (formValues?.email) {
                          return String(formValues.email);
                        }
                        // Fallback para dados da simulação
                        if ((simulationDetails as any)?.client?.emails) {
                          const emails = (simulationDetails as any).client.emails;
                          const email = Array.isArray(emails) ? emails[0] : emails;
                          return String(email || "");
                        }
                        if ((simulationDetails as any)?.client?.primaryEmailContact) {
                          return String((simulationDetails as any).client.primaryEmailContact);
                        }
                        return "—";
                      })()}
                      disabled
                    />
                  </div>
                  
                  {/* Telefone/Telemóvel */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Telefone/Telemóvel
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                      value={(() => {
                        // Prioriza dados do formulário
                        if (formValues?.mobiles) {
                          const mobile = Array.isArray(formValues.mobiles)
                            ? formValues.mobiles[0]
                            : formValues.mobiles;
                          return String(mobile || "");
                        }
                        if (formValues?.mobile) {
                          return String(formValues.mobile);
                        }
                        if (formValues?.telefone) {
                          return String(formValues.telefone);
                        }
                        // Fallback para dados da simulação
                        if ((simulationDetails as any)?.client?.mobiles) {
                          const mobiles = (simulationDetails as any).client.mobiles;
                          const mobile = Array.isArray(mobiles) ? mobiles[0] : mobiles;
                          return String(mobile || "");
                        }
                        if ((simulationDetails as any)?.client?.primaryMobileContact) {
                          return String((simulationDetails as any).client.primaryMobileContact);
                        }
                        return "—";
                      })()}
                      disabled
                    />
                  </div>
                  {formValues.gender && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Género
                      </label>
                      <input
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                        value={
                          formValues.gender === "M"
                            ? "Masculino"
                            : formValues.gender === "F"
                            ? "Feminino"
                            : formValues.gender
                        }
                        disabled
                      />
                    </div>
                  )}
                  {formValues.maritalStatus && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Estado Civil
                      </label>
                      <input
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-base focus:outline-none focus:border-[#002855] transition-colors"
                        value={formValues.maritalStatus || "—"}
                        disabled
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "documentos" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Documentos requeridos
                </h3>
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-[#002855] mr-3" />
                    <span className="text-gray-600">Carregando documentos...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum documento necessário para este produto.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border-2 border-gray-200 rounded-lg p-5 flex flex-col gap-4 bg-gray-50 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">
                            {doc.name || doc.description || "Documento"}
                            {doc.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </p>
                          {doc.description && doc.description !== doc.name && (
                            <p className="text-sm text-gray-600 mt-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        {uploadedFiles[doc.id] && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 font-semibold">
                              ✓ Anexado
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFileChange(doc.id, null);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg px-6 py-8 cursor-pointer transition-colors text-base ${
                        uploadedFiles[doc.id]
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-[#002855] hover:bg-blue-50 text-gray-700"
                      }`}>
                        <FaUpload className={`text-2xl ${uploadedFiles[doc.id] ? "text-green-600" : "text-gray-400"}`} />
                        <span className="text-center font-medium">
                          {uploadedFiles[doc.id]?.name ||
                            `Clique para selecionar arquivo ${doc.supportedTypes?.length ? `(${doc.supportedTypes.join(", ").toUpperCase()})` : ""}`}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept={
                            doc.supportedTypes
                              ?.map((type) => `.${type}`)
                              .join(",") || undefined
                          }
                          onChange={(event) =>
                            handleFileChange(
                              doc.id,
                              event.target.files?.[0] ?? null
                            )
                          }
                        />
                      </label>
                      {doc.supportedTypes && doc.supportedTypes.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Formatos aceitos: {doc.supportedTypes.map(t => t.toUpperCase()).join(", ")}
                        </p>
                      )}
                    </div>
                    ))}
                  </div>
                )}
              </section>
            )}

        
          </form>
        </div>

        {/* Footer fixo com botões */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
          
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                handleSubmit(fakeEvent);
              }}
              className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#002256] flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Enviando solicitação...
                </>
              ) : status === "success" ? (
                "Solicitação enviada"
              ) : (
                "Enviar solicitação"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso - aparece por cima dos outros modais */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-[1300] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-4xl text-green-600" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Contrato Criado com Sucesso!
              </h2>
              
              <p className="text-center text-gray-600 mb-6">
                Seu seguro foi contratado com sucesso. Você pode pagar agora ou entrar em contato conosco.
              </p>

              {successData.invoiceDTO && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Referência:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {successData.invoiceDTO.referencia || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="text-sm font-semibold text-[#002855]">
                        {successData.invoiceDTO.value
                          ? formatCurrency(successData.invoiceDTO.value, simulationDetails?.currency || "CVE")
                          : "-"}
                      </span>
                    </div>
                    {successData.policyDTO && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nº Contrato:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {successData.policyDTO.contractNumber || "-"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentConfirm(true);
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <FaFileInvoiceDollar />
                  Pagar Agora
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    // Abrir WhatsApp
                    const phoneNumber = "+238"; // Ajustar conforme necessário
                    const message = encodeURIComponent(
                      `Olá! Gostaria de mais informações sobre o contrato ${successData.policyDTO?.contractNumber || successData.invoiceDTO?.referencia || ""}.`
                    );
                    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
                  }}
                  className="w-full px-4 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="text-xl" />
                  Entrar em Contato
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Fechar todos os modais
                    setShowSuccessModal(false);
                    if (onCloseSimulationResults) {
                      onCloseSimulationResults();
                    }
                    onClose();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pagamento */}
      {showPaymentConfirm && successData && (
        <div className="fixed inset-0 z-[1400] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Confirmar Pagamento
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Referência:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {successData.invoiceDTO?.referencia || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className="text-sm font-semibold text-[#002855]">
                        {successData.invoiceDTO?.value
                          ? formatCurrency(successData.invoiceDTO.value, simulationDetails?.currency || "CVE")
                          : "-"}
                      </span>
                    </div>
                    {successData.policyDTO && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nº Contrato:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {successData.policyDTO.contractNumber || "-"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        Informação Importante:
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Será redirecionado para a página segura de pagamento</li>
                        <li>Aceita cartões de crédito e débito</li>
                        <li>Receberá confirmação por email após o pagamento</li>
                        <li>O pagamento é processado de forma segura pelo SISP</li>
                      </ul>
                    </div>
                  </div>
                  <PaymentSecurityLogos className="mt-2 justify-center items-center" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentLoading) return;
                    setPaymentLoading(true);

                    try {
                      // 1. Obter token de pagamento
                      const tokenResponse = await fetch("/api/payment/token", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      });

                      if (!tokenResponse.ok) {
                        const errorData = await tokenResponse.json().catch(() => ({}));
                        throw new Error(errorData.error || "Erro ao obter token de pagamento");
                      }

                      const tokenData = await tokenResponse.json();
                      const paymentToken = tokenData.token || tokenData.access_token || tokenData.accessToken;

                      if (!paymentToken) {
                        throw new Error("Token de pagamento não encontrado na resposta");
                      }

                      // Log para debug - verificar estrutura da resposta
                      console.log("🔍 Token data recebido:", tokenData);

                      // 2. Preparar dados do formulário
                      const invoice = successData.invoiceDTO;
                      const amount = invoice?.value || 0;
                      const orderReference = invoice?.referencia || simulationDetails?.reference || "";
                      
                      // Obter dados do cliente do formulário
                      const clientName = formValues?.name || (simulationDetails as any)?.client?.name || "";
                      const clientNif = formValues?.nif || (simulationDetails as any)?.client?.nif || "";
                      const email = formValues?.email || 
                                   (Array.isArray(formValues?.emails) ? formValues.emails[0] : formValues?.emails) ||
                                   (simulationDetails as any)?.client?.primaryEmailContact || "";
                      const phoneNumber = formValues?.telefone || 
                                         formValues?.mobile ||
                                         (Array.isArray(formValues?.mobiles) ? formValues.mobiles[0] : formValues?.mobiles) ||
                                         (simulationDetails as any)?.client?.primaryMobileContact || "";
                      
                      // Remover código do país do telefone se presente
                      const cleanPhone = phoneNumber?.replace(/^\+238/, "").replace(/^238/, "").trim() || "";
                      
                      // Endereço (pode vir do formulário ou usar valores padrão)
                      const clientAddress = formValues?.address || formValues?.endereco || "teste";
                      const billAddrCity = formValues?.city || formValues?.cidade || "Praia";
                      // billAddrLine1 deve ter formato: "Rua Principal, 123," (com número e vírgula no final)
                      const billAddrLine1 = formValues?.address || formValues?.endereco || "Rua Principal, 123,";
                      const billAddrPostCode = formValues?.postalCode || formValues?.codigoPostal || "7600";

                      // Gerar ID único para transação (máximo 15 caracteres)
                      // Usar timestamp + número aleatório, limitado a 15 caracteres
                      const timestamp = Date.now().toString().slice(-10); // Últimos 10 dígitos do timestamp
                      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0'); // 5 dígitos
                      const channelTransactionId = (timestamp + randomNum).slice(0, 15); // Máximo 15 caracteres
                      
                      // Salvar referência e valor no localStorage para o callback
                      try {
                        localStorage.setItem("recibo_ref", encodeURIComponent(orderReference));
                        localStorage.setItem("payment_amount", String(amount));
                        console.log("✅ Dados salvos no localStorage para callback:", { orderReference, amount });
                      } catch (e) {
                        console.warn("⚠️ Não foi possível salvar no localStorage:", e);
                      }

                      // 3. Criar FormData para purchase
                      // IMPORTANTE: Os valores devem corresponder exatamente à imagem fornecida
                      const purchaseFormData = new FormData();
                      purchaseFormData.append("amount", String(amount));
                      purchaseFormData.append("languageMessages", "pt");
                      purchaseFormData.append("channelTransactionId", channelTransactionId);
                      purchaseFormData.append("provider", "SISP");
                      purchaseFormData.append("clientNif", clientNif);
                      purchaseFormData.append("clientName", clientName);
                      purchaseFormData.append("clientAddress", clientAddress);
                      purchaseFormData.append("email", email);
                      purchaseFormData.append("billAddrCity", billAddrCity);
                      // billAddrCountry = 608 (sem vírgula)
                      purchaseFormData.append("billAddrCountry", "608");
                      // billAddrLine1 = "Rua Principal, 123," (com número e vírgula no final)
                      purchaseFormData.append("billAddrLine1", billAddrLine1);
                      // billAddrPostCode = 7600 (sem vírgula)
                      purchaseFormData.append("billAddrPostCode", billAddrPostCode);
                      // phoneCode = 238 (sem vírgula)
                      purchaseFormData.append("phoneCode", "238");
                      // phoneNumber = número cliente (sem vírgula)
                      purchaseFormData.append("phoneNumber", cleanPhone);
                      // orderReference = referência de recibo (sem vírgula)
                      purchaseFormData.append("orderReference", orderReference);
                      purchaseFormData.append("token", paymentToken);
                      
                      // clientId = ju3Rt5EEDc2yQNxOsgJVBZrOszZx-aRB (do env NEXT_PUBLIC_PAYMENT_CLIENT_ID)
                      const clientId = process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID || "ju3Rt5EEDc2yQNxOsgJVBZrOszZx-aRB";
                      purchaseFormData.append("clientId", clientId);
                      console.log("✅ clientId adicionado ao form-data:", clientId);

                      // 4. Chamar API de purchase
                      // Enviar FormData diretamente
                      const purchaseResponse = await fetch("/api/payment/purchase", {
                        method: "POST",
                        // Não definir Content-Type, o browser define automaticamente com boundary para FormData
                        body: purchaseFormData,
                      });

                      if (!purchaseResponse.ok) {
                        const errorText = await purchaseResponse.text();
                        let errorData: any = {};
                        try {
                          errorData = JSON.parse(errorText);
                        } catch {
                          errorData = { error: errorText || `Erro ${purchaseResponse.status}` };
                        }
                        throw new Error(errorData.error || "Erro ao processar pagamento");
                      }

                      // 5. Obter HTML do SISP e abrir
                      const htmlContent = await purchaseResponse.text();
                      
                      // Processar HTML (remover escape characters se necessário)
                      let processedHtml = htmlContent;
                      if (htmlContent.includes('\\r\\n') || (htmlContent.includes('\\n') && !htmlContent.includes('\n'))) {
                        processedHtml = htmlContent
                          .replace(/\\r\\n/g, '\r\n')
                          .replace(/\\n/g, '\n')
                          .replace(/\\t/g, '\t')
                          .replace(/\\"/g, '"')
                          .replace(/\\'/g, "'");
                      }

                      // Criar blob e abrir em nova página
                      // A API do SISP retorna HTML que redireciona para /payment/callback
                      const blob = new Blob([processedHtml], { type: "text/html;charset=utf-8" });
                      const blobUrl = URL.createObjectURL(blob);
                      
                      // Verificar se está em iframe
                      const isInIframe = window.self !== window.top;
                      if (isInIframe && window.top) {
                        window.top.location.href = blobUrl;
                      } else {
                        window.location.href = blobUrl;
                      }

                      // Fechar modais após redirecionar
                      setShowPaymentConfirm(false);
                      setShowSuccessModal(false);
                      if (onCloseSimulationResults) {
                        onCloseSimulationResults();
                      }
                      onClose();
                    } catch (error) {
                      console.error("Erro ao processar pagamento:", error);
                      setFeedbackMessage(
                        error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente."
                      );
                      setStatus("error");
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FaFileInvoiceDollar />
                      Confirmar Pagamento
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentConfirm(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={paymentLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

