'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, RotateCcw, Loader2, Clock } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast'

interface Snapshot {
	id: string
	label: string | null
	createdAt: string
}

interface VersionHistoryDialogProps {
	resumeId: string
	open: boolean
	onClose: () => void
	onRestore: (markdown: string) => void
}

function relativeTime(date: string): string {
	const ms = Date.now() - new Date(date).getTime()
	const sec = Math.floor(ms / 1000)
	const min = Math.floor(sec / 60)
	const hr = Math.floor(min / 60)
	const day = Math.floor(hr / 24)
	if (day > 0) return `${day}d ago`
	if (hr > 0) return `${hr}h ago`
	if (min > 0) return `${min}m ago`
	return 'just now'
}

export function VersionHistoryDialog({
	resumeId,
	open,
	onClose,
	onRestore,
}: VersionHistoryDialogProps) {
	const { toast } = useToast()
	const [snapshots, setSnapshots] = useState<Snapshot[]>([])
	const [loading, setLoading] = useState(false)
	const [restoringId, setRestoringId] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/snapshots`)
			if (res.ok) {
				const data = await res.json()
				setSnapshots(data)
			}
		} finally {
			setLoading(false)
		}
	}, [resumeId])

	useEffect(() => {
		if (open) load()
	}, [open, load])

	async function handleRestore(snapshot: Snapshot) {
		setRestoringId(snapshot.id)
		try {
			const res = await fetch(
				`/api/resume/${resumeId}/snapshots/${snapshot.id}`,
				{ method: 'POST' },
			)
			if (!res.ok) throw new Error()
			const { markdown } = await res.json()
			onRestore(markdown)
			onClose()
			toast({ title: 'Restored to earlier version' })
		} catch {
			toast({
				title: 'Restore failed',
				variant: 'destructive',
			})
		} finally {
			setRestoringId(null)
		}
	}

	async function handleDelete(snapshot: Snapshot) {
		setDeletingId(snapshot.id)
		try {
			const res = await fetch(
				`/api/resume/${resumeId}/snapshots/${snapshot.id}`,
				{ method: 'DELETE' },
			)
			if (!res.ok) throw new Error()
			setSnapshots(prev => prev.filter(s => s.id !== snapshot.id))
			toast({ title: 'Snapshot deleted' })
		} catch {
			toast({
				title: 'Delete failed',
				variant: 'destructive',
			})
		} finally {
			setDeletingId(null)
		}
	}

	return (
		<Dialog open={open} onOpenChange={v => !v && onClose()}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>Version History</DialogTitle>
					<DialogDescription>
						Snapshots are created automatically after each compile. Last 50
						snapshots are kept.
					</DialogDescription>
				</DialogHeader>

				<div className='mt-2 max-h-96 overflow-y-auto space-y-1'>
					{loading ?
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							<Loader2 className='h-4 w-4 animate-spin' />
						</div>
					: snapshots.length === 0 ?
						<div className='flex flex-col items-center gap-1 py-8 text-center text-muted-foreground'>
							<Clock className='h-8 w-8 opacity-40' />
							<p className='text-sm'>No snapshots yet.</p>
							<p className='text-xs'>Compile to create your first snapshot.</p>
						</div>
					:	snapshots.map(snapshot => (
							<div
								key={snapshot.id}
								className='flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60'
							>
								<div className='flex-1 min-w-0'>
									<p className='text-sm truncate'>
										{snapshot.label ?? 'Auto-snapshot'}
									</p>
									<p className='text-xs text-muted-foreground'>
										{relativeTime(snapshot.createdAt)}
									</p>
								</div>
								<Button
									variant='ghost'
									size='sm'
									className='shrink-0 h-7 px-2 text-xs'
									disabled={
										restoringId === snapshot.id || deletingId === snapshot.id
									}
									onClick={() => handleRestore(snapshot)}
								>
									{restoringId === snapshot.id ?
										<Loader2 className='h-3 w-3 animate-spin' />
									:	<RotateCcw className='h-3 w-3' />}
									<span className='ml-1'>Restore</span>
								</Button>
								<Button
									variant='ghost'
									size='sm'
									className='shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
									disabled={
										deletingId === snapshot.id || restoringId === snapshot.id
									}
									onClick={() => handleDelete(snapshot)}
								>
									{deletingId === snapshot.id ?
										<Loader2 className='h-3 w-3 animate-spin' />
									:	<Trash2 className='h-3 w-3' />}
								</Button>
							</div>
						))
					}
				</div>
			</DialogContent>
		</Dialog>
	)
}
