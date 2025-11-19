/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CircleAlert, CircleX, TriangleAlert } from "lucide-react";
import { CiCircleCheck } from "react-icons/ci";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [serverStatus, setServerStatus] = useState<string | undefined>(sp.get("server_status") || undefined);
  const [serverMessage, setServerMessage] = useState<string | undefined>(sp.get("server_message") || undefined);
  const [collectStatus, setCollectStatus] = useState<string | undefined>(sp.get("collect_status") || undefined);
  const [collectMessage, setCollectMessage] = useState<string | undefined>(sp.get("collect_message") || undefined);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [capturedRef, setCapturedRef] = useState<string | undefined>(undefined);
  const [capturedAmount, setCapturedAmount] = useState<number | undefined>(undefined);
  const [captureDone, setCaptureDone] = useState(false);
  

  const data = useMemo(() => {
    const getNum = (key: string) => {
      const v = sp.get(key);
      if (!v) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    
    // Tentar pegar referência de múltiplas fontes
    let reciboRef = sp.get("reciboRef") || 
                    sp.get("merchantRef") || 
                    sp.get("orderReference") || 
                    sp.get("reference") ||
                    undefined;
    
    // Se não encontrou na URL, tentar localStorage
    if (!reciboRef) {
      try {
        const stored = localStorage.getItem("recibo_ref");
        if (stored) reciboRef = decodeURIComponent(stored);
      } catch {}
    }
    
    // Tentar pegar valor de múltiplas fontes
    let amount = getNum("amount");
    if (!amount) {
      try {
        const storedAmount = localStorage.getItem("payment_amount");
        if (storedAmount) {
          const n = Number(storedAmount);
          if (Number.isFinite(n)) amount = n;
        }
      } catch {}
    }
    
    const d = {
      status_code: sp.get("status_code") || undefined,
      message: sp.get("message") || undefined,
      transaction_id: sp.get("transaction_id") || undefined,
      channel_transaction_id: sp.get("channel_transaction_id") || undefined,
      finger_print: sp.get("finger_print") || undefined,
      server_status: serverStatus,
      server_message: serverMessage,
      collect_status: collectStatus,
      collect_message: collectMessage,
      reciboRef: reciboRef,
      merchantRef: sp.get("merchantRef") || sp.get("orderReference") || reciboRef || undefined,
      amount: amount,
    };
    return d;
  }, [sp, serverStatus, serverMessage, collectStatus, collectMessage]);

  const normalizedStatus: "success" | "error" | "cancelled" | "pending" = (() => {
    const code = (data.status_code || '').toString();
    const lower = (data.message || '').toLowerCase();
    if (code === '1') return 'success';
    if (lower.includes('cancel') || lower.includes('cancelado') || lower.includes('cancelled')) return 'cancelled';
    if (code) return 'error';
    return 'pending';
  })();

  // Snapshot SISP params once e processar validação/coleta se sucesso
  useEffect(() => {
    if (captureDone) return;
    const hasSisp = sp.has("status_code") || sp.has("transaction_id") || sp.has("finger_print") || 
                    sp.has("merchantRef") || sp.has("reciboRef") || sp.has("orderReference") || 
                    sp.has("amount") || sp.has("server_status") || sp.has("collect_status") || 
                    sp.has("message") || sp.has("channel_transaction_id");
    if (!hasSisp) return;

    // Tentar pegar referência de múltiplas fontes
    let ref = sp.get("reciboRef") || sp.get("merchantRef") || sp.get("orderReference") || undefined;
    if (!ref) {
      try {
        const stored = localStorage.getItem("recibo_ref");
        if (stored) ref = decodeURIComponent(stored);
      } catch {}
    }
    
    // Tentar pegar valor de múltiplas fontes
    let amt: number | undefined = undefined;
    const amtStr = sp.get("amount");
    if (amtStr) {
      const n = Number(amtStr);
      if (Number.isFinite(n)) amt = n;
    }
    if (!amt) {
      try {
        const stored = localStorage.getItem("payment_amount");
        if (stored) {
          const n = Number(stored);
          if (Number.isFinite(n)) amt = n;
        }
      } catch {}
    }
    
    if (ref) {
      setCapturedRef(ref);
      try { localStorage.setItem("recibo_ref", encodeURIComponent(ref)); } catch {}
    }
    if (typeof amt === 'number') {
      setCapturedAmount(amt);
      try { localStorage.setItem("payment_amount", String(amt)); } catch {}
    }
    
    // Se status_code === '1' (sucesso), validar HMAC e depois coletar
    const statusCode = sp.get("status_code");
    const transactionId = sp.get("transaction_id");
    const fingerPrint = sp.get("finger_print");
    
    if (statusCode === "1" && transactionId && fingerPrint && ref && typeof amt === 'number') {
      // Validar HMAC primeiro
      fetch("/api/payment/validate-hmac", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: transactionId,
          hmacFingerprint: fingerPrint,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            setServerStatus("error");
            setServerMessage(errorData.error || "Falha na validação de segurança do pagamento");
            return;
          }
          
          const hmacResult = await response.json();
          if (hmacResult?.success || hmacResult?.validated || hmacResult?.valid) {
            setServerStatus("ok");
            setServerMessage("HMAC válido");
            
            // Se HMAC válido, chamar API de coleta
            return fetch("/api/payment/collect", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: ref,
                value: amt,
                sendEmail: false,
                apiName: "WebsiteCollection",
              }),
            });
          } else {
            setServerStatus("error");
            setServerMessage("Falha na validação de segurança do pagamento");
            return null;
          }
        })
        .then(async (collectResponse) => {
          if (!collectResponse) return;
          
          if (!collectResponse.ok) {
            const errorData = await collectResponse.json().catch(() => ({}));
            setCollectStatus("error");
            setCollectMessage(errorData.error || "Erro ao processar cobrança");
            return;
          }
          
          const collectResult = await collectResponse.json();
          const success = !!collectResult?.success || !collectResult?.hasError;
          setCollectStatus(success ? "ok" : "error");
          setCollectMessage(
            collectResult?.message || 
            (success ? "Cobrança confirmada com sucesso" : "Erro ao processar cobrança")
          );
        })
        .catch((error) => {
          console.error("Erro ao processar pagamento:", error);
          if (!serverStatus) {
            setServerStatus("error");
            setServerMessage("Erro ao validar pagamento");
          }
        });
    } else if (statusCode === "3" || (statusCode === "2" && (sp.get("message") || "").toLowerCase().includes("cancel"))) {
      // Cancelado
      setServerStatus("cancelled");
      setServerMessage(sp.get("message") || "Pagamento cancelado pelo cliente");
    } else if (statusCode === "2") {
      // Erro genérico
      setServerStatus("error");
      setServerMessage(sp.get("message") || "Pagamento rejeitado pelo gateway");
    }
    
    setCaptureDone(true);
  }, [sp, captureDone, serverStatus]);

  // Clean SISP/callback params from URL
  const cleanCallbackParams = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      const next = new URL(window.location.origin + url.pathname);
      window.history.replaceState({}, '', next.toString());
    } catch {}
  }, []);

  const displayAmount = useMemo(() => {
    if (typeof data.amount === "number") return data.amount;
    if (typeof capturedAmount === 'number') return capturedAmount;
    try {
      const s = localStorage.getItem("payment_amount");
      const n = s != null ? Number(s) : NaN;
      return Number.isFinite(n) ? n : undefined;
    } catch {
      return undefined;
    }
  }, [data.amount, capturedAmount]);

  const displayRef = useMemo(() => {
    if (data.reciboRef) return data.reciboRef as string;
    const refFromSp = data.reciboRef || data.merchantRef;
    if (refFromSp) return refFromSp as string;
    if (capturedRef) return capturedRef;
    try {
      const s = localStorage.getItem("recibo_ref");
      return s ? decodeURIComponent(s) : undefined;
    } catch {
      return undefined;
    }
  }, [data.reciboRef, data.merchantRef, capturedRef]);

  const isCancelled = normalizedStatus === "cancelled";
  const isSuccess = normalizedStatus === "success";
  const isError = normalizedStatus === "error";

  const handleGoHome = () => {
    cleanCallbackParams();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        {/* Layout especial para cancelado */}
        {isCancelled ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center gap-6">
              <CircleX className="text-orange-500" size={100}/>
              <h2 className="text-2xl font-bold text-gray-900">Pagamento cancelado</h2>
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Referência:</span>
                  <span className="font-semibold text-gray-900">{displayRef || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold text-gray-900">
                    {typeof displayAmount === 'number' ? formatCurrency(displayAmount) : '-'}
                  </span>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleGoHome}
                    className="w-full px-6 py-3 bg-[#002855] text-white rounded-lg hover:bg-[#002256] transition-colors font-semibold"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center gap-6">
              {isSuccess ? (
                <CiCircleCheck className="text-green-600" size={100}/>
              ) : isError ? (
                <TriangleAlert className="text-red-500" size={80}/>
              ) : (
                <CircleAlert className="text-orange-500" size={80}/>
              )}
              
              <div className="text-center space-y-2">
                {isSuccess ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">Pagamento realizado com sucesso</h2>
                    <p className="text-gray-600">
                      O seu pagamento foi processado com sucesso. Receberá uma confirmação por email.
                    </p>
                  </>
                ) : isError ? (
                  <>
                    <h2 className="text-2xl font-bold text-red-600">Pagamento rejeitado</h2>
                    <p className="text-gray-600">
                      O seu pagamento foi rejeitado. Por favor, tente novamente.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-orange-500">Processando...</h2>
                    <p className="text-gray-600">Aguarde enquanto processamos seu pagamento.</p>
                  </>
                )}
              </div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Referência:</span>
                  <span className="font-semibold text-gray-900">{displayRef || "-"}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold text-gray-900">
                    {typeof displayAmount === 'number' ? formatCurrency(displayAmount) : '-'}
                  </span>
                </div>

                {isSuccess ? (
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleGoHome}
                      className="w-full px-6 py-3 bg-[#002855] text-white rounded-lg hover:bg-[#002256] transition-colors font-semibold"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleGoHome}
                      className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold border border-gray-300"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

