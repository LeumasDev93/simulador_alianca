
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  try {
    const { token, ...payload } = await request.json();

    if (!token) {
      const errorResponse = NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      return errorResponse;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Enviando para API externa:', {
        payload,
        tokenPreview: token.substring(0, 5) + '...'
      });
    }

    const apiResponse = await fetch('https://aliancacvtest.rtcom.pt/anywhere/api/v1/private/externalsystem/contract/simulation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
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