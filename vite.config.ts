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
    function updateHomeButton() {
        const buttonSelector = '#root > div > div:nth-child(3) > div:nth-child(3) > a';
        const targetButton = document.querySelector(buttonSelector);
        if (targetButton) {
            targetButton.href = 'https://home.099311.xyz';
            targetButton.setAttribute('target', '_blank');
            targetButton.setAttribute('rel', 'noopener noreferrer');
            const githubIcon = targetButton.querySelector('.anticon-github');
            if (githubIcon) {
                githubIcon.className = 'anticon anticon-home';
                githubIcon.innerHTML = '<svg viewBox=\"64 64 896 896\" focusable=\"false\" data-icon=\"home\" width=\"1em\" height=\"1em\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M946.5 505L534.6 93.4a31.93 31.93 0 00-45.2 0L77.5 505c-12 12-18.8 28.3-18.8 45.3 0 35.3 28.7 64 64 64h43.4V908c0 17.7 14.3 32 32 32H448V716h112v224h265.9c17.7 0 32-14.3 32-32V614.3h43.4c17 0 33.3-6.7 45.3-18.8 24.9-25 24.9-65.5-.1-90.5z\"></path></svg>';
            }
            const textElement = targetButton.querySelector('.ant-space-item:last-child');
            if (textElement) {
                textElement.textContent = 'QingYingX的主页';
            }
        }
    }
    document.addEventListener('DOMContentLoaded', function() {
        updateHomeButton();
        const observer = new MutationObserver(function() {
            const button = document.querySelector('#root > div > div:nth-child(3) > div:nth-child(3) > a');
            if (button) {
                updateHomeButton();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 5000);
    });
  </script>
</head>`
        )
      }
    }
  ],
  server: { port: 3000 }
})
