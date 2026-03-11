/// <reference types="vite/client" />
/// <reference path="../../node_modules/vue/dist/vue.d.ts" />

export {}

interface TurnstileRenderOptions {
	sitekey: string
	appearance?: 'always' | 'execute' | 'interaction-only'
	execution?: 'render' | 'execute'
	callback?: (token: string) => void
	'error-callback'?: () => void
	'expired-callback'?: () => void
	theme?: 'light' | 'dark' | 'auto'
	size?: 'normal' | 'compact'
}

interface TurnstileInstance {
	render(
		container: string | HTMLElement,
		options: TurnstileRenderOptions,
	): string
	reset(widgetId: string): void
	remove(widgetId: string): void
	execute(container: string | HTMLElement): void
}

declare global {
	interface Window {
		turnstile?: TurnstileInstance
	}
}
