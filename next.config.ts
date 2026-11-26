import type { NextConfig } from "next";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDev = process.env.NODE_ENV === "development";

// 'unsafe-inline' en scripts y estilos lo exige Next/React hasta que haya nonce por petición (proxy).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Fotos y firmas: URL firmadas de Supabase Storage.
  `img-src 'self' blob: data: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Hasta 3 fotos de 2 MB por backlog o RM (más el sobre del formulario); el Excel de equipos pesa 2 MB.
    serverActions: { bodySizeLimit: "7mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Dashboard y exportaciones con datos de la empresa: nunca en caché (corte 10).
      {
        source: "/:ruta(inicio|reportes)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
  // La primera vista es el login.
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
