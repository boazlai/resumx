'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResumeCard } from '@/components/dashboard/resume-card'
import { CreateResumeButton } from '@/components/dashboard/create-resume-button'
import { ImportResumeButton } from '@/components/dashboard/import-resume-button'
import { Suspense } from 'react'

type ResumeRow = {
	id: string
	title: string
	tags: string[]
	createdAt: Date
	updatedAt: Date
}

type SortBy = 'updated' | 'created' | 'az' | 'za'

export function DashboardShell({ rows }: { rows: ResumeRow[] }) {
	const [searchQuery, setSearchQuery] = useState('')
	const [sortBy, setSortBy] = useState<SortBy>('updated')
	const [activeTag, setActiveTag] = useState<string | null>(null)

	const allTags = useMemo(() => {
		const set = new Set<string>()
		for (const row of rows) {
			for (const tag of row.tags ?? []) set.add(tag)
		}
		return Array.from(set).sort()
	}, [rows])

	const filtered = useMemo(() => {
		let result = rows

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			result = result.filter(r => r.title.toLowerCase().includes(q))
		}

		if (activeTag) {
			result = result.filter(r => (r.tags ?? []).includes(activeTag))
		}

		return [...result].sort((a, b) => {
			switch (sortBy) {
				case 'updated':
					return (
						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
					)
				case 'created':
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					)
				case 'az':
					return a.title.localeCompare(b.title)
				case 'za':
					return b.title.localeCompare(a.title)
			}
		})
	}, [rows, searchQuery, sortBy, activeTag])

	const count = rows.length

	return (
		<main className='px-6 py-8'>
			{/* Header row */}
			<div className='flex items-center justify-between mb-6'>
				<div>
					<h1 className='text-xl font-semibold tracking-tight'>My Resumes</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						{count === 0 ?
							'Create your first resume to get started.'
						:	`${count} resume${count === 1 ? '' : 's'}`}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Suspense>
						<ImportResumeButton />
					</Suspense>
					<Suspense>
						<CreateResumeButton />
					</Suspense>
				</div>
			</div>

			{count === 0 ?
				<EmptyState />
			:	<>
					{/* Search + sort toolbar */}
					<div className='flex items-center gap-3 mb-4'>
						<div className='relative flex-1 max-w-xs'>
							<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
							<Input
								className='pl-8 h-8 text-sm'
								placeholder='Search resumes…'
								value={searchQuery}
								onChange={e => {
									setSearchQuery(e.target.value)
									setActiveTag(null)
								}}
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger className='flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring'>
								{sortBy === 'updated' ?
									'Last Modified'
								: sortBy === 'created' ?
									'Created Date'
								: sortBy === 'az' ?
									'A → Z'
								:	'Z → A'}
								<ChevronDown className='h-3.5 w-3.5 opacity-60' />
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='min-w-[var(--radix-dropdown-menu-trigger-width)]'
							>
								<DropdownMenuItem
									className='text-sm font-medium'
									onSelect={() => setSortBy('updated')}
								>
									Last Modified
								</DropdownMenuItem>
								<DropdownMenuItem
									className='text-sm font-medium'
									onSelect={() => setSortBy('created')}
								>
									Created Date
								</DropdownMenuItem>
								<DropdownMenuItem
									className='text-sm font-medium'
									onSelect={() => setSortBy('az')}
								>
									A → Z
								</DropdownMenuItem>
								<DropdownMenuItem
									className='text-sm font-medium'
									onSelect={() => setSortBy('za')}
								>
									Z → A
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Tag filter pills */}
					{allTags.length > 0 && (
						<div className='flex items-center gap-2 mb-4 flex-wrap'>
							<button
								onClick={() => setActiveTag(null)}
								className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
									activeTag === null ?
										'bg-foreground text-background'
									:	'bg-muted text-muted-foreground hover:bg-muted/80'
								}`}
							>
								All
							</button>
							{allTags.map(tag => (
								<button
									key={tag}
									onClick={() => setActiveTag(activeTag === tag ? null : tag)}
									className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
										activeTag === tag ?
											'bg-foreground text-background'
										:	'bg-muted text-muted-foreground hover:bg-muted/80'
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					)}

					{/* Resume grid */}
					{filtered.length === 0 ?
						<p className='text-sm text-muted-foreground py-12 text-center'>
							No resumes match your search.
						</p>
					:	<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'>
							{filtered.map(resume => (
								<ResumeCard key={resume.id} resume={resume} />
							))}
						</div>
					}
				</>
			}
		</main>
	)
}

function EmptyState() {
	return (
		<div className='border rounded-xl p-12 text-center text-muted-foreground space-y-4'>
			<div className='text-4xl'>📄</div>
			<p className='text-sm'>No resumes yet. Create one to get started.</p>
			<div className='flex items-center justify-center gap-2'>
				<Suspense>
					<ImportResumeButton />
				</Suspense>
				<Suspense>
					<CreateResumeButton />
				</Suspense>
			</div>
		</div>
	)
}
