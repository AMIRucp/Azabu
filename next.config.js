import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "frame-ancestors 'self' https://*.replit.dev https://*.repl.co",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      'lightweight-charts',
      'lucide-react',
    ],
  },
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  serverExternalPackages: [
    '@drift-labs/sdk',
    '@coral-xyz/anchor',
    'rpc-websockets',
    'pg',
    'drizzle-orm',
  ],
  allowedDevOrigins: [],
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
    '@solana/wallet-adapter-phantom',
    '@solana/wallet-adapter-solflare',
    '@solana/wallet-adapter-backpack',
    '@solana/wallet-adapter-coinbase',
    '@solana/web3.js',
  ],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        assert: false,
        os: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        url: require.resolve('url/'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );

      const driftShim = path.resolve(__dirname, 'src/lib/drift-sdk-shim.js');
      const asyncStorageStub = path.resolve(__dirname, 'src/lib/async-storage-stub.js');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@drift-labs/sdk': driftShim,
        'jito-ts': driftShim,
        '@pythnetwork/pyth-solana-receiver': driftShim,
        '@pythnetwork/solana-utils': driftShim,
        'rpc-websockets/dist/lib/client': driftShim,
        'rpc-websockets/dist/lib/client/websocket.browser': driftShim,
        '@react-native-async-storage/async-storage': asyncStorageStub,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      'rpc-websockets': require.resolve('rpc-websockets'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/lib/async-storage-stub.js'),
    };

    config.externals = config.externals || [];

    return config;
  },
};

export default nextConfig;
