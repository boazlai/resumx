'use client'

import { useState, useRef } from 'react'
import { Search, BookOpen, Upload, Link } from 'lucide-react'
import { BuiltInTab } from './built-in-tab'
import { IconifyTab } from './iconify-tab'
import { EmojiTab } from './emoji-tab'
import { MyIconsTab } from './my-icons-tab'
import { useToast } from '@/lib/toast'

const TABS = ['Built-in', 'Iconify', 'Emoji', 'My Icons'] as const
type Tab = (typeof TABS)[number]

const NAME_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/

interface IconBrowserProps {
	/** 'page' = horizontal tabs, full width. 'sidebar' = three always-visible sections. */
	variant?: 'page' | 'sidebar'
	/** Callback when an icon is clicked (in addition to copy-to-clipboard). */
	onInsert?: (syntax: string, url: string) => void
}

/* ── Page variant ─────────────────────────────────────────────────────────── */

function IconBrowserPage({
	onInsert,
}: {
	onInsert?: (syntax: string, url: string) => void
}) {
	const [tab, setTab] = useState<Tab>('Built-in')
	const [search, setSearch] = useState('')

	const tabContent = (() => {
		switch (tab) {
			case 'Built-in':
				return <BuiltInTab search={search} onInsert={onInsert} />
			case 'Iconify':
				return <IconifyTab search={search} onInsert={onInsert} />
			case 'Emoji':
				return <EmojiTab search={search} onInsert={onInsert} />
			case 'My Icons':
				return <MyIconsTab onInsert={onInsert} />
		}
	})()

	return (
		<div className='flex flex-col gap-3'>
			<div className='relative'>
				<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
				<input
					type='text'
					placeholder='Search icons...'
					value={search}
					onChange={e => setSearch(e.target.value)}
					className='w-full text-sm border rounded-md pl-8 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
				/>
			</div>
			<div className='flex gap-1 border-b'>
				{TABS.map(t => (
					<button
						key={t}
						type='button'
						onClick={() => setTab(t)}
						className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
							tab === t ?
								'border-primary text-foreground'
							:	'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						{t}
					</button>
				))}
			</div>
			<div>{tabContent}</div>
		</div>
	)
}

/* ── Sidebar variant ──────────────────────────────────────────────────────── */

