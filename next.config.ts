import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Gives `next dev` access to the same bindings the deployed Worker uses,
// including the local D1 database behind the `DB` binding.
initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });

const nextConfig: NextConfig = {};

export default nextConfig;
