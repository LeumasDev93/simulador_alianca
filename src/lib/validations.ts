/**
 * Funções de validação para campos do formulário
 * Especificamente para validações de Cabo Verde
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida NIF de Cabo Verde
 * NIF deve ter exatamente 9 dígitos numéricos
 * @param nif - Valor do NIF a ser validado
 * @returns Resultado da validação com mensagem de erro se inválido
 */
export function validateNIF(nif: string): ValidationResult {
  if (!nif || nif.trim() === "") {
    return { isValid: false, error: "NIF é obrigatório" };
  }

  // Remove espaços e caracteres não numéricos
  const cleanNIF = nif.replace(/\D/g, "");

  // Verifica se tem exatamente 9 dígitos
  if (cleanNIF.length !== 9) {
    return {
      isValid: false,
      error: "NIF deve conter exatamente 9 dígitos",
    };
  }

  // Verifica se são apenas números
  if (!/^\d{9}$/.test(cleanNIF)) {
    return {
      isValid: false,
      error: "NIF deve conter apenas números",
    };
  }

  return { isValid: true };
}

/**
 * Valida telefone de Cabo Verde
 * Telefone pode ter 9 dígitos (formato moderno) ou 7 dígitos (formato antigo)
 * @param phone - Valor do telefone a ser validado
 * @returns Resultado da validação com mensagem de erro se inválido
 */
export function validatePhoneCV(phone: string): ValidationResult {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Telefone é obrigatório" };
  }

  // Remove espaços e caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, "");

  // Verifica se tem 9 ou 7 dígitos
  if (cleanPhone.length !== 9 && cleanPhone.length !== 7) {
    return {
      isValid: false,
      error: "Telefone deve conter 9 ou 7 dígitos",
    };
  }

  // Verifica se são apenas números
  if (!/^\d+$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Telefone deve conter apenas números",
    };
  }

  return { isValid: true };
}

/**
 * Valida um campo baseado no padrão (pattern) fornecido
 * Se o campo for NIF ou telefone, usa validações específicas de Cabo Verde
 * Caso contrário, usa validação por regex
 * @param value - Valor a ser validado
 * @param pattern - Padrão regex ou tipo especial (nif, phone)
 * @param fieldName - Nome do campo (para identificar tipo especial)
 * @returns Resultado da validação com mensagem de erro se inválido
 */
export function validateFieldPattern(
  value: string,
  pattern: string | null | undefined,
  fieldName?: string
): ValidationResult {
  // Se o valor está vazio, não valida aqui (validação de required é separada)
  if (!value || value.trim() === "") {
    return { isValid: true };
  }

  // Validações específicas para campos conhecidos (mesmo sem pattern)
  const lowerFieldName = fieldName?.toLowerCase() || "";

  // Validação de NIF (sempre valida se for campo nif, mesmo sem pattern)
  if (lowerFieldName === "nif") {
    return validateNIF(value);
  }

  // Validação de telefone (mobiles, telefone, phone, etc.) - sempre valida se for campo de telefone
  if (
    lowerFieldName === "mobiles" ||
    lowerFieldName === "telefone" ||
    lowerFieldName === "phone" ||
    lowerFieldName === "mobile"
  ) {
    return validatePhoneCV(value);
  }

  // Se não tem padrão e não é um campo conhecido, não valida
  if (!pattern || pattern.trim() === "") {
    return { isValid: true };
  }

  // Validação por regex padrão
  try {
    // Remove barras de escape duplas se vierem da API (ex: "\\d" -> "\d")
    // Também trata casos onde pode vir com escape JSON (ex: "\\\\d" -> "\d")
    let cleanPattern = pattern;
    
    // Primeiro, remove escapes JSON duplos
    cleanPattern = cleanPattern.replace(/\\\\/g, "\\");
    
    // Se ainda tiver escapes duplos, remove mais uma vez
    cleanPattern = cleanPattern.replace(/\\\\/g, "\\");
    
    // Cria o regex
    const regex = new RegExp(cleanPattern);

    // Testa o valor
    const testResult = regex.test(value);
    
    // Debug: log para verificar o padrão e valor
    if (process.env.NODE_ENV === 'development') {
      console.log(`Validando campo ${fieldName}:`, {
        pattern: pattern,
        cleanPattern: cleanPattern,
        value: value,
        testResult: testResult
      });
    }

    if (!testResult) {
      // Tenta inferir mensagem de erro baseado no padrão
      let errorMessage = "Valor não corresponde ao formato esperado";

      // Verifica padrões comuns
      if (pattern.includes("\\d{9}") || cleanPattern.includes("\\d{9}")) {
        errorMessage = "Deve conter exatamente 9 dígitos";
      } else if (pattern.includes("\\d{7}") || cleanPattern.includes("\\d{7}")) {
        errorMessage = "Deve conter exatamente 7 dígitos";
      } else if (pattern.includes("\\d{9}|\\d{7}") || cleanPattern.includes("\\d{9}|\\d{7}")) {
        errorMessage = "Deve conter 9 ou 7 dígitos";
      } else if (pattern.includes("\\d+") || cleanPattern.includes("\\d+")) {
        errorMessage = "Deve conter apenas números";
      }

      return { isValid: false, error: errorMessage };
    }

    return { isValid: true };
  } catch (error) {
    // Se o regex é inválido, loga o erro mas retorna válido (não bloqueia)
    console.warn(`Padrão regex inválido: ${pattern}`, error);
    return { isValid: true };
  }
}

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns Resultado da validação com mensagem de erro se inválido
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email é obrigatório" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Por favor, insira um email válido" };
  }

  return { isValid: true };
}

