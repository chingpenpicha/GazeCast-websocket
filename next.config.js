/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SEESO_KEY: 'dev_j1ibas14bjbydb3xe65mdk9gj42rraplrfxbmu1w',
  },
  async headers() {
    return [
      {
        source: '/eyetrack',
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
