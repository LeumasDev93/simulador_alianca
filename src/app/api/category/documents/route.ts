import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api.aliancaseguros.cv";
const API_KEY = process.env.ALIANCA_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get("name");

    if (!categoryName) {
      return NextResponse.json(
        { error: "Parâmetro 'name' é obrigatório" },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      console.error("ALIANCA_API_KEY não configurada");
      return NextResponse.json(
        { error: "Configuração de API não encontrada" },
        { status: 500 }
      );
    }

    const apiUrl = `${API_BASE_URL}/category/document/1.0.0?name=${encodeURIComponent(categoryName)}`;

    console.log(`[Category Documents] Buscando documentos para: ${categoryName}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ApiKey: API_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Category Documents] Erro ${response.status}:`,
        errorText
      );
      return NextResponse.json(
        {
          error: `Erro ao buscar documentos: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Category Documents] Documentos encontrados:`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Category Documents] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar documentos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

