import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

interface RouteParams {
  params: Promise<{
    provider: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteParams
) {
  try {
    const { provider } = await context.params;
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    
    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint é obrigatório" },
        { status: 400 }
      );
    }
    
    const session = await getServerSession();
    
    let accessToken = session?.user?.accessToken;
    
    if (!accessToken) {
      // Se não houver token, gera um novo
      console.log("Gerando novo token OAuth...");
      
      const credentials = Buffer.from(
        "ALIANCA_WEBSITE:TQzQzxvlKSZCzTAVjc2iP6CX"
      ).toString("base64");

      const tokenResponse = await fetch(
        "https://aliancacvtest.rtcom.pt/anywhere/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            scope: "read write",
          }),
        }
      );

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok || !tokenData.access_token) {
        return NextResponse.json(
          { error: "Falha ao obter token de autenticação" },
          { status: 401 }
        );
      }

      accessToken = tokenData.access_token;
    }

    // Determina a URL base baseado no provider
    let baseUrl: string;
    if (provider === "Anywhere") {
      baseUrl = "https://aliancacvtest.rtcom.pt/anywhere";
    } else {
      // Alianca ou padrão
      baseUrl = "https://aliancacvtest.rtcom.pt";
    }

    // Constrói a URL completa
    let fullUrl: string;
    if (endpoint.startsWith("http")) {
      // URL completa
      fullUrl = endpoint;
    } else if (endpoint.startsWith("/")) {
      // Caminho absoluto
      fullUrl = `${baseUrl}${endpoint}`;
    } else if (endpoint.startsWith("private/") || endpoint.startsWith("api/")) {
      // Já inclui o prefixo
      fullUrl = `${baseUrl}/${endpoint}`;
    } else {
      // Caminho relativo - adiciona prefixo padrão
      fullUrl = `${baseUrl}/api/v1/private/${endpoint}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error fetching dynamic API data:", response.status, text);
      return NextResponse.json(
        { error: "Erro ao buscar dados da API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set('Access-Control-Allow-Origin', '*');
    
    return result;
  } catch (error) {
    console.error("Error in GET /api/dynamic/[provider]:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados da API" },
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

