import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { GET as authHandler, POST as authHandlerPost } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    // Pega o token da sessão do servidor com as opções corretas
    const session = await getServerSession();
    
    if (!session?.user?.accessToken) {
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

      // Usa o token recém gerado
      const accessToken = tokenData.access_token;
      
      const response = await fetch(
        'https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/mobile/vehicle/brands',
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Error fetching brands:", response.status, text);
        return NextResponse.json(
          { error: `Erro ao buscar marcas: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      const result = NextResponse.json(data, { status: 200 });
      result.headers.set('Access-Control-Allow-Origin', '*');
      
      return result;
    }

    const response = await fetch(
      'https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/mobile/vehicle/brands',
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Error fetching brands:", response.status, text);
      return NextResponse.json(
        { error: `Erro ao buscar marcas: ${response.status}` },
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

