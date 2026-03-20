'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '@/lib/toast'
import { IconCard } from './icon-card'
import { Upload, Trash2, Link } from 'lucide-react'

interface UserIcon {
	id: string
	name: string
	url: string
	format: string
}

interface MyIconsTabProps {
	onInsert?: (syntax: string, url: string) => void
	/** When false, hides the upload form (used when upload is handled externally). Default: true */
	showUpload?: boolean
}

const NAME_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/

export function MyIconsTab({ onInsert, showUpload = true }: MyIconsTabProps) {
	const { toast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [icons, setIcons] = useState<UserIcon[]>([])
	const [loading, setLoading] = useState(true)
	const [uploading, setUploading] = useState(false)
	const [name, setName] = useState('')
	const [urlInput, setUrlInput] = useState('')
	const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)

	const fetchIcons = useCallback(async () => {
		try {
			const res = await fetch('/api/icons')
			if (res.ok) {
				setIcons(await res.json())
			}
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchIcons()
	}, [fetchIcons])

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

			const icon: UserIcon = await res.json()
			setIcons(prev => [...prev, icon])
			setName('')
			setUrlInput('')
			setSelectedFile(null)
			if (fileInputRef.current) fileInputRef.current.value = ''
			toast({ title: `Uploaded! Click to copy :${icon.name}:` })
		} finally {
			setUploading(false)
		}
	}

	const handleDelete = async (icon: UserIcon) => {
		const res = await fetch(`/api/icons/${icon.id}`, { method: 'DELETE' })
		if (res.ok) {
			setIcons(prev => prev.filter(i => i.id !== icon.id))
			toast({ title: `Deleted :${icon.name}:` })
		} else {
			toast({ title: 'Delete failed', variant: 'destructive' })
		}
	}

	if (loading) {
		return (
			<p className='text-xs text-muted-foreground py-4 text-center'>
				Loading...
			</p>
		)
	}

	return (
		<div className='flex flex-col gap-4'>
			{/* Upload form */}
			{showUpload && (
				<div className='border rounded-lg p-3 space-y-3 bg-muted/20'>
					<div className='flex items-center gap-2 text-xs font-medium'>
						<Upload className='h-3.5 w-3.5' />
						Upload Icon
					</div>

					{/* Toggle file / URL */}
					<div className='flex gap-2'>
						<button
							type='button'
							onClick={() => setUploadMode('file')}
							className={`text-xs px-2 py-1 rounded ${
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
							className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
								uploadMode === 'url' ?
									'bg-primary text-primary-foreground'
								:	'bg-muted text-muted-foreground'
							}`}
						>
							<Link className='h-3 w-3' />
							URL
						</button>
					</div>

					{uploadMode === 'file' ?
						<div>
							<input
								ref={fileInputRef}
								type='file'
								accept='image/svg+xml,image/png,image/jpeg'
								onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
								className='text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-muted file:text-foreground'
							/>
							<p className='text-[10px] text-muted-foreground mt-1'>
								SVG, PNG, JPG &middot; Max 2 MB
							</p>
						</div>
					:	<input
							type='url'
							placeholder='https://example.com/icon.svg'
							value={urlInput}
							onChange={e => setUrlInput(e.target.value)}
							className='w-full text-xs border rounded px-2 py-1.5 bg-background'
						/>
					}

					<input
						type='text'
						placeholder='Icon name (e.g. my-company)'
						value={name}
						onChange={e => setName(e.target.value.toLowerCase())}
						className='w-full text-xs border rounded px-2 py-1.5 bg-background'
					/>

					<button
						type='button'
						onClick={handleUpload}
						disabled={uploading || !name}
						className='w-full text-xs font-medium py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
					>
						{uploading ? 'Uploading...' : 'Upload'}
					</button>
				</div>
			)}

			{/* Icon grid */}
			{icons.length === 0 ?
				<p className='text-xs text-muted-foreground text-center py-4'>
					No custom icons yet
				</p>
			:	<>
					<p className='text-xs text-muted-foreground'>
						Your Icons ({icons.length})
					</p>
					<div className='grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1'>
						{icons.map(icon => (
							<div key={icon.id} className='relative group'>
								<IconCard name={icon.name} src={icon.url} onInsert={onInsert} />
								<button
									type='button'
									onClick={e => {
										e.stopPropagation()
										handleDelete(icon)
									}}
									className='absolute top-0 right-0 p-0.5 rounded bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity'
									title='Delete'
								>
									<Trash2 className='h-3 w-3' />
								</button>
							</div>
						))}
					</div>
				</>
			}
		</div>
	)
}
