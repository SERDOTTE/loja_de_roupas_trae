import type { NextConfig } from "next";

// Usamos 'as any' para evitar que o TS barre propriedades 
// que ele ainda não conhece na versão 16
const nextConfig: any = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
};

export default nextConfig;