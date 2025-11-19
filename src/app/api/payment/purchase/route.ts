import { NextRequest, NextResponse } from "next/server";

const PAYMENT_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || process.env.PAYMENT_API_URL || "https://pay.aliancaseguros.cv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Receber FormData diretamente
    const formData = await req.formData();

    // Enviar FormData para a API de pagamento
    const response = await fetch(`${PAYMENT_BASE_URL}/gtw/purchase`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Erro ao criar pagamento";
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorMessage;
        } else {
          await response.text();
        }
      } catch {
        errorMessage = "Erro ao processar resposta do servidor de pagamento";
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: errorMessage,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("text/html")) {
      const htmlText = await response.text();
      
      return new NextResponse(htmlText, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    } else {
      const responseData = await response.json();
      return NextResponse.json({
        ...responseData,
        type: "json",
      }); 
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao processar pagamento";
    return NextResponse.json(
      { 
        message: errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
