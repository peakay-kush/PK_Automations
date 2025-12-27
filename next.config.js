/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude sql.js from webpack bundling to prevent build-time initialization errors
      config.externals = config.externals || [];
      config.externals.push('sql.js');
    }
    return config;
  },
};

module.exports = nextConfig;
