// next.config.js – add CSP headers for Google OAuth
/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' https://accounts.google.com https://apis.google.com https://www.gstatic.com; " +
      "frame-src https://accounts.google.com; " +
      "connect-src https://www.googleapis.com https://accounts.google.com; " +
      "img-src 'self' data: https://www.gstatic.com;"
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  }
};

module.exports = nextConfig;
