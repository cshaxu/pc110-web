import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        // QEMU's pthread runtime creates module workers.  `credentialless`
        // preserves cross-origin isolation for SharedArrayBuffer while avoiding
        // `require-corp` blocking an otherwise harmless embedded browser frame.
        { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
      ]
    }];
  }
};

export default nextConfig;
