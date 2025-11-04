
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; 

export async function POST(request: Request) {
  try {
    const { token, ...payload } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Erro na API externa', details: errorData },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}