import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async redirects() {
    return [
      // Kartet er fjernet for godt; ruta viste intern admin-tekst til
      // utloggede besøkende. /index var et duplikat av forsiden.
      { source: "/explore", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
