import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async redirects() {
    // Sources carry the locale segment: the proxy adds it before these rules
    // are evaluated, so an unprefixed source would never match.
    return [
      // Kartet er fjernet for godt; ruta viste intern admin-tekst til
      // utloggede besøkende. /index var et duplikat av forsiden.
      { source: "/:lang(no|en)/explore", destination: "/:lang", permanent: true },
      { source: "/:lang(no|en)/index", destination: "/:lang", permanent: true },

      // Søk, nodekart, friksjoner, kvaliteter og lesesalen er nå faner under
      // /internal/content. Gamle lenker skal fortsatt lande riktig sted.
      { source: "/:lang(no|en)/internal/search", destination: "/:lang/internal/content?tab=search", permanent: true },
      { source: "/:lang(no|en)/internal/nodes", destination: "/:lang/internal/content?tab=nodes", permanent: true },
      { source: "/:lang(no|en)/frictions", destination: "/:lang/internal/content?tab=frictions", permanent: true },
      { source: "/:lang(no|en)/qualities", destination: "/:lang/internal/content?tab=qualities", permanent: true },
      { source: "/:lang(no|en)/reading-room", destination: "/:lang/internal/content?tab=resources", permanent: true },
    ];
  },
};

export default nextConfig;
