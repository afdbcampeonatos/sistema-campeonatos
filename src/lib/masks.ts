/**
 * Utilitários para máscaras de input
 */

/**
 * Aplica máscara de telefone brasileiro
 * Formato: (00) 00000-0000 ou (00) 0000-0000
 */
export function maskPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Aplica máscara baseada no tamanho
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
      6
    )}`;
  } else {
    // Telefone com 11 dígitos (celular)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
}

/**
 * Aplica máscara de CPF
 * Formato: 000.000.000-00
 */
export function maskCPF(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11);

  // Aplica máscara
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`;
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(
      6,
      9
    )}-${limited.slice(9)}`;
  }
}

/**
 * Remove máscara de CPF
 */
export function unmaskCPF(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Remove máscara de telefone
 */
export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = unmaskCPF(cpf);

  if (cleanCPF.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

/**
 * Aplica máscara de RG
 * Formato: 00.000.000-0
 */
export function maskRG(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Limita a 9 dígitos (formato padrão RG)
  const limited = numbers.slice(0, 9);

  // Aplica máscara progressivamente
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 5) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`;
  } else if (limited.length <= 8) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
  } else {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(
      5,
      8
    )}-${limited.slice(8)}`;
  }
}

/**
 * Remove máscara de RG
 */
export function unmaskRG(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida RG
 * RG brasileiro varia por estado (7-9 dígitos)
 */
export function validateRG(rg: string): boolean {
  const cleanRG = unmaskRG(rg);

  // RG deve ter entre 7 e 9 dígitos
  if (cleanRG.length < 7 || cleanRG.length > 9) {
    return false;
  }

  // Não pode ser todos zeros
  if (/^0+$/.test(cleanRG)) {
    return false;
  }

  // Não pode ser todos dígitos iguais
  if (/^(\d)\1+$/.test(cleanRG)) {
    return false;
  }

  return true;
}
