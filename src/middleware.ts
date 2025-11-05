import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCsrfToken, CSRF_TOKEN_NAME, CSRF_COOKIE_NAME } from '@/lib/csrf';

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': `Content-Type, Authorization, ApiKey, Accept, X-Requested-With, ${CSRF_TOKEN_NAME}`,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Validação CSRF para métodos que modificam dados
  const mutationMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  const isApiSimulation = request.nextUrl.pathname.startsWith('/api/simulation');
  
  if (mutationMethods.includes(request.method) && isApiSimulation) {
    const csrfTokenFromHeader = request.headers.get(CSRF_TOKEN_NAME);
    const csrfTokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value || null;

    if (!validateCsrfToken(csrfTokenFromHeader, csrfTokenFromCookie)) {
      console.error('CSRF token inválido ou ausente');
      return NextResponse.json(
        { error: 'CSRF token inválido ou ausente' },
        { status: 403 }
      );
    }
  }

  // Clone the response for other requests
  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', `Content-Type, Authorization, ApiKey, Accept, X-Requested-With, ${CSRF_TOKEN_NAME}`);
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

