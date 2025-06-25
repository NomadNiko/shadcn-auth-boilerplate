import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PORT: '3000',
  },
  serverRuntimeConfig: {
    port: 3000,
  },
  publicRuntimeConfig: {
    port: 3000,
  },
};

export default nextConfig;
