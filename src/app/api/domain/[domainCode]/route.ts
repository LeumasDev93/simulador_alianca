import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

interface RouteParams {
  params: Promise<{
    domainCode: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteParams
) {
  try {
    const { domainCode } = await context.params;
    
    // Obtém a ApiKey das variáveis de ambiente
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    if (!apiKey) {
      console.error("NEXT_PUBLIC_API_KEY não configurado");
      return NextResponse.json(
        { error: "Configuração de API não encontrada" },
        { status: 500 }
      );
    }

    // Usa a API correta: https://api.aliancaseguros.cv/domain/find/1.0.0?name={domainCode}
    const apiUrl = `https://api.aliancaseguros.cv/domain/find/1.0.0?name=${encodeURIComponent(domainCode)}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        ApiKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error fetching domain data:", response.status, text);
      return NextResponse.json(
        { error: `Erro ao buscar dados de domínio: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set('Access-Control-Allow-Origin', '*');
    result.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, ApiKey');
    
    return result;
  } catch (error) {
    console.error("Error in GET /api/domain/[domainCode]:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados de domínio" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, ApiKey, Accept, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

