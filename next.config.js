/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SEESO_KEY: process.env.SEESO_KEY,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    PROJECT_ID:process.env.PROJECT_ID,
    STORAGE_BACKET:process.env.STORAGE_BACKET,
    MESSAGEING_SENDER_ID: process.env.MESSAGEING_SENDER_ID,
    APP_ID: process.env.APP_ID,
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
