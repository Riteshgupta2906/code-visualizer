/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow Node.js modules in server-side code
      config.externals.push({
        "@prisma/internals": "commonjs @prisma/internals",
        "@prisma/fetch-engine": "commonjs @prisma/fetch-engine",
        "@prisma/generator-helper": "commonjs @prisma/generator-helper",
        "@prisma/get-platform": "commonjs @prisma/get-platform",
      });
    }
    return config;
  },
  serverExternalPackages: [
    "madge",
    "precinct",
    "filing-cabinet",
    "dependency-tree",
    "typescript",
  ],
};

export default nextConfig;
