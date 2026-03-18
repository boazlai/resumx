'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { useToast } from '@/lib/toast'

type ResumeRow = {
	id: string
	title: string
	createdAt: Date
	updatedAt: Date
}

function formatDate(d: Date) {
	return new Date(d).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

export function ResumeCard({ resume }: { resume: ResumeRow }) {
	const router = useRouter()
	const { toast } = useToast()
	const [deleting, setDeleting] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)

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

	return (
		<>
			<div
				className='group relative border rounded-lg p-5 bg-card hover:border-foreground/30 transition-colors cursor-pointer flex flex-col gap-3'
				onClick={() => router.push(`/resume/${resume.id}`)}
				role='button'
				tabIndex={0}
				onKeyDown={e =>
					e.key === 'Enter' && router.push(`/resume/${resume.id}`)
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

				{/* favicon-style doc icon */}
				<div className='flex-shrink-0 w-10 h-12 rounded border bg-muted flex items-center justify-center text-muted-foreground text-xs font-mono'>
					.md
				</div>

				<div className='min-w-0'>
					<p className='font-medium text-sm truncate'>{resume.title}</p>
					<p className='text-xs text-muted-foreground mt-0.5'>
						Updated {formatDate(resume.updatedAt)}
					</p>
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
		</>
	)
}
