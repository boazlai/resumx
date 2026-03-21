'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export interface UserPreferences {
	defaultFont: string | null
	autoSave: boolean
	autoSaveInterval: number
	autoCompile: boolean
	linkedinUrl: string | null
	githubUrl: string | null
}

const DEFAULTS: UserPreferences = {
	defaultFont: null,
	autoSave: true,
	autoSaveInterval: 10,
	autoCompile: true,
	linkedinUrl: null,
	githubUrl: null,
}

export function usePreferences() {
	const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch('/api/user/preferences')
			.then(r => (r.ok ? r.json() : null))
			.then(data => {
				if (data) setPrefs({ ...DEFAULTS, ...data })
			})
			.catch(() => {})
			.finally(() => setLoading(false))
	}, [])

	const persistPrefs = useDebouncedCallback(
		async (update: Partial<UserPreferences>) => {
			await fetch('/api/user/preferences', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(update),
			})
		},
		500,
	)

	const updatePrefs = useCallback(
		(update: Partial<UserPreferences>) => {
			setPrefs(prev => ({ ...prev, ...update }))
			persistPrefs(update)
		},
		[persistPrefs],
	)

	return { prefs, loading, updatePrefs }
}
