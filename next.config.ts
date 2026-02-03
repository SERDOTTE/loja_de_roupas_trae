import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Na versão 16, o ESLint é tratado de forma diferente ou via CLI
  // Removendo a chave 'eslint' para evitar o aviso de "Unrecognized key"
};

export default nextConfig;