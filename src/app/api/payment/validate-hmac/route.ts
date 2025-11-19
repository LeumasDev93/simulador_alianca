import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || process.env.PAYMENT_API_URL || "https://pay.aliancaseguros.cv";
const PAYMENT_X_CLIENT_ID = process.env.PAYMENT_X_CLIENT_ID || process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID || "";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ValidateHmacRequest {
  transactionId: string;
  hmacFingerprint: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYMENT_X_CLIENT_ID) {
      console.error("[Validate HMAC] PAYMENT_X_CLIENT_ID não configurado. Verifique as variáveis de ambiente.");
      return NextResponse.json(
        { 
          error: "X-Client-Id não configurado",
          details: "Verifique se PAYMENT_X_CLIENT_ID ou NEXT_PUBLIC_PAYMENT_CLIENT_ID está definido no .env"
        },
        { status: 500 }
      );
    }

    const body: ValidateHmacRequest = await req.json();
    
    console.log("[Validate HMAC] Validando:", {
      transactionId: body.transactionId,
      hasFingerprint: !!body.hmacFingerprint,
      baseUrl: PAYMENT_BASE_URL,
    });

    if (!body.transactionId || !body.hmacFingerprint) {
      return NextResponse.json(
        { error: "transactionId e hmacFingerprint são obrigatórios" },
        { status: 400 }
      );
    }

    const response = await fetch(`${PAYMENT_BASE_URL}/api/hmac/validate-hmac`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Client-Id": PAYMENT_X_CLIENT_ID,
      },
      body: JSON.stringify({
        transactionId: body.transactionId,
        hmacFingerprint: body.hmacFingerprint,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Erro ${response.status}` };
      }

      return NextResponse.json(
        {
          error: errorData.error || errorData.message || `Erro ao validar HMAC: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Validate HMAC] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao validar HMAC",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

