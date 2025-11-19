import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getValidToken, generateOAuthToken, isTokenExpiredError, fetchWithTokenRefresh } from "@/lib/tokenUtils";

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
    
    // Para Anywhere, sempre gera um novo token se não houver sessão válida
    // Isso garante que sempre temos um token válido ao carregar a página
    let accessToken: string;
    if (provider === "Anywhere") {
      if (!session?.user?.accessToken) {
        // Gera novo token se não houver na sessão
        accessToken = await generateOAuthToken();
      } else {
        // Usa o token da sessão, mas será renovado automaticamente se expirar
        accessToken = session.user.accessToken;
      }
    } else {
      // Para outros providers, usa a lógica padrão
      accessToken = await getValidToken(session?.user?.accessToken);
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
    } else if (endpoint.startsWith("private/") || endpoint.startsWith("api/v1/private/")) {
      // Se já começa com private/ ou api/v1/private/, adiciona /api/v1/ se necessário
      if (endpoint.startsWith("private/")) {
        fullUrl = `${baseUrl}/api/v1/${endpoint}`;
      } else {
        fullUrl = `${baseUrl}/${endpoint}`;
      }
    } else if (endpoint.startsWith("api/")) {
      // Se começa com api/, adiciona direto
      fullUrl = `${baseUrl}/${endpoint}`;
    } else {
      // Caminho relativo - adiciona prefixo padrão
      fullUrl = `${baseUrl}/api/v1/private/${endpoint}`;
    }

    // Debug: log da URL construída
    console.log(`[Dynamic API] Provider: ${provider}, Endpoint: ${endpoint}, Full URL: ${fullUrl}`);

    // Executa a requisição com retry automático em caso de token expirado
    const response = await fetchWithTokenRefresh(
      async (token: string) => {
        return await fetch(fullUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        });
      },
      async () => {
        const currentSession = await getServerSession();
        return currentSession?.user?.accessToken;
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text };
      }
      
      console.error("Error fetching dynamic API data:", response.status, errorData);
      
      // Se ainda for erro de token após retry, retorna erro específico
      if (isTokenExpiredError(errorData)) {
        return NextResponse.json(
          { error: "Token de autenticação expirado. Por favor, recarregue a página." },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error || "Erro ao buscar dados da API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set('Access-Control-Allow-Origin', '*');
    
    return result;
  } catch (error) {
    console.error("Error in GET /api/dynamic/[provider]:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const { searchParams } = new URL(request.url);
    const endpointParam = searchParams.get("endpoint") || "unknown";
    const { provider: providerParam } = await context.params;
    
    return NextResponse.json(
      { 
        error: "Falha ao buscar dados da API",
        details: errorMessage,
        endpoint: endpointParam,
        provider: providerParam
      },
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

