import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL_SIMULATOR ||
  "https://api.aliancaseguros.cv";
const API_KEY = process.env.ALIANCA_API_KEY || process.env.NEXT_PUBLIC_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint é obrigatório" },
        { status: 400 }
      );
    }

    const baseUrl = API_BASE.endsWith("/")
      ? API_BASE.slice(0, -1)
      : API_BASE;
    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${
          endpoint.startsWith("/") ? endpoint : `/${endpoint}`
        }`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (API_KEY) {
      headers["ApiKey"] = API_KEY;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erro ao acessar API Alianca:", response.status, text);
      return NextResponse.json(
        { error: "Erro ao buscar dados da API Aliança" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = NextResponse.json(data, { status: 200 });
    result.headers.set("Access-Control-Allow-Origin", "*");
    return result;
  } catch (error) {
    console.error("Erro em GET /api/alianca:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados da API Aliança" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

