import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { generateOAuthToken } from "@/lib/tokenUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Obter token da sessão ou gerar um novo
    const session = await getServerSession();
    let token: string;

    if (session?.user?.accessToken) {
      token = session.user.accessToken;
    } else {
      // Se não houver sessão, gera um novo token
      console.log("[Contract Accept] Token não encontrado na sessão - gerando novo token OAuth...");
      token = await generateOAuthToken();
    }

    // Obter dados do body
    const body = await request.json();

    const {
      idSimulationTel,
      idContract,
      proposalReference,
      newStartDate,
      installment,
      useDirectDebit,
    } = body;

    // Validar campos obrigatórios
    if (!idSimulationTel || !proposalReference || !newStartDate || !installment) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios faltando",
          missing: {
            idSimulationTel: !idSimulationTel,
            proposalReference: !proposalReference,
            newStartDate: !newStartDate,
            installment: !installment,
          },
        },
        { status: 400 }
      );
    }

    const payload = {
      idSimulationTel,
      idContract: idContract || null,
      proposalReference,
      newStartDate,
      installment,
      useDirectDebit: useDirectDebit !== undefined ? useDirectDebit : false,
    };

    console.log(`[Contract Accept] Aceitando contrato:`, payload);

    // Enviar para a API externa
    const response = await fetch(
      "https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/externalsystem/contract/accept",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Erro ${response.status}` };
      }

      console.error(`[Contract Accept] Erro ${response.status}:`, errorData);

      return NextResponse.json(
        {
          error: errorData.error || errorData.message || `Erro ao aceitar contrato: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log(`[Contract Accept] Contrato aceito com sucesso:`, result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Contract Accept] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao aceitar contrato",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

