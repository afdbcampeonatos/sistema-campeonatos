/**
 * Gera um slug a partir de um texto
 * Remove acentos, converte para minúsculas e substitui espaços por hífens
 */
export function generateSlug(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
}

/**
 * Gera um slug único verificando se já existe no banco
 * Se existir, adiciona um sufixo numérico
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

