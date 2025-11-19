import { NextResponse } from "next/server";

const PAYMENT_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || process.env.PAYMENT_API_URL || "https://pay.aliancaseguros.cv";

const PAYMENT_CREDENTIALS = {
  clientId: process.env.NEXT_PUBLIC_PAYMENT_CLIENT_ID || process.env.PAYMENT_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_PAYMENT_CLIENT_SECRET || process.env.PAYMENT_CLIENT_SECRET,
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    
    const response = await fetch(`${PAYMENT_BASE_URL}/api/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(PAYMENT_CREDENTIALS),
    });

    if (!response.ok) {
      let errorMessage = "Erro ao obter autorização de pagamento";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        }
      } catch {
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: errorMessage,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      const errorMessage = typeof data.error === 'string' ? data.error : "Erro ao obter token de pagamento";
      return NextResponse.json({ 
        message: errorMessage,
        error: errorMessage 
      }, { status: 400 });
    }

    const token = data.token || data.accessToken;
    
    if (!token) {
      return NextResponse.json({ 
        message: "Token não foi retornado pela API",
        error: "Token não foi retornado pela API" 
      }, { status: 400 });
    }

    const res = NextResponse.json({ accessToken: token, token: token });
    res.cookies.set('pay_token', token, {
      path: '/',
      maxAge: 600,
      sameSite: 'none',
      secure: true,
    });
    return res;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao obter token de pagamento";
    return NextResponse.json(
      { 
        message: errorMessage,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
