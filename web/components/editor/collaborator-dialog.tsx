'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Trash2, Users } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/toast'

type CollaboratorRole = 'viewer' | 'commenter' | 'editor'

interface CollaboratorRow {
	id: string
	email: string
	displayName: string | null
	avatarUrl: string | null
	role: CollaboratorRole
	acceptedAt: string | null
	createdAt: string
}

interface CollaboratorDialogProps {
	resumeId: string
	open: boolean
	onClose: () => void
	ownerEmail: string
	ownerName: string
	ownerAvatarUrl: string
	currentRole: 'owner' | CollaboratorRole
	canManage: boolean
}

const ROLE_OPTIONS: CollaboratorRole[] = ['viewer', 'commenter', 'editor']

function Avatar({
	name,
	avatarUrl,
}: {
	name: string
	avatarUrl: string | null
}) {
	const initials = useMemo(() => {
		const parts = name.trim().split(/\s+/).filter(Boolean)
		return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')
	}, [name])

	if (avatarUrl) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt=''
				className='h-9 w-9 rounded-full object-cover'
			/>
		)
	}

	return (
		<div className='flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground'>
			{initials.toUpperCase()}
		</div>
	)
}

export function CollaboratorDialog({
	resumeId,
	open,
	onClose,
	ownerEmail,
	ownerName,
	ownerAvatarUrl,
	currentRole,
	canManage,
}: CollaboratorDialogProps) {
	const { toast } = useToast()
	const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([])
	const [loading, setLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [role, setRole] = useState<CollaboratorRole>('viewer')
	const [saving, setSaving] = useState(false)
	const [busyId, setBusyId] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/collaborators`)
			if (!res.ok) throw new Error()
			const data = await res.json()
			setCollaborators(data.collaborators ?? [])
		} catch {
			toast({
				title: 'Could not load collaborators',
				variant: 'destructive',
			})
		} finally {
			setLoading(false)
		}
	}, [resumeId, toast])

	useEffect(() => {
		if (open) load()
	}, [open, load])

	async function handleInvite() {
		setSaving(true)
		try {
			const res = await fetch(`/api/resume/${resumeId}/collaborators`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, role }),
			})

			const data = await res.json().catch(() => null)
			if (!res.ok) {
				throw new Error(data?.error ?? 'Could not add collaborator')
			}

			setCollaborators(prev => {
				const next = prev.filter(item => item.id !== data.id)
				next.push(data)
				return next.sort(
					(a, b) =>
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				)
			})
			setEmail('')
			setRole('viewer')
			toast({ title: 'Collaborator saved' })
		} catch (error) {
			toast({
				title:
					error instanceof Error ?
						error.message
					:	'Could not save collaborator',
				variant: 'destructive',
			})
		} finally {
			setSaving(false)
		}
	}

	async function handleRoleChange(id: string, nextRole: CollaboratorRole) {
		setBusyId(id)
		try {
			const res = await fetch(`/api/resume/${resumeId}/collaborators/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: nextRole }),
			})
			const data = await res.json().catch(() => null)
			if (!res.ok) throw new Error(data?.error ?? 'Could not update role')

			setCollaborators(prev =>
				prev.map(item => (item.id === id ? { ...item, role: nextRole } : item)),
			)
			toast({ title: 'Role updated' })
		} catch (error) {
			toast({
				title: error instanceof Error ? error.message : 'Could not update role',
				variant: 'destructive',
			})
		} finally {
			setBusyId(null)
		}
	}

	async function handleRemove(id: string) {
		setBusyId(id)
		try {
			const res = await fetch(`/api/resume/${resumeId}/collaborators/${id}`, {
				method: 'DELETE',
			})
			if (!res.ok) throw new Error('Could not remove collaborator')
			setCollaborators(prev => prev.filter(item => item.id !== id))
			toast({ title: 'Collaborator removed' })
		} catch (error) {
			toast({
				title:
					error instanceof Error ?
						error.message
					:	'Could not remove collaborator',
				variant: 'destructive',
			})
		} finally {
			setBusyId(null)
		}
	}

	return (
		<Dialog open={open} onOpenChange={value => !value && onClose()}>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Users className='h-4 w-4' />
						Collaborators
					</DialogTitle>
					<DialogDescription>
						Invite signed-in collaborators with viewer, commenter, or editor
						access. Commenter review mode is the next slice, so commenters are
						currently read-only.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='rounded-lg border bg-muted/30 p-3'>
						<div className='flex items-center gap-3'>
							<Avatar
								name={ownerName || ownerEmail}
								avatarUrl={ownerAvatarUrl || null}
							/>
							<div className='min-w-0'>
								<p className='truncate text-sm font-medium'>
									{ownerName || ownerEmail}
								</p>
								<p className='truncate text-xs text-muted-foreground'>
									{ownerEmail}
								</p>
							</div>
							<span className='ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary'>
								Owner
							</span>
						</div>
					</div>

					{canManage && (
						<div className='grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_140px_auto]'>
							<div className='space-y-1'>
								<Label htmlFor='collaborator-email'>Invite by email</Label>
								<Input
									id='collaborator-email'
									type='email'
									placeholder='name@example.com'
									value={email}
									onChange={e => setEmail(e.target.value)}
								/>
							</div>
							<div className='space-y-1'>
								<Label htmlFor='collaborator-role'>Role</Label>
								<select
									id='collaborator-role'
									aria-label='Collaborator role'
									value={role}
									onChange={e => setRole(e.target.value as CollaboratorRole)}
									className='h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring'
								>
									{ROLE_OPTIONS.map(option => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</div>
							<Button
								className='self-end'
								onClick={handleInvite}
								disabled={!email.trim() || saving}
							>
								{saving ?
									<Loader2 className='h-4 w-4 animate-spin' />
								:	'Invite'}
							</Button>
						</div>
					)}

					<div className='rounded-lg border'>
						<div className='border-b px-4 py-3'>
							<p className='text-sm font-medium'>Shared with</p>
							<p className='text-xs text-muted-foreground'>
								Your current access: {currentRole}
							</p>
						</div>
						<div className='max-h-[320px] overflow-y-auto'>
							{loading ?
								<div className='flex items-center justify-center py-10 text-muted-foreground'>
									<Loader2 className='h-4 w-4 animate-spin' />
								</div>
							: collaborators.length === 0 ?
								<div className='px-4 py-10 text-center text-sm text-muted-foreground'>
									No collaborators yet.
								</div>
							:	collaborators.map(item => {
									const displayName = item.displayName || item.email
									return (
										<div
											key={item.id}
											className='flex items-center gap-3 border-b px-4 py-3 last:border-b-0'
										>
											<Avatar name={displayName} avatarUrl={item.avatarUrl} />
											<div className='min-w-0 flex-1'>
												<p className='truncate text-sm font-medium'>
													{displayName}
												</p>
												<p className='truncate text-xs text-muted-foreground'>
													{item.email}
												</p>
												<p className='mt-1 text-xs text-muted-foreground'>
													{item.acceptedAt ? 'Accepted' : 'Pending acceptance'}
												</p>
											</div>
											{canManage ?
												<div className='flex items-center gap-2'>
													<select
														aria-label={`Role for ${displayName}`}
														value={item.role}
														onChange={e =>
															handleRoleChange(
																item.id,
																e.target.value as CollaboratorRole,
															)
														}
														disabled={busyId === item.id}
														className='h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring'
													>
														{ROLE_OPTIONS.map(option => (
															<option key={option} value={option}>
																{option}
															</option>
														))}
													</select>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleRemove(item.id)}
														disabled={busyId === item.id}
														className='text-muted-foreground hover:text-destructive'
													>
														{busyId === item.id ?
															<Loader2 className='h-3.5 w-3.5 animate-spin' />
														:	<Trash2 className='h-3.5 w-3.5' />}
													</Button>
												</div>
											:	<span className='rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground'>
													{item.role}
												</span>
											}
										</div>
									)
								})
							}
						</div>
					</div>

					<div className='rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground'>
						<div className='flex items-start gap-2'>
							<Check className='mt-0.5 h-3.5 w-3.5 text-primary' />
							<p>
								Viewers can inspect markdown and preview. Editors can update the
								resume. Commenter suggestion mode and live presence arrive in
								the next implementation slice.
							</p>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
