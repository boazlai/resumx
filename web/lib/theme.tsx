'use client'

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
	theme: Theme
	setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	setTheme: () => {},
})

function applyTheme(theme: Theme) {
	if (theme === 'dark') {
		document.documentElement.classList.add('dark')
	} else {
		document.documentElement.classList.remove('dark')
	}
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('light')

	useEffect(() => {
		const stored = localStorage.getItem('theme') as Theme | null
		const resolved: Theme = stored === 'dark' ? 'dark' : 'light'
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
