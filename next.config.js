/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    appDir: true,
  },
  api: {
    // Increase the body parser size limit for API routes
    // This is only for the initial request to get the presigned URL, not for the actual file upload
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

module.exports = nextConfig;
