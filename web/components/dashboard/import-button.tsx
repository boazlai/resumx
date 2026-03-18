'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/lib/toast'

const ALLOWED_EXTENSIONS = ['md', 'txt']
const MAX_SIZE_BYTES = 500 * 1024 // 500 KB

export function ImportButton() {
	const router = useRouter()
	const { toast } = useToast()
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [dragOver, setDragOver] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	async function processFile(file: File) {
		const ext = file.name.split('.').pop()?.toLowerCase()
		if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
			toast({
				title: 'Unsupported file type',
				description: 'Please upload a .md or .txt file.',
				variant: 'destructive',
			})
			return
		}
		if (file.size > MAX_SIZE_BYTES) {
			toast({ title: 'File too large (500 KB max)', variant: 'destructive' })
			return
		}

		setLoading(true)
		const markdown = await file.text()
		const title = file.name.replace(/\.(md|txt)$/i, '')

		const res = await fetch('/api/resume', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, markdown }),
		})

		if (!res.ok) {
			toast({ title: 'Failed to import', variant: 'destructive' })
			setLoading(false)
			return
		}

		const data = await res.json()
		setOpen(false)
		router.push(`/resume/${data.id}`)
	}

	function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return
		processFile(files[0])
	}

	return (
		<>
			<Button variant='outline' onClick={() => setOpen(true)}>
				<Upload className='h-4 w-4' />
				Import
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import Resume</DialogTitle>
						<DialogDescription>
							Upload a Markdown (.md) or plain text (.txt) file.
						</DialogDescription>
					</DialogHeader>

					<div
						className={`mt-2 border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/40'}`}
						onDragOver={e => {
							e.preventDefault()
							setDragOver(true)
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={e => {
							e.preventDefault()
							setDragOver(false)
							handleFiles(e.dataTransfer.files)
						}}
						onClick={() => inputRef.current?.click()}
					>
						<Upload className='mx-auto h-8 w-8 text-muted-foreground mb-3' />
						<p className='text-sm text-muted-foreground'>
							{loading ? 'Importing…' : 'Drag & drop or click to select a file'}
						</p>
						<p className='text-xs text-muted-foreground mt-1'>
							.md or .txt, up to 500 KB
						</p>
					</div>

					<input
						ref={inputRef}
						type='file'
						aria-label='Select a resume file to import'
						className='hidden'
						accept='.md,.txt,text/markdown,text/plain'
						onChange={e => handleFiles(e.target.files)}
					/>
				</DialogContent>
			</Dialog>
		</>
	)
}
