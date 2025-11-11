import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Optimisations pour la production
  compress: true,
  poweredByHeader: false,
  
  // Configuration pour WebLLM et WebGPU
  webpack: (config, { dev, isServer }) => {
    // Support pour WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Headers pour Cross-Origin Isolation (requis pour WebGPU)
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Optimisations pour la production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            webllm: {
              name: 'webllm',
              test: /[\\/]node_modules[\\/]@mlc-ai[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            transformers: {
              name: 'transformers',
              test: /[\\/]node_modules[\\/]@xenova[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  
  // Headers nécessaires pour WebGPU et SharedArrayBuffer
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
