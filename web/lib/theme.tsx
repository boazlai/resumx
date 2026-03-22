'use client'

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react'

export type Theme =
	| 'light'
	| 'dark'
	| 'catppuccin-latte'
	| 'catppuccin-mocha'
	| 'one-dark-pro'
	| 'dracula'
	| 'nord'
	| 'solarized-light'
	| 'tokyo-night'
	| 'github-light'
	| 'github-dark'
	| 'monokai-pro'
	| 'ayu-dark'
	| 'ayu-light'
	| 'panda'
	| 'winter-is-coming-dark'
	| 'shades-of-purple'
	| 'material-dark'
	| 'gruvbox-dark'

/** Themes that require Tailwind's `.dark` class on <html> */
const DARK_THEMES: Theme[] = [
	'dark',
	'catppuccin-mocha',
	'one-dark-pro',
	'dracula',
	'nord',
	'tokyo-night',
	'github-dark',
	'monokai-pro',
	'ayu-dark',
	'panda',
	'winter-is-coming-dark',
	'shades-of-purple',
	'material-dark',
	'gruvbox-dark',
]

interface ThemeContextType {
	theme: Theme
	setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	setTheme: () => {},
})

const THEME_CLASSES: Record<Exclude<Theme, 'light' | 'dark'>, string> = {
	'catppuccin-mocha': 'theme-catppuccin-mocha',
	'catppuccin-latte': 'theme-catppuccin-latte',
	'one-dark-pro': 'theme-one-dark-pro',
	dracula: 'theme-dracula',
	nord: 'theme-nord',
	'solarized-light': 'theme-solarized-light',
	'tokyo-night': 'theme-tokyo-night',
	'github-light': 'theme-github-light',
	'github-dark': 'theme-github-dark',
	'monokai-pro': 'theme-monokai-pro',
	'ayu-dark': 'theme-ayu-dark',
	'ayu-light': 'theme-ayu-light',
	panda: 'theme-panda',
	'winter-is-coming-dark': 'theme-winter-is-coming-dark',
	'shades-of-purple': 'theme-shades-of-purple',
	'material-dark': 'theme-material-dark',
	'gruvbox-dark': 'theme-gruvbox-dark',
}

function applyTheme(theme: Theme) {
	const root = document.documentElement
	// Remove all theme-specific classes first
	root.classList.remove('dark', ...Object.values(THEME_CLASSES))
	// Add .dark for Tailwind dark: utilities when applicable
	if (DARK_THEMES.includes(theme)) root.classList.add('dark')
	// Add theme-specific class for non-base themes
	if (theme in THEME_CLASSES)
		root.classList.add(THEME_CLASSES[theme as keyof typeof THEME_CLASSES])
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('light')

	useEffect(() => {
		const stored = localStorage.getItem('theme') as Theme | null
		const validThemes: Theme[] = [
			'light',
			'dark',
			'catppuccin-latte',
			'catppuccin-mocha',
			'one-dark-pro',
			'dracula',
			'nord',
			'solarized-light',
			'tokyo-night',
			'github-light',
			'github-dark',
			'monokai-pro',
			'ayu-dark',
			'ayu-light',
			'panda',
			'winter-is-coming-dark',
			'shades-of-purple',
			'material-dark',
			'gruvbox-dark',
		]
		const resolved: Theme =
			stored && validThemes.includes(stored) ? stored : 'light'
		setThemeState(resolved)
		applyTheme(resolved)
	}, [])

	function setTheme(t: Theme) {
		setThemeState(t)
		applyTheme(t)
		localStorage.setItem('theme', t)
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	return useContext(ThemeContext)
}
