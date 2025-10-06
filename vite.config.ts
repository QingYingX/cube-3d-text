import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-umami',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `  <script 
            defer 
            src="https://umami.099311.xyz/script.js" 
            data-website-id="67c56e39-e940-4c56-95d4-1cb69e75e322"
            data-host-url="https://umami.099311.xyz"
          ></script>
</head>`
        )
      }
    }
  ],
  server: { port: 3000 }
})
