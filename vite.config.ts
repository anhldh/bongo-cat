import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

/**
 * Domain cho canonical + og:image. Ưu tiên VITE_SITE_URL, không có thì lấy
 * domain mà Vercel / Cloudflare Pages tự cấp lúc build.
 */
function siteUrl(mode: string) {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const url =
    env.VITE_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    env.CF_PAGES_URL ||
    ''
  return url.replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const url = siteUrl(mode)
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      {
        name: 'site-url',
        transformIndexHtml: (html: string) => html.replaceAll('%SITE_URL%', url),
      },
    ],
  }
})
