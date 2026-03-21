'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
	MoreHorizontal,
	Pencil,
	Trash2,
	Copy,
	Tag,
	FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast'
import { TagEditor } from '@/components/dashboard/tag-editor'

export type ResumeRow = {
	id: string
	title: string
	tags: string[]
	thumbnailUrl: string | null
	createdAt: Date
	updatedAt: Date
}

function formatDate(d: Date) {
	return new Date(d).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

export function ResumeCard({ resume }: { resume: ResumeRow }) {
	const router = useRouter()
	const { toast } = useToast()

	// Delete state
	const [deleting, setDeleting] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)

	// Clone state
	const [cloning, setCloning] = useState(false)

	// Rename state
	const [renaming, setRenaming] = useState(false)
	const [renameValue, setRenameValue] = useState(resume.title)
	const renameInputRef = useRef<HTMLInputElement>(null)

	// Tag editor state
	const [tagEditorOpen, setTagEditorOpen] = useState(false)

	async function handleDelete() {
		setDeleting(true)
		const res = await fetch(`/api/resume/${resume.id}`, { method: 'DELETE' })
		if (res.ok) {
			toast({ title: 'Resume deleted' })
			router.refresh()
		} else {
			toast({ title: 'Failed to delete', variant: 'destructive' })
			setDeleting(false)
		}
		setConfirmOpen(false)
	}

	async function handleClone() {
		setCloning(true)
		try {
			const getRes = await fetch(`/api/resume/${resume.id}`)
			if (!getRes.ok) throw new Error()
			const data = await getRes.json()
			const postRes = await fetch('/api/resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: `Copy of ${resume.title}`,
					markdown: data.markdown,
				}),
			})
			if (!postRes.ok) throw new Error()
			toast({ title: 'Resume duplicated' })
			router.refresh()
		} catch {
			toast({ title: 'Failed to duplicate', variant: 'destructive' })
		} finally {
			setCloning(false)
		}
	}

	function startRename() {
		setRenameValue(resume.title)
		setRenaming(true)
		// Focus after state update
		setTimeout(() => renameInputRef.current?.select(), 0)
	}

	async function saveRename() {
		const trimmed = renameValue.trim().slice(0, 200)
		if (!trimmed || trimmed === resume.title) {
			setRenaming(false)
			return
		}
		const res = await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: trimmed }),
		})
		if (res.ok) {
			router.refresh()
		} else {
			toast({ title: 'Failed to rename', variant: 'destructive' })
		}
		setRenaming(false)
	}

	async function handleTagSave(tags: string[]) {
		const res = await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ tags }),
		})
		if (res.ok) {
			router.refresh()
		} else {
			toast({ title: 'Failed to save tags', variant: 'destructive' })
		}
		setTagEditorOpen(false)
	}

	const visibleTags = (resume.tags ?? []).slice(0, 3)

	return (
		<>
			<div
				className='group relative border rounded-lg overflow-hidden bg-card hover:border-foreground/30 transition-colors cursor-pointer flex flex-col'
				onClick={() => !renaming && router.push(`/resume/${resume.id}`)}
				role='button'
				tabIndex={0}
				onKeyDown={e =>
					e.key === 'Enter' && !renaming && router.push(`/resume/${resume.id}`)
				}
			>
				{/* Prevent card click from propagating when using the menu */}
				<div
					className='absolute top-3 right-3'
					onClick={e => e.stopPropagation()}
					onKeyDown={e => e.stopPropagation()}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								size='icon'
								className='h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity'
								aria-label='Resume actions'
								disabled={cloning}
							>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => router.push(`/resume/${resume.id}`)}
							>
								<Pencil className='mr-2 h-4 w-4' />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem onClick={startRename}>
								<Pencil className='mr-2 h-4 w-4' />
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleClone} disabled={cloning}>
								<Copy className='mr-2 h-4 w-4' />
								{cloning ? 'Duplicating…' : 'Duplicate'}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setTagEditorOpen(true)}>
								<Tag className='mr-2 h-4 w-4' />
								Edit Tags
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className='text-destructive focus:text-destructive'
								onClick={() => setConfirmOpen(true)}
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Thumbnail — screenshot of the first page, generated server-side on each compile */}
				<div className='w-full h-[180px] bg-muted overflow-hidden flex items-center justify-center'>
					{resume.thumbnailUrl ?
						<img
							src={resume.thumbnailUrl}
							alt={`Preview of ${resume.title}`}
							className='w-full object-cover object-top'
						/>
					:	<FileText className='h-10 w-10 text-muted-foreground/40' />}
				</div>

				<div
					className='p-4 flex flex-col gap-1 min-w-0'
					onClick={e => renaming && e.stopPropagation()}
				>
					{renaming ?
						<Input
							ref={renameInputRef}
							className='h-7 text-sm font-medium px-1.5 py-0'
							value={renameValue}
							onChange={e => setRenameValue(e.target.value)}
							onBlur={saveRename}
							onKeyDown={e => {
								if (e.key === 'Enter') saveRename()
								if (e.key === 'Escape') setRenaming(false)
							}}
							maxLength={200}
							autoFocus
						/>
					:	<p className='font-medium text-sm truncate'>{resume.title}</p>}
					<p className='text-xs text-muted-foreground mt-0.5'>
						Updated {formatDate(resume.updatedAt)}
					</p>
					{visibleTags.length > 0 && (
						<div className='flex flex-wrap gap-1 mt-1.5'>
							{visibleTags.map(tag => (
								<span
									key={tag}
									className='inline-block px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground'
								>
									{tag}
								</span>
							))}
							{(resume.tags ?? []).length > 3 && (
								<span className='inline-block px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground'>
									+{(resume.tags ?? []).length - 3}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Delete confirmation dialog */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete &ldquo;{resume.title}&rdquo;?</DialogTitle>
						<DialogDescription>This action cannot be undone.</DialogDescription>
					</DialogHeader>
					<div className='flex justify-end gap-2 mt-2'>
						<Button variant='outline' onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={handleDelete}
							disabled={deleting}
						>
							{deleting ? 'Deleting…' : 'Delete'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Tag editor dialog */}
			<TagEditor
				open={tagEditorOpen}
				onOpenChange={setTagEditorOpen}
				initialTags={resume.tags ?? []}
				onSave={handleTagSave}
			/>
		</>
	)
}
