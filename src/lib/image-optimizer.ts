/**
 * Utilitário para otimização de imagens
 * Em produção, isso será feito no servidor antes de enviar para Supabase Storage
 */

export interface OptimizedImage {
  file: File;
  preview: string;
  size: number; // Tamanho em bytes
}

/**
 * Otimiza uma imagem redimensionando e comprimindo
 * @param file Arquivo de imagem original
 * @param maxWidth Largura máxima (padrão: 800px)
 * @param maxHeight Altura máxima (padrão: 800px)
 * @param quality Qualidade de compressão (0-1, padrão: 0.8)
 * @returns Promise com o arquivo otimizado
 */
export async function optimizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<OptimizedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao converter imagem'));
              return;
            }

            // Criar File a partir do blob
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            // Criar preview
            const preview = canvas.toDataURL(file.type, quality);

            resolve({
              file: optimizedFile,
              preview,
              size: optimizedFile.size,
            });
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Verificar tipo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'O arquivo deve ser uma imagem' };
  }

  // Verificar tamanho (máximo 10MB antes da otimização)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'A imagem deve ter no máximo 10MB' };
  }

  return { valid: true };
}

