'use client'

import { useMemo, useState } from 'react'
import { IconCard } from './icon-card'
import manifest from '@/lib/icons-manifest.json'

interface BuiltInTabProps {
	search: string
	onInsert?: (syntax: string, url: string) => void
}

const categories = [
	'all',
	...Array.from(new Set(manifest.map(i => i.category))).sort(),
]

export function BuiltInTab({ search, onInsert }: BuiltInTabProps) {
	const [category, setCategory] = useState('all')

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim()
		return manifest.filter(icon => {
			if (category !== 'all' && icon.category !== category) return false
			if (q && !icon.name.includes(q)) return false
			return true
		})
	}, [search, category])

	return (
		<div className='flex flex-col gap-3'>
			<select
				value={category}
				onChange={e => setCategory(e.target.value)}
				className='text-xs border rounded-md px-2 py-1.5 bg-background text-foreground'
			>
				{categories.map(c => (
					<option key={c} value={c}>
						{c === 'all' ? 'All categories' : c}
					</option>
				))}
			</select>

			{filtered.length === 0 ?
				<p className='text-xs text-muted-foreground py-4 text-center'>
					No icons found
				</p>
			:	<div className='grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1'>
					{filtered.slice(0, 200).map(icon => (
						<IconCard
							key={icon.name}
							name={icon.name}
							src={`/api/icons/builtin/${icon.name}`}
							onInsert={onInsert}
						/>
					))}
				</div>
			}

			{filtered.length > 200 && (
				<p className='text-xs text-muted-foreground text-center'>
					Showing 200 of {filtered.length} — refine your search
				</p>
			)}
		</div>
	)
}
