import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração webpack (usada quando --webpack flag é passada)
  webpack: (config, { isServer }) => {
    // Resolver warning de source map do Prisma
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Suprimir warnings de source map do Prisma
    // O warning "Invalid source map" do Prisma é conhecido e não afeta funcionalidade
    config.ignoreWarnings = [
      {
        module: /node_modules\/@prisma\/client/,
        message: /source map/,
      },
    ];

    return config;
  },
  // Configuração turbopack vazia para silenciar o erro
  // Quando usar Turbopack, essas configurações não são necessárias
  turbopack: {},
  // Desabilitar source maps em produção para melhor performance
  productionBrowserSourceMaps: false,
};

export default nextConfig;
