import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // No incluir pino-pretty en el bundle del cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
      };
    }
    return config;
  },
};

export default nextConfig;
