/**
 * Utilitário para upload de arquivos
 * Em desenvolvimento: simula upload (salva localmente)
 * Em produção: faz upload para Supabase Storage
 */

/**
 * Faz upload de uma imagem para o storage
 * @param file Arquivo de imagem
 * @param folder Pasta no storage (ex: 'shields', 'players')
 * @returns URL da imagem no storage
 */
export async function uploadImage(
  file: File,
  folder: "shields" | "players"
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  console.log("[uploadImage] Iniciando upload:", {
    folder,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });
  console.log("[uploadImage] Supabase configurado:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "não configurado",
  });

  // Se Supabase não estiver configurado, usar modo de desenvolvimento (mock)
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[uploadImage] Modo desenvolvimento: retornando URL mockada"
      );
      // Simular upload: criar uma URL mockada
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}-${file.name}`;

      // Simular delay de upload
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retornar URL mockada
      return `/uploads/${fileName}`;
    }
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }

  // Upload real para Supabase Storage
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const timestamp = Date.now();
  // Sanitizar nome do arquivo para evitar problemas
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;

  console.log("[uploadImage] Tentando upload para:", fileName);

  const { data, error } = await supabase.storage
    .from("championships") // Nome do bucket no Supabase
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadImage] Erro no upload:", {
      message: error.message,
      name: error.name,
      error: error,
    });
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  console.log("[uploadImage] Upload bem-sucedido:", data);

  // Obter URL pública
  const { data: urlData } = supabase.storage
    .from("championships")
    .getPublicUrl(fileName);

  console.log("[uploadImage] URL pública gerada:", urlData.publicUrl);
  return urlData.publicUrl;
}

/**
 * Remove uma imagem do storage
 */
export async function deleteImage(url: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // Se Supabase não estiver configurado, não fazer nada
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "development") {
      return;
    }
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }

  // Extrair nome do arquivo da URL
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extrair caminho do arquivo da URL
    const urlObj = new URL(url);
    const filePath = urlObj.pathname.split(
      "/storage/v1/object/public/championships/"
    )[1];

    if (!filePath) {
      console.warn(
        `Não foi possível extrair o caminho do arquivo da URL: ${url}`
      );
      return;
    }

    const { error } = await supabase.storage
      .from("championships")
      .remove([filePath]);

    if (error) {
      console.error(`Erro ao remover imagem: ${error.message}`);
      throw new Error(`Erro ao remover imagem: ${error.message}`);
    }
  } catch (error) {
    console.error("Erro ao remover imagem do storage:", error);
    throw error;
  }
}

/**
 * Testa a conexão com Supabase Storage
 * @returns true se configurado corretamente, false caso contrário
 */
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  error?: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      configured: false,
      error: "Variáveis de ambiente não configuradas",
    };
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Tentar listar buckets para verificar conexão
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return {
        configured: false,
        error: `Erro ao conectar: ${error.message}`,
      };
    }

    // Verificar se o bucket championships existe
    const championshipsBucket = data?.find((b) => b.name === "championships");
    if (!championshipsBucket) {
      return {
        configured: false,
        error: "Bucket 'championships' não encontrado no Supabase",
      };
    }

    return { configured: true };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
