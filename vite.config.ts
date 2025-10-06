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
            data-website-id="c524f440-7c7f-4e16-8145-4c534d10a6ed"
          ></script>
</head>`
        )
      }
    }
  ],
  server: { port: 3000 }
})
