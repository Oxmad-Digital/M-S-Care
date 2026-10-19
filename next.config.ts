import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Images produits hébergées sur le bucket R2 « ms-care ».
    remotePatterns: [
      new URL("https://pub-03e5ddd75c8541208a4e5d63870dd622.r2.dev/**"),
    ],
  },
};

export default nextConfig;
