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
      console.log("[Contract Attach] Token não encontrado na sessão - gerando novo token OAuth...");
      token = await generateOAuthToken();
    }

    // Obter FormData do request
    const formData = await request.formData();

    // Validar campos obrigatórios
    const file = formData.get("file") as File | null;
    const reference = formData.get("reference") as string | null;
    const system = formData.get("system") as string | null;
    const attachType = formData.get("attachType") as string | null;
    const attachTo = formData.get("attachTo") as string | null;
    const refAttachTo = formData.get("refAttachTo") as string | null;

    // A API espera attach_type (snake_case) no FormData
    // Mas vamos enviar como attachType no FormData e o servidor converte se necessário

    if (!file || !reference || !system || !attachType || !attachTo || !refAttachTo) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios faltando",
          missing: {
            file: !file,
            reference: !reference,
            system: !system,
            attachType: !attachType,
            attachTo: !attachTo,
            refAttachTo: !refAttachTo,
          },
        },
        { status: 400 }
      );
    }

    // Criar novo FormData para enviar à API externa
    // A API espera attachType (camelCase) conforme documentação
    const apiFormData = new FormData();
    apiFormData.append("file", file);
    apiFormData.append("reference", reference);
    apiFormData.append("system", system);
    apiFormData.append("attachType", attachType); // Usar camelCase
    apiFormData.append("attachTo", attachTo);
    apiFormData.append("refAttachTo", refAttachTo);

    console.log(`[Contract Attach] Enviando arquivo:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      reference,
      system,
      attachType,
      attachTo,
      refAttachTo,
    });

    // Enviar para a API externa
    const response = await fetch(
      "https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/externalsystem/attach",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Não definir Content-Type, o fetch define automaticamente com boundary para FormData
        },
        body: apiFormData,
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

      console.error(`[Contract Attach] Erro ${response.status}:`, errorData);

      return NextResponse.json(
        {
          error: errorData.error || errorData.message || `Erro ao anexar arquivo: ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log(`[Contract Attach] Arquivo anexado com sucesso:`, result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[Contract Attach] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao anexar arquivo",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

