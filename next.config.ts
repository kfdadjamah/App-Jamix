import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Dev : autorise le test depuis un téléphone du réseau local (sinon le HMR est refusé et la page ne s'hydrate pas).
  allowedDevOrigins: ["192.168.*.*"],
  // Phase 12 : fiche bar et compte réunis sur /mon-profil.
  async redirects() {
    return [
      { source: "/mon-bar", destination: "/mon-profil", permanent: true },
      { source: "/mon-compte", destination: "/mon-profil", permanent: true },
    ];
  },
};

export default nextConfig;
