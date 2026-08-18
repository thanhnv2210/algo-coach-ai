import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Vercel's file tracer doesn't detect files read via readFileSync at runtime.
  // This tells it to include all lesson markdown files in the serverless bundle.
  outputFileTracingIncludes: {
    "/java-lab/[category]/[lesson]": ["./lib/content/java-lab/**/*.md"],
  },
}

export default nextConfig
