/** @type {import('next').NextConfig} */

function parseApiOrigin(apiUrl) {
  try {
    const url = new URL(apiUrl.replace(/\/api\/?$/, ''))
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port || undefined,
    }
  } catch {
    return null
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
const apiOrigin = parseApiOrigin(apiUrl)

const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '8000' },
]

// In production the API is on a real host — allow its images too
if (apiOrigin && apiOrigin.hostname !== 'localhost') {
  remotePatterns.push({
    protocol: apiOrigin.protocol,
    hostname: apiOrigin.hostname,
    ...(apiOrigin.port ? { port: apiOrigin.port } : {}),
  })
}

// If media is served from a separate CDN / S3 custom domain, allow that too
const mediaDomain = process.env.NEXT_PUBLIC_MEDIA_DOMAIN
if (mediaDomain) {
  remotePatterns.push({ protocol: 'https', hostname: mediaDomain })
}

const nextConfig = {
  images: { remotePatterns },
}

module.exports = nextConfig
