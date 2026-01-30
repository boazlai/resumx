import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Resumx',
	description: 'Documentations for Resumx',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Quick Start', link: '/quick-start' },
			{ text: 'Examples', link: '/markdown-examples' },
		],

		sidebar: [
			{
				text: 'Getting Started',
				items: [
					{ text: 'What is Resumx?', link: '/what-is-resumx' },
					{ text: 'Quick Start', link: '/quick-start' },
				],
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/vuejs/vitepress' },
		],
	},
})
