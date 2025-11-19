import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getValidToken, isTokenExpiredError, fetchWithTokenRefresh } from "@/lib/tokenUtils";

export async function GET() {
  try {
    const session = await getServerSession();
    
    // Obtém token válido (renova se necessário)
    let accessToken = await getValidToken(session?.user?.accessToken);
    
    // Executa a requisição com retry automático em caso de token expirado
    const response = await fetchWithTokenRefresh(
      async (token: string) => {
        return await fetch(
          'https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/mobile/vehicle/brands',
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );
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
      
      console.error("Error fetching brands:", response.status, errorData);
      
      // Se ainda for erro de token após retry, retorna erro específico
      if (isTokenExpiredError(errorData)) {
        return NextResponse.json(
          { error: "Token de autenticação expirado. Por favor, recarregue a página." },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error || `Erro ao buscar marcas: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set('Access-Control-Allow-Origin', '*');
    
    return result;
  } catch (error) {
    console.error("Error in GET /api/brands:", error);
    return NextResponse.json(
      { error: "Falha ao conectar com o servidor de marcas" },
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

