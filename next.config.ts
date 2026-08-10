import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Training material uploads pass through a server action, and the default
      // 1MB body limit rejects an ordinary PDF manual. Matches the 10MB ceiling
      // on the training storage bucket.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
