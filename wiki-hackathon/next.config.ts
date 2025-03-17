import type { NextConfig } from 'next'
import type { Configuration as WebpackConfig } from 'next/dist/server/config-shared'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}

export default nextConfig
