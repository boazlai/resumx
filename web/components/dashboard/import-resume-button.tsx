'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/toast'

const MAX_BINARY_BYTES = 5 * 1024 * 1024 // PDF / DOCX: 5 MB
const MAX_TEXT_BYTES = 500 * 1024 // MD / TXT: 500 KB

export function ImportResumeButton() {
	const router = useRouter()
	const { toast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [title, setTitle] = useState('')
	const [file, setFile] = useState<File | null>(null)
	const [dragging, setDragging] = useState(false)

	function handleClose(nextOpen: boolean) {
		if (!nextOpen) {
			setTitle('')
			setFile(null)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
		setOpen(nextOpen)
	}

	function validateAndSetFile(f: File) {
		const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
		const isBinary = ext === 'pdf' || ext === 'docx'
		const isText = ext === 'md' || ext === 'txt'
		if (!isBinary && !isText) {
			toast({
				title: 'Unsupported file type',
				description: 'Upload a PDF, DOCX, .md, or .txt file.',
				variant: 'destructive',
			})
			return
		}
		const maxBytes = isBinary ? MAX_BINARY_BYTES : MAX_TEXT_BYTES
		const maxLabel = isBinary ? '5 MB' : '500 KB'
		if (f.size > maxBytes) {
			toast({
				title: `File too large (${maxLabel} max)`,
				variant: 'destructive',
			})
			return
		}
		setFile(f)
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0]
		if (f) validateAndSetFile(f)
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault()
		setDragging(false)
		const f = e.dataTransfer.files[0]
		if (f) validateAndSetFile(f)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!file) {
			toast({ title: 'Please select a file', variant: 'destructive' })
			return
		}
		setLoading(true)

		try {
			const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
			const isBinary = ext === 'pdf' || ext === 'docx'
			let markdown: string

			if (isBinary) {
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader()
					reader.onload = () => resolve((reader.result as string).split(',')[1])
					reader.onerror = reject
					reader.readAsDataURL(file)
				})

				const importRes = await fetch('/api/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ file: base64, filename: file.name }),
				})

				if (!importRes.ok) {
					const err = (await importRes.json().catch(() => ({}))) as {
						error?: string
					}
					toast({
						title: err.error ?? 'Import failed',
						variant: 'destructive',
					})
					setLoading(false)
					return
				}

				;({ markdown } = (await importRes.json()) as { markdown: string })
			} else {
				markdown = await file.text()
			}

			const resolvedTitle =
				title.trim() || file.name.replace(/\.(pdf|docx|md|txt)$/i, '')

			const resumeRes = await fetch('/api/resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: resolvedTitle, markdown }),
			})

			if (!resumeRes.ok) {
				toast({ title: 'Failed to save resume', variant: 'destructive' })
				setLoading(false)
				return
			}

			const { id } = (await resumeRes.json()) as { id: string }
			handleClose(false)
			router.push(`/resume/${id}`)
		} catch {
			toast({ title: 'Something went wrong', variant: 'destructive' })
			setLoading(false)
		}
	}

	const ext = file?.name.split('.').pop()?.toLowerCase() ?? ''
	const needsAI = ext === 'pdf' || ext === 'docx'

	return (
		<>
			<Button variant='outline' onClick={() => setOpen(true)}>
				<Upload className='h-4 w-4' />
				Import Resume
			</Button>

			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Import Resume</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='space-y-4 pt-1'>
						<div className='space-y-1.5'>
							<Label htmlFor='import-title'>
								Title{' '}
								<span className='text-muted-foreground font-normal'>
									(optional)
								</span>
							</Label>
							<Input
								id='import-title'
								placeholder='e.g. Software Engineer — Google'
								value={title}
								onChange={e => setTitle(e.target.value)}
								autoFocus
							/>
						</div>

						<div
							className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
								dragging ?
									'border-primary bg-primary/5'
								:	'border-muted-foreground/25 hover:border-muted-foreground/50'
							}`}
							onClick={() => fileInputRef.current?.click()}
							onDragOver={e => {
								e.preventDefault()
								setDragging(true)
							}}
							onDragLeave={() => setDragging(false)}
							onDrop={handleDrop}
						>
							{file ?
								<div className='space-y-1'>
									<p className='text-sm font-medium'>{file.name}</p>
									<p className='text-xs text-muted-foreground'>
										{(file.size / 1024).toFixed(0)} KB
										{needsAI && ' · AI will convert this'}
									</p>
									<button
										type='button'
										onClick={e => {
											e.stopPropagation()
											setFile(null)
											if (fileInputRef.current) fileInputRef.current.value = ''
										}}
										className='text-xs text-muted-foreground hover:text-foreground underline mt-1'
									>
										Remove
									</button>
								</div>
							:	<div className='space-y-2'>
									<Upload className='h-8 w-8 mx-auto text-muted-foreground/50' />
									<p className='text-sm text-muted-foreground'>
										Drop a file here or{' '}
										<span className='text-foreground underline'>browse</span>
									</p>
									<p className='text-xs text-muted-foreground'>
										PDF, DOCX, MD, TXT
									</p>
								</div>
							}
						</div>

						<input
							ref={fileInputRef}
							type='file'
							accept='.pdf,.docx,.md,.txt'
							aria-label='Upload resume file'
							className='hidden'
							onChange={handleFileChange}
						/>

						<div className='flex justify-end gap-2 pt-1'>
							<Button
								type='button'
								variant='ghost'
								onClick={() => handleClose(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={loading || !file}>
								{loading ?
									needsAI ?
										'Converting…'
									:	'Importing…'
								: needsAI ?
									'Convert with AI'
								:	'Import'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
