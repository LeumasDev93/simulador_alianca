import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteParams
) {
  try {
    // Next.js 16: params agora é uma Promise
    const { id: productId } = await context.params;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL_SIMULATOR;
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_API_BASE_URL_SIMULATOR não configurado");
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_BASE_URL_SIMULATOR não configurado" },
        { status: 500 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID não fornecido" },
        { status: 400 }
      );
    }

    const url = `${baseUrl}/simulador/1.0.0/products/${encodeURIComponent(
      productId
    )}`;

    console.log("Fetching product from:", url);

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
        { error: `Erro ao buscar produto: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("Product data received successfully");
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/products/[id]:", err);
    return NextResponse.json(
      { error: "Falha ao obter detalhes do produto", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}


