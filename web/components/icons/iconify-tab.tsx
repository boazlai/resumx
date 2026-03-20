'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { IconCard } from './icon-card'

interface IconifyTabProps {
	search: string
	onInsert?: (syntax: string, url: string) => void
}

interface IconifyResult {
	prefix: string
	name: string
}

export function IconifyTab({ search, onInsert }: IconifyTabProps) {
	const [results, setResults] = useState<IconifyResult[]>([])
	const [loading, setLoading] = useState(false)

	const doSearch = useDebouncedCallback(async (query: string) => {
		if (!query.trim()) {
			setResults([])
			return
		}

		setLoading(true)
		try {
			const res = await fetch(
				`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=60`,
			)
			if (!res.ok) return
			const data = await res.json()

			// Iconify search returns { icons: ["prefix:name", ...] }
			const icons: IconifyResult[] = (data.icons ?? []).map((id: string) => {
				const [prefix, ...rest] = id.split(':')
				return { prefix, name: rest.join(':') }
			})
			setResults(icons)
		} catch {
			// ignore
		} finally {
			setLoading(false)
		}
	}, 400)

	useEffect(() => {
		doSearch(search)
	}, [search, doSearch])

	if (!search.trim()) {
		return (
			<p className='text-xs text-muted-foreground py-4 text-center'>
				Type to search 200,000+ icons from Iconify
			</p>
		)
	}

	if (loading) {
		return (
			<p className='text-xs text-muted-foreground py-4 text-center'>
				Searching...
			</p>
		)
	}

	if (results.length === 0) {
		return (
			<p className='text-xs text-muted-foreground py-4 text-center'>
				No icons found
			</p>
		)
	}

	return (
		<div className='grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1'>
			{results.map(icon => {
				const fullName = `${icon.prefix}/${icon.name}`
				const url = `https://api.iconify.design/${icon.prefix}/${icon.name}.svg`
				return (
					<IconCard
						key={fullName}
						name={fullName}
						src={url}
						onInsert={onInsert}
					/>
				)
			})}
		</div>
	)
}
