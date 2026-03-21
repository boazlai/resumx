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

/** Themes that require Tailwind's `.dark` class on <html> */
const DARK_THEMES: Theme[] = [
	'dark',
	'catppuccin-mocha',
	'one-dark-pro',
	'dracula',
	'nord',
	'tokyo-night',
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
