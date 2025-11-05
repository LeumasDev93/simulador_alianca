import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL_SIMULATOR;
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_API_BASE_URL_SIMULATOR não configurado");
      return NextResponse.json(
        { error: "Configuração de API não encontrada" },
        { status: 500 }
      );
    }

    const url = `${baseUrl}/simulador/1.0.0/products`;
    console.log("Fetching products from:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ApiKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("Upstream error:", res.status, text);
      return NextResponse.json(
        { error: `Erro ao buscar produtos: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("Products data received successfully");
    
    const response = NextResponse.json(data, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, ApiKey');
    
    return response;
  } catch (err: any) {
    console.error("Error in GET /api/products:", err);
    
    const errorResponse = NextResponse.json(
      { error: "Falha ao obter produtos", details: String(err?.message || err) },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return errorResponse;
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, ApiKey, Accept, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

