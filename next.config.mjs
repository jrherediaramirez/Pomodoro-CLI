// next.config.mjs - Enhanced security configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // serverComponentsExternalPackages: ['@firebase/auth', '@firebase/firestore'],
  },
  serverExternalPackages: ['@firebase/auth', '@firebase/firestore'],
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.googleapis.com https://*.firebase.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
              "frame-src https://*.firebase.com https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ];
  },

  // Environment variable validation
  // env: {
  //   NODE_ENV: process.env.NODE_ENV,
  // },

  // Webpack configuration for security
  webpack: (config, { isServer }) => {
    // Add security-related configurations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Image optimization security
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // API route security
  async rewrites() {
    return {
      beforeFiles: [
        // Rate limiting could be implemented here
      ],
    };
  },

  // Production optimizations
  productionBrowserSourceMaps: false,
  // optimizeFonts: true,
  compress: true,

  // Security-related redirects
  async redirects() {
    return [
      // Redirect insecure requests in production
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://your-domain.com/:path*',
          permanent: true,
        },
      ] : []),
    ];
  },
};

export default nextConfig;