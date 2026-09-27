import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Phase 12 : fiche bar et compte réunis sur /mon-profil.
  async redirects() {
    return [
      { source: "/mon-bar", destination: "/mon-profil", permanent: true },
      { source: "/mon-compte", destination: "/mon-profil", permanent: true },
    ];
  },
};

export default nextConfig;
