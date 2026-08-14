/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  // Ensure strict reactivity and clean asset routing
  reactStrictMode: true,
};

export default nextConfig;
