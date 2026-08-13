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

      // Søk, nodekart, friksjoner, kvaliteter og lesesalen er nå faner under
      // /internal/content. Gamle lenker skal fortsatt lande riktig sted.
      { source: "/internal/search", destination: "/internal/content?tab=search", permanent: true },
      { source: "/internal/nodes", destination: "/internal/content?tab=nodes", permanent: true },
      { source: "/frictions", destination: "/internal/content?tab=frictions", permanent: true },
      { source: "/qualities", destination: "/internal/content?tab=qualities", permanent: true },
      { source: "/reading-room", destination: "/internal/content?tab=resources", permanent: true },
    ];
  },
};

export default nextConfig;
