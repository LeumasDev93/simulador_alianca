
import { NextResponse } from 'next/server';
import { getValidToken, generateOAuthToken, isTokenExpiredError } from '@/lib/tokenUtils';

export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  try {
    const { token, ...payload } = await request.json();

    // Se não tem token, gera um novo automaticamente
    let accessToken: string;
    if (!token || token.trim() === "") {
      console.log("Token não fornecido - gerando novo token OAuth...");
      accessToken = await generateOAuthToken();
    } else {
      accessToken = token;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Enviando para API externa:', {
        payloadKeys: Object.keys(payload),
        hasToken: !!accessToken,
        tokenPreview: accessToken ? accessToken.substring(0, 5) + '...' : 'gerado automaticamente'
      });
    }

    // Token já foi obtido acima (gerado ou do request)

    // Primeira tentativa
    let apiResponse = await fetch('https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/externalsystem/contract/simulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    // Se for erro 401 e for token expirado, tenta renovar e retentar
    if (!apiResponse.ok && apiResponse.status === 401) {
      const errorData = await apiResponse.json().catch(() => ({}));
      
      if (isTokenExpiredError(errorData)) {
        console.log('Token expirado na simulação - renovando token...');
        accessToken = await generateOAuthToken();
        
        // Retenta com o novo token
        apiResponse = await fetch('https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/externalsystem/contract/simulation', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          cache: 'no-store'
        });
      }
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      
      // Se ainda for erro de token após retry
      if (isTokenExpiredError(errorData)) {
        const errorResponse = NextResponse.json(
          { error: 'Token de autenticação expirado. Por favor, recarregue a página e tente novamente.', details: errorData },
          { status: 401 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
      }
      
      const errorResponse = NextResponse.json(
        { error: 'Erro na API externa', details: errorData },
        { status: apiResponse.status }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    const data = await apiResponse.json();
    const response = NextResponse.json(data);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('Erro na API:', error);
    const errorResponse = NextResponse.json(
      { error: 'Erro interno no servidor' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS, PUT, DELETE, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}