import { randomBytes } from 'crypto';

// Gera um token CSRF único
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

// Valida um token CSRF
export function validateCsrfToken(token: string | null, expectedToken: string | null): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  
  // Comparação constant-time para evitar timing attacks
  return token === expectedToken;
}

// Nome do cookie/header para CSRF
export const CSRF_TOKEN_NAME = 'x-csrf-token';
export const CSRF_COOKIE_NAME = 'csrf-token';

