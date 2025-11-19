/**
 * Utilitários para gerenciamento de tokens OAuth
 */

/**
 * Gera um novo token OAuth usando client credentials
 */
export async function generateOAuthToken(): Promise<string> {
  const credentials = Buffer.from(
    "ALIANCA_WEBSITE:TQzQzxvlKSZCzTAVjc2iP6CX"
  ).toString("base64");

  const tokenResponse = await fetch(
    "https://aliancacvtest.rtcom.pt/anywhere/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "read write",
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description || "Falha ao obter token de autenticação"
    );
  }

  return tokenData.access_token;
}

/**
 * Verifica se um erro indica token expirado
 */
export function isTokenExpiredError(error: any): boolean {
  if (!error) return false;

  const errorStr = JSON.stringify(error).toLowerCase();
  return (
    errorStr.includes("invalid_token") ||
    errorStr.includes("token expired") ||
    errorStr.includes("access token expired") ||
    errorStr.includes("expired")
  );
}

/**
 * Obtém um token válido, renovando se necessário
 * @param currentToken - Token atual da sessão (pode ser null ou expirado)
 * @returns Token válido
 */
export async function getValidToken(
  currentToken?: string | null
): Promise<string> {
  // Se não tem token, gera um novo
  if (!currentToken) {
    console.log("Token não encontrado - gerando novo token OAuth...");
    return await generateOAuthToken();
  }

  // Retorna o token atual (a validação será feita na chamada da API)
  return currentToken;
}

/**
 * Executa uma requisição com retry automático em caso de token expirado
 * @param fetchFn - Função que executa a requisição com o token
 * @param getToken - Função que retorna o token atual
 * @param maxRetries - Número máximo de tentativas (padrão: 1)
 */
export async function fetchWithTokenRefresh<T>(
  fetchFn: (token: string) => Promise<Response>,
  getToken: () => Promise<string | null | undefined>,
  maxRetries: number = 1
): Promise<Response> {
  let token = await getValidToken(await getToken());
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const response = await fetchFn(token);

      // Se a resposta foi bem-sucedida, retorna
      if (response.ok) {
        return response;
      }

      // Se for erro 401 ou erro de token, tenta renovar
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        
        if (isTokenExpiredError(errorData) && retries < maxRetries) {
          console.log("Token expirado detectado - renovando token...");
          token = await generateOAuthToken();
          retries++;
          continue; // Retenta com o novo token
        }
      }

      // Se não for erro de token ou já tentou renovar, retorna a resposta
      return response;
    } catch (error) {
      // Se for erro de token e ainda tem tentativas, renova
      if (isTokenExpiredError(error) && retries < maxRetries) {
        console.log("Erro de token detectado - renovando token...");
        token = await generateOAuthToken();
        retries++;
        continue;
      }
      throw error;
    }
  }

  // Se chegou aqui, esgotou as tentativas
  throw new Error("Falha ao obter token válido após múltiplas tentativas");
}

