import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { generateOAuthToken } from "@/lib/tokenUtils";

// Usar a mesma base URL das outras APIs privadas
const API_BASE_URL = "https://aliancacvtest.rtcom.pt/anywhere";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CollectRequest {
  reference: string;
  value: number;
  sendEmail?: boolean;
  apiName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CollectRequest = await req.json();

    if (!body.reference || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: "reference e value são obrigatórios" },
        { status: 400 }
      );
    }

    // Obter token da sessão ou gerar um novo
    const session = await getServerSession();
    let token: string;

    if (session?.user?.accessToken) {
      token = session.user.accessToken;
    } else {
      console.log("[Payment Collect] Token não encontrado na sessão - gerando novo token OAuth...");
      token = await generateOAuthToken();
    }

    // Chamar API de coleta
    // A referência vai no body e também no parâmetro da URL
    // URL: {{baseUrl}}/api/v1/private/mobile/invoice/{{invoice}}/collect
    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const collectUrl = `${baseUrl}/api/v1/private/mobile/invoice/${encodeURIComponent(body.reference)}/collect`;
    
    console.log("[Payment Collect] Chamando API de coleta:", {
      url: collectUrl,
      reference: body.reference,
      value: body.value,
    });
    
    const response = await fetch(collectUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        value: body.value,
        reference: body.reference,
        sendEmail: body.sendEmail !== undefined ? body.sendEmail : false,
        apiName: body.apiName || "WebsiteCollection",
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

      console.error(`[Payment Collect] Erro ${response.status}:`, errorData);

      return NextResponse.json(
        {
          error: errorData.error || errorData.message || `Erro ao processar cobrança: ${response.status}`,
          details: errorData,
          hasError: true,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("[Payment Collect] Cobrança processada:", result);

    return NextResponse.json({
      ...result,
      success: !result.hasError,
    }, { status: 200 });
  } catch (error) {
    console.error("[Payment Collect] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar cobrança",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        hasError: true,
      },
      { status: 500 }
    );
  }
}

