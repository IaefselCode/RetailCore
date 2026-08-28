import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // sharp has native binaries (libvips) that don't exist on Vercel's
  // serverless runtime.  Mark it as external so Next.js never tries to
  // bundle it — optimizeImage() in images-server.ts already gracefully
  // falls back to the original buffer when sharp can't load.
  serverExternalPackages: ["sharp"],
};

export default withNextIntl(nextConfig);
