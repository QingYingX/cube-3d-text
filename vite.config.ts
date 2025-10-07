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
					`
<script>
	function createAndMoveHomeButton() {
		const container = document.querySelector('#root > div > div:nth-child(3) > div:nth-child(3)');
		if (container && !document.getElementById('home-button')) {
			const originalButton = container.querySelector('a');
			const newButton = document.createElement('a');
			newButton.id = 'home-button';
			newButton.href = 'https://home.099311.xyz';
			newButton.target = '_blank';
			newButton.rel = 'noopener noreferrer';
			newButton.className = originalButton ? originalButton.className : '';
			newButton.innerHTML =
				'<button type="button" class="ant-btn css-1j907dm ant-btn-text ant-btn-color-default ant-btn-variant-text" style="padding: 0px 12px;"><span class="ant-typography ant-typography-secondary css-1j907dm"><div class="ant-space css-1j907dm ant-space-horizontal ant-space-align-center ant-space-gap-row-small ant-space-gap-col-small"><div class="ant-space-item"><span role="img" aria-label="home" class="anticon anticon-home"><svg viewBox="64 64 896 896" focusable="false" data-icon="home" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M946.5 505L534.6 93.4a31.93 31.93 0 00-45.2 0L77.5 505c-12 12-18.8 28.3-18.8 45.3 0 35.3 28.7 64 64 64h43.4V908c0 17.7 14.3 32 32 32H448V716h112v224h265.9c17.7 0 32-14.3 32-32V614.3h43.4c17 0 33.3-6.7 45.3-18.8 24.9-25 24.9-65.5-.1-90.5z"></path></svg></span></div><div class="ant-space-item">QingYingX的主页</div></div></span></button>';
			const easeCationButton = container.querySelector('a[href="https://github.com/EaseCation/cube-3d-text"]');
			if (easeCationButton) {
				container.insertBefore(newButton, easeCationButton);
			} else {
				container.insertBefore(newButton, container.firstChild);
			}
		}
	}
	document.addEventListener('DOMContentLoaded', function() {
		createAndMoveHomeButton();
		const observer = new MutationObserver(function() {
			const container = document.querySelector('#root > div > div:nth-child(3) > div:nth-child(3)');
			if (container && !document.getElementById('home-button')) {
				createAndMoveHomeButton();
				observer.disconnect();
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
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