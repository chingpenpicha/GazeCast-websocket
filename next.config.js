/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SEESO_KEY: 'dev_5lnmpgqq7pkxpmw9g9f4sxzogayxoopz4bhpe8sv',
  },
  async headers() {
    return [
      {
        source: '/mobile',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
      source: '/webcam',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
      ],
    },
    ]
  },
  
}

module.exports = nextConfig
