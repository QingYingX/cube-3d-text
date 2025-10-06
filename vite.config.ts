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
  <script>
    function moveHomeButtonToFirst() {
        const container = document.querySelector('#root > div > div:nth-child(3) > div:nth-child(3)');
        if (container) {
            const homeButton = document.getElementById('home-button');
            const easeCationButton = container.querySelector('a[href="https://github.com/EaseCation/cube-3d-text"]');
            if (homeButton && easeCationButton) {
                container.insertBefore(homeButton, easeCationButton);
            }
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        const checkAndMove = setInterval(function() {
            const homeButton = document.getElementById('home-button');
            if (homeButton) {
                moveHomeButtonToFirst();
                clearInterval(checkAndMove);
            }
        }, 100);
        setTimeout(() => clearInterval(checkAndMove), 5000);
    });
  </script>
</head>`
        )
      }
    }
  ],
  server: { port: 3000 }
})
