'use client'

import { useEffect, useState, useCallback } from 'react'
import { Copy, Check, Link2, Loader2, Trash2 } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/toast'

interface ShareInfo {
	token: string
	expiresAt: string | null
}

type ExpiresIn = '1' | '7' | '30' | '90' | 'never'

const EXPIRY_OPTIONS: { value: ExpiresIn; label: string }[] = [
	{ value: 'never', label: 'Never' },
	{ value: '1', label: '1 day' },
	{ value: '7', label: '7 days' },
	{ value: '30', label: '30 days' },
	{ value: '90', label: '90 days' },
]

interface ShareDialogProps {
	resumeId: string
	open: boolean
	onClose: () => void
}

export function ShareDialog({ resumeId, open, onClose }: ShareDialogProps) {
	const { toast } = useToast()
	const [share, setShare] = useState<ShareInfo | null>(null)
	const [loading, setLoading] = useState(false)
	const [creating, setCreating] = useState(false)
	const [revoking, setRevoking] = useState(false)
	const [copied, setCopied] = useState(false)
	const [expiresIn, setExpiresIn] = useState<ExpiresIn>('never')

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/share`)
			if (res.ok) {
				setShare(await res.json())
			} else if (res.status === 404) {
				setShare(null)
			}
		} finally {
			setLoading(false)
		}
	}, [resumeId])

	useEffect(() => {
		if (open) load()
	}, [open, load])

	const shareUrl =
		share ?
			`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${share.token}`
		:	''

	async function handleCreate() {
		setCreating(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/share`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expiresIn }),
			})
			if (!res.ok) throw new Error()
			setShare(await res.json())
			toast({ title: 'Share link created' })
		} catch {
			toast({ title: 'Failed to create link', variant: 'destructive' })
		} finally {
			setCreating(false)
		}
	}

	async function handleRevoke() {
		setRevoking(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/share`, {
				method: 'DELETE',
			})
			if (!res.ok && res.status !== 204) throw new Error()
			setShare(null)
			toast({ title: 'Share link revoked' })
		} catch {
			toast({ title: 'Failed to revoke link', variant: 'destructive' })
		} finally {
			setRevoking(false)
		}
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			toast({ title: 'Could not copy to clipboard', variant: 'destructive' })
		}
	}

	return (
		<Dialog open={open} onOpenChange={v => !v && onClose()}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>Share Resume</DialogTitle>
					<DialogDescription>
						Anyone with this link can view your resume as a PDF.
					</DialogDescription>
				</DialogHeader>

				{loading ?
					<div className='flex items-center justify-center py-8 text-muted-foreground'>
						<Loader2 className='h-4 w-4 animate-spin' />
					</div>
				: share ?
					<div className='mt-2 space-y-4'>
						<div className='flex gap-2'>
							<Input
								readOnly
								value={shareUrl}
								className='text-xs font-mono'
								onFocus={e => e.target.select()}
							/>
							<Button
								variant='outline'
								size='sm'
								className='shrink-0'
								onClick={handleCopy}
							>
								{copied ?
									<Check className='h-4 w-4' />
								:	<Copy className='h-4 w-4' />}
							</Button>
						</div>

						{share.expiresAt && (
							<p className='text-xs text-muted-foreground'>
								Expires{' '}
								{new Date(share.expiresAt).toLocaleDateString(undefined, {
									dateStyle: 'medium',
								})}
							</p>
						)}

						<div className='flex items-center justify-between border-t pt-3'>
							<p className='text-xs text-muted-foreground'>
								Regenerate with new expiry
							</p>
							<div className='flex items-center gap-2'>
								<select
									aria-label='Link expiry'
									value={expiresIn}
									onChange={e => setExpiresIn(e.target.value as ExpiresIn)}
									className='text-xs rounded-md border border-input bg-background px-2 py-1 outline-none focus:ring-1 focus:ring-ring'
								>
									{EXPIRY_OPTIONS.map(o => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
								<Button
									variant='outline'
									size='sm'
									onClick={handleCreate}
									disabled={creating}
								>
									{creating ?
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
									:	<Link2 className='h-3.5 w-3.5' />}
									Regenerate
								</Button>
							</div>
						</div>

						<div className='flex justify-end border-t pt-3'>
							<Button
								variant='outline'
								size='sm'
								className='text-destructive hover:text-destructive hover:bg-destructive/10'
								onClick={handleRevoke}
								disabled={revoking}
							>
								{revoking ?
									<Loader2 className='h-3.5 w-3.5 animate-spin mr-1' />
								:	<Trash2 className='h-3.5 w-3.5 mr-1' />}
								Revoke link
							</Button>
						</div>
					</div>
				:	<div className='mt-4 space-y-4'>
						<div className='flex items-center gap-3'>
							<div className='flex-1'>
								<Label className='text-xs text-muted-foreground'>Expires</Label>
								<select
									aria-label='Link expiry'
									value={expiresIn}
									onChange={e => setExpiresIn(e.target.value as ExpiresIn)}
									className='mt-1 w-full text-sm rounded-md border border-input bg-background px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring'
								>
									{EXPIRY_OPTIONS.map(o => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</div>
							<Button
								className='mt-5'
								onClick={handleCreate}
								disabled={creating}
							>
								{creating ?
									<Loader2 className='h-4 w-4 animate-spin mr-2' />
								:	<Link2 className='h-4 w-4 mr-2' />}
								Create link
							</Button>
						</div>
					</div>
				}
			</DialogContent>
		</Dialog>
	)
}
