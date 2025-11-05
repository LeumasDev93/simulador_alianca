import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

interface RouteParams {
  params: Promise<{
    brandId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteParams
) {
  try {
    const { brandId } = await context.params;
    
    // Pega o token da sessão do servidor
    const session = await getServerSession();
    
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Token de acesso não disponível" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/mobile/vehicle/brands/${brandId}/models`,
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
      console.error("Error fetching models:", response.status, text);
      return NextResponse.json(
        { error: "Erro ao buscar modelos" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set('Access-Control-Allow-Origin', '*');
    
    return result;
  } catch (error) {
    console.error("Error in GET /api/brands/[brandId]/models:", error);
    return NextResponse.json(
      { error: "Falha ao buscar modelos" },
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

