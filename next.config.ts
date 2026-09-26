import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These ship native/WASM binaries (onnxruntime) and must run as real Node
  // modules on the server, not be bundled/traced by webpack.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
