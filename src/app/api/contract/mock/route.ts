import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Mock contract request received:", payload);

    return NextResponse.json(
      {
        success: true,
        reference: `CTR-${Date.now()}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/contract/mock:", error);
    return NextResponse.json(
      { error: "Não foi possível processar a contratação." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export const dynamic = "force-dynamic";