function IconBrowserSidebar({
	onInsert,
}: {
	onInsert?: (syntax: string, url: string) => void
}) {
	const { toast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [tab, setTab] = useState<Tab>('Built-in')
	const [search, setSearch] = useState('')

	// Upload state
	const [uploading, setUploading] = useState(false)
	const [name, setName] = useState('')
	const [urlInput, setUrlInput] = useState('')
	const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [myIconsKey, setMyIconsKey] = useState(0)

	const handleUpload = async () => {
		if (!NAME_RE.test(name)) {
			toast({
				title: 'Invalid name',
				description:
					'2-30 chars: lowercase letters, numbers, hyphens, underscores',
				variant: 'destructive',
			})
			return
		}
		setUploading(true)
		try {
			let res: Response
			if (uploadMode === 'file') {
				if (!selectedFile) {
					toast({ title: 'Select a file first', variant: 'destructive' })
					return
				}
				const formData = new FormData()
				formData.append('file', selectedFile)
				formData.append('name', name)
				res = await fetch('/api/icons', { method: 'POST', body: formData })
			} else {
				if (!urlInput.trim()) {
					toast({ title: 'Enter a URL', variant: 'destructive' })
					return
				}
				res = await fetch('/api/icons', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ url: urlInput.trim(), name }),
				})
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				toast({
					title: 'Upload failed',
					description: data.error ?? 'Unknown error',
					variant: 'destructive',
				})
				return
			}
			const icon = await res.json()
			setName('')
			setUrlInput('')
			setSelectedFile(null)
			if (fileInputRef.current) fileInputRef.current.value = ''
			toast({ title: `Uploaded! Click to copy :${icon.name}:` })
			setMyIconsKey(k => k + 1)
			setTab('My Icons')
		} finally {
			setUploading(false)
		}
	}

	const browseContent = (() => {
		switch (tab) {
			case 'Built-in':
				return <BuiltInTab search={search} onInsert={onInsert} />
			case 'Iconify':
				return <IconifyTab search={search} onInsert={onInsert} />
			case 'Emoji':
				return <EmojiTab search={search} onInsert={onInsert} />
			case 'My Icons':
				return (
					<MyIconsTab key={myIconsKey} onInsert={onInsert} showUpload={false} />
				)
		}
	})()

	return (
		<div className='h-full flex flex-col'>
			{/* ── 1. Icon Guide ─────────────────────────────────────────────── */}
			<section className='shrink-0 px-3 py-2.5 border-b bg-muted/20'>
				<div className='flex items-center gap-1.5 text-xs font-semibold mb-1.5'>
					<BookOpen className='h-3.5 w-3.5' />
					Icon Guide
				</div>
				<p className='text-[11px] text-muted-foreground leading-snug'>
					Insert with{' '}
					<code className='font-mono bg-muted px-1 py-0.5 rounded text-[10px]'>
						:name:
					</code>{' '}
					syntax. Iconify:{' '}
					<code className='font-mono bg-muted px-1 py-0.5 rounded text-[10px]'>
						:prefix/name:
					</code>
				</p>
				<a
					href='/icons'
					target='_blank'
					rel='noreferrer'
					className='text-[11px] text-primary underline-offset-2 hover:underline mt-1 inline-block'
				>
					Browse all icons →
				</a>
			</section>

			{/* ── 2. Custom Upload ──────────────────────────────────────────── */}
			<section className='shrink-0 px-3 py-2.5 border-b'>
				<div className='flex items-center gap-1.5 text-xs font-semibold mb-2'>
					<Upload className='h-3.5 w-3.5' />
					Custom Upload
				</div>
				<div className='flex gap-1.5 mb-2'>
					<button
						type='button'
						onClick={() => setUploadMode('file')}
						className={`text-[11px] px-2 py-0.5 rounded ${
							uploadMode === 'file' ?
								'bg-primary text-primary-foreground'
							:	'bg-muted text-muted-foreground'
						}`}
					>
						File
					</button>
					<button
						type='button'
						onClick={() => setUploadMode('url')}
						className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-0.5 ${
							uploadMode === 'url' ?
								'bg-primary text-primary-foreground'
							:	'bg-muted text-muted-foreground'
						}`}
					>
						<Link className='h-2.5 w-2.5' />
						URL
					</button>
				</div>

				{uploadMode === 'file' ?
					<input
						ref={fileInputRef}
						type='file'
						aria-label='Upload icon file'
						accept='image/svg+xml,image/png,image/jpeg'
						onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
						className='text-[11px] w-full mb-1.5 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-muted file:text-foreground'
					/>
				:	<input
						type='url'
						placeholder='https://example.com/icon.svg'
						value={urlInput}
						onChange={e => setUrlInput(e.target.value)}
						className='w-full text-[11px] border rounded px-2 py-1 bg-background mb-1.5'
					/>
				}

				<input
					type='text'
					placeholder='Icon name (e.g. my-company)'
					value={name}
					onChange={e => setName(e.target.value.toLowerCase())}
					className='w-full text-[11px] border rounded px-2 py-1 bg-background mb-1.5'
				/>
				<button
					type='button'
					onClick={handleUpload}
					disabled={uploading || !name}
					className='w-full text-[11px] font-medium py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
				>
					{uploading ? 'Uploading...' : 'Upload'}
				</button>
			</section>

			{/* ── 3. Search Icons ───────────────────────────────────────────── */}
			<section className='flex flex-col flex-1 min-h-0 px-3 py-2.5'>
				<div className='flex items-center gap-1.5 text-xs font-semibold mb-2'>
					<Search className='h-3.5 w-3.5' />
					Search Icons
				</div>
				<div className='relative mb-2'>
					<Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground' />
					<input
						type='text'
						placeholder='Search icons...'
						value={search}
						onChange={e => setSearch(e.target.value)}
						className='w-full text-xs border rounded-md pl-7 pr-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
					/>
				</div>
				<div className='flex gap-1 mb-2 flex-wrap'>
					{TABS.map(t => (
						<button
							key={t}
							type='button'
							onClick={() => setTab(t)}
							className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
								tab === t ?
									'bg-primary text-primary-foreground'
								:	'bg-muted text-muted-foreground hover:text-foreground'
							}`}
						>
							{t}
						</button>
					))}
				</div>
				<div className='overflow-y-auto flex-1 min-h-0'>{browseContent}</div>
			</section>
		</div>
	)
}

/* ── Main export ──────────────────────────────────────────────────────────── */

export function IconBrowser({ variant = 'page', onInsert }: IconBrowserProps) {
	if (variant === 'sidebar') {
		return <IconBrowserSidebar onInsert={onInsert} />
	}
	return <IconBrowserPage onInsert={onInsert} />
}
