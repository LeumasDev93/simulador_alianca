import { NextResponse } from 'next/server';
import { generateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/csrf';
import { cookies } from 'next/headers';

export async function GET() {
  const token = generateCsrfToken();
  
  // Armazena o token em um cookie HTTP-only
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  });

  return NextResponse.json({ token }, { status: 200 });
}

export const dynamic = 'force-dynamic';

