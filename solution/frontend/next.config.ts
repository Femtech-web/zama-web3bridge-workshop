import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  webpack(configuration) {
    // The workshop offers browser extensions and WalletConnect only.
    configuration.resolve.alias = {
      ...configuration.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "@base-org/account": false,
    };
    return configuration;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
export default nextConfig;
