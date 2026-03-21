'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Github, Loader2, Check } from 'lucide-react'

interface Identity {
	provider: string
	id: string
	identityId: string
}

interface ProfilePanelProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialName: string
	initialEmail: string
	avatarUrl: string
}

function getInitials(name: string, email: string): string {
	if (name) {
		const parts = name.trim().split(/\s+/)
		return parts.length >= 2 ?
				(parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
			:	parts[0].slice(0, 2).toUpperCase()
	}
	return email.slice(0, 2).toUpperCase()
}

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox='0 0 24 24'>
			<path
				d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
				fill='#4285F4'
			/>
			<path
				d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
				fill='#34A853'
			/>
			<path
				d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
				fill='#FBBC05'
			/>
			<path
				d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
				fill='#EA4335'
			/>
		</svg>
	)
}

export function ProfilePanel({
	open,
	onOpenChange,
	initialName,
	initialEmail,
	avatarUrl,
}: ProfilePanelProps) {
	const [name, setName] = useState(initialName)
	const [nameSaving, setNameSaving] = useState(false)
	const [nameStatus, setNameStatus] = useState<'idle' | 'saved' | 'error'>(
		'idle',
	)

	const [newEmail, setNewEmail] = useState('')
	const [showEmailForm, setShowEmailForm] = useState(false)
	const [emailSaving, setEmailSaving] = useState(false)
	const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'error'>(
		'idle',
	)
	const [emailError, setEmailError] = useState('')

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordSaving, setPasswordSaving] = useState(false)
	const [passwordStatus, setPasswordStatus] = useState<
		'idle' | 'saved' | 'error'
	>('idle')
	const [passwordError, setPasswordError] = useState('')

	const [identities, setIdentities] = useState<Identity[]>([])
	const [hasEmailProvider, setHasEmailProvider] = useState(false)
	const [linkingProvider, setLinkingProvider] = useState<string | null>(null)
	const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

	// Profile links
	const [linkedinUrl, setLinkedinUrl] = useState('')
	const [githubUrl, setGithubUrl] = useState('')
	const [linksSaving, setLinksSaving] = useState(false)
	const [linksStatus, setLinksStatus] = useState<'idle' | 'saved' | 'error'>(
		'idle',
	)

	useEffect(() => {
		if (!open) return
		setName(initialName)
		setNameStatus('idle')
		setEmailStatus('idle')
		setPasswordStatus('idle')
		setPasswordError('')
		setLinksStatus('idle')
		fetch('/api/user/profile')
			.then(r => r.json())
			.then(data => {
				setIdentities(data.identities ?? [])
				setHasEmailProvider(
					data.identities?.some((i: Identity) => i.provider === 'email')
						?? false,
				)
			})
			.catch(() => {})
		fetch('/api/user/preferences')
			.then(r => (r.ok ? r.json() : null))
			.then(data => {
				if (data) {
					setLinkedinUrl(data.linkedinUrl ?? '')
					setGithubUrl(data.githubUrl ?? '')
				}
			})
			.catch(() => {})
	}, [open, initialName])

	async function saveName() {
		setNameSaving(true)
		const res = await fetch('/api/user/profile', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name }),
		})
		setNameSaving(false)
		setNameStatus(res.ok ? 'saved' : 'error')
		if (res.ok) setTimeout(() => setNameStatus('idle'), 2000)
	}

	async function handleChangeEmail(e: React.FormEvent) {
		e.preventDefault()
		setEmailSaving(true)
		setEmailError('')
		const res = await fetch('/api/user/email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: newEmail }),
		})
		setEmailSaving(false)
		if (res.ok) {
			setEmailStatus('sent')
			setNewEmail('')
		} else {
			const data = await res.json()
			setEmailError(data.error ?? 'Failed to update email')
			setEmailStatus('error')
		}
	}

	async function handleChangePassword(e: React.FormEvent) {
		e.preventDefault()
		setPasswordError('')
		if (newPassword !== confirmPassword) {
			setPasswordError('Passwords do not match')
			return
		}
		setPasswordSaving(true)
		const res = await fetch('/api/user/password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword, newPassword }),
		})
		setPasswordSaving(false)
		if (res.ok) {
			setPasswordStatus('saved')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			setTimeout(() => setPasswordStatus('idle'), 2000)
		} else {
			const data = await res.json()
			setPasswordError(data.error ?? 'Failed to update password')
			setPasswordStatus('error')
		}
	}

	async function saveLinks() {
		setLinksSaving(true)
		const res = await fetch('/api/user/preferences', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				linkedinUrl: linkedinUrl.trim() || null,
				githubUrl: githubUrl.trim() || null,
			}),
		})
		setLinksSaving(false)
		setLinksStatus(res.ok ? 'saved' : 'error')
		if (res.ok) setTimeout(() => setLinksStatus('idle'), 2000)
	}

	async function linkProvider(provider: 'google' | 'github') {
		setLinkingProvider(provider)
		const supabase = createClient()
		await supabase.auth.linkIdentity({
			provider,
			options: { redirectTo: `${window.location.origin}/auth/callback` },
		})
		// Redirect happens; state cleanup isn't strictly needed
		setLinkingProvider(null)
	}

	async function unlinkProvider(identity: Identity) {
		if (identities.length <= 1) return
		setUnlinkingId(identity.id)
		const supabase = createClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()
		const fullIdentity = user?.identities?.find(i => i.id === identity.id)
		if (fullIdentity) {
			const { error } = await supabase.auth.unlinkIdentity(fullIdentity)
			if (!error) {
				setIdentities(prev => prev.filter(i => i.id !== identity.id))
			}
		}
		setUnlinkingId(null)
	}

	const PROVIDERS = [
		{ key: 'google', label: 'Google', Icon: GoogleIcon },
		{ key: 'github', label: 'GitHub', Icon: Github },
	] as const

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Profile</DialogTitle>
				</DialogHeader>

				<div className='py-1 space-y-6'>
					{/* ── Account ── */}
					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Account
						</p>

						{/* Avatar + email */}
						<div className='flex items-center gap-3 mb-4'>
							<div className='w-12 h-12 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center overflow-hidden shrink-0'>
								{avatarUrl ?
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={avatarUrl}
										alt={initialName || initialEmail}
										className='w-full h-full object-cover'
									/>
								:	getInitials(initialName, initialEmail)}
							</div>
							<div className='min-w-0'>
								<p className='text-sm font-medium truncate'>{initialEmail}</p>
								<p className='text-xs text-muted-foreground'>
									Avatar synced from your OAuth provider
								</p>
							</div>
						</div>

						{/* Display name */}
						<div className='space-y-1.5 mb-4'>
							<Label htmlFor='profile-name' className='text-xs'>
								Display name
							</Label>
							<div className='flex gap-2'>
								<Input
									id='profile-name'
									value={name}
									onChange={e => setName(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && saveName()}
									placeholder='Your name'
									className='h-8 text-sm'
									maxLength={100}
								/>
								<Button
									size='sm'
									className='h-8 shrink-0'
									onClick={saveName}
									disabled={nameSaving || name.trim() === initialName}
								>
									{nameSaving ?
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
									: nameStatus === 'saved' ?
										<Check className='h-3.5 w-3.5' />
									:	'Save'}
								</Button>
							</div>
							{nameStatus === 'error' && (
								<p className='text-xs text-destructive'>Failed to save name</p>
							)}
						</div>

						{/* Change email */}
						{!showEmailForm ?
							<button
								className='text-xs text-muted-foreground hover:text-foreground underline decoration-dotted'
								onClick={() => setShowEmailForm(true)}
							>
								Change email address
							</button>
						:	<form onSubmit={handleChangeEmail} className='space-y-2'>
								<Label className='text-xs'>New email address</Label>
								<Input
									type='email'
									value={newEmail}
									onChange={e => setNewEmail(e.target.value)}
									placeholder='new@example.com'
									className='h-8 text-sm'
									required
									autoFocus
								/>
								{emailStatus === 'sent' && (
									<p className='text-xs text-green-600 dark:text-green-400'>
										Confirmation sent — check your inbox.
									</p>
								)}
								{emailStatus === 'error' && (
									<p className='text-xs text-destructive'>{emailError}</p>
								)}
								<div className='flex gap-2'>
									<Button
										type='submit'
										size='sm'
										className='h-8'
										disabled={emailSaving || !newEmail}
									>
										{emailSaving ?
											<Loader2 className='h-3.5 w-3.5 animate-spin' />
										:	'Send confirmation'}
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										className='h-8'
										onClick={() => {
											setShowEmailForm(false)
											setEmailStatus('idle')
											setNewEmail('')
										}}
									>
										Cancel
									</Button>
								</div>
							</form>
						}
					</section>

					<Separator />

					{/* ── Password ── */}
					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Password
						</p>
						{hasEmailProvider ?
							<form onSubmit={handleChangePassword} className='space-y-2'>
								<div className='space-y-1'>
									<Label htmlFor='current-pw' className='text-xs'>
										Current password
									</Label>
									<Input
										id='current-pw'
										type='password'
										value={currentPassword}
										onChange={e => setCurrentPassword(e.target.value)}
										className='h-8 text-sm'
										autoComplete='current-password'
										required
									/>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='new-pw' className='text-xs'>
										New password
									</Label>
									<Input
										id='new-pw'
										type='password'
										value={newPassword}
										onChange={e => setNewPassword(e.target.value)}
										className='h-8 text-sm'
										autoComplete='new-password'
										required
										minLength={8}
									/>
								</div>
								<div className='space-y-1'>
									<Label htmlFor='confirm-pw' className='text-xs'>
										Confirm new password
									</Label>
									<Input
										id='confirm-pw'
										type='password'
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										className='h-8 text-sm'
										autoComplete='new-password'
										required
									/>
								</div>
								{passwordStatus === 'saved' && (
									<p className='text-xs text-green-600 dark:text-green-400'>
										Password updated.
									</p>
								)}
								{passwordError && (
									<p className='text-xs text-destructive'>{passwordError}</p>
								)}
								<Button
									type='submit'
									size='sm'
									className='h-8'
									disabled={
										passwordSaving
										|| !currentPassword
										|| !newPassword
										|| !confirmPassword
									}
								>
									{passwordSaving ?
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
									:	'Update password'}
								</Button>
							</form>
						:	<p className='text-xs text-muted-foreground'>
								You&apos;re signed in with OAuth. No password is set for this
								account.
							</p>
						}
					</section>

					<Separator />

					{/* ── Profile Links ── */}
					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Profile Links
						</p>
						<p className='text-xs text-muted-foreground mb-3'>
							These are used to auto-fill links in your resume template.
						</p>
						<div className='space-y-3'>
							<div className='space-y-1.5'>
								<Label htmlFor='linkedin-url' className='text-xs'>
									LinkedIn URL
								</Label>
								<Input
									id='linkedin-url'
									value={linkedinUrl}
									onChange={e => setLinkedinUrl(e.target.value)}
									placeholder='https://linkedin.com/in/yourname'
									className='h-8 text-sm'
									maxLength={500}
									type='url'
								/>
							</div>
							<div className='space-y-1.5'>
								<Label htmlFor='github-url' className='text-xs'>
									GitHub URL
								</Label>
								<Input
									id='github-url'
									value={githubUrl}
									onChange={e => setGithubUrl(e.target.value)}
									placeholder='https://github.com/yourname'
									className='h-8 text-sm'
									maxLength={500}
									type='url'
								/>
							</div>
							{linksStatus === 'saved' && (
								<p className='text-xs text-green-600 dark:text-green-400'>
									Links saved.
								</p>
							)}
							{linksStatus === 'error' && (
								<p className='text-xs text-destructive'>
									Failed to save links.
								</p>
							)}
							<Button
								size='sm'
								className='h-8'
								onClick={saveLinks}
								disabled={linksSaving}
							>
								{linksSaving ?
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								: linksStatus === 'saved' ?
									<Check className='h-3.5 w-3.5' />
								:	'Save links'}
							</Button>
						</div>
					</section>

					<Separator />

					{/* ── Connected accounts ── */}
					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Connected accounts
						</p>
						<div className='space-y-2'>
							{PROVIDERS.map(({ key, label, Icon }) => {
								const identity = identities.find(i => i.provider === key)
								const isLinked = !!identity
								const isOnlyOne = identities.length === 1 && isLinked
								return (
									<div key={key} className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<Icon className='h-4 w-4 shrink-0' />
											<span className='text-sm'>{label}</span>
											{isLinked && (
												<span className='text-xs text-green-600 dark:text-green-400'>
													Connected
												</span>
											)}
										</div>
										{isLinked ?
											<Button
												variant='outline'
												size='sm'
												className='h-7 text-xs'
												onClick={() => identity && unlinkProvider(identity)}
												disabled={isOnlyOne || unlinkingId === identity?.id}
												title={
													isOnlyOne ?
														"Can't disconnect your only sign-in method"
													:	undefined
												}
											>
												{unlinkingId === identity?.id ?
													<Loader2 className='h-3.5 w-3.5 animate-spin' />
												:	'Disconnect'}
											</Button>
										:	<Button
												variant='outline'
												size='sm'
												className='h-7 text-xs'
												onClick={() => linkProvider(key as 'google' | 'github')}
												disabled={!!linkingProvider}
											>
												{linkingProvider === key ?
													<Loader2 className='h-3.5 w-3.5 animate-spin' />
												:	'Connect'}
											</Button>
										}
									</div>
								)
							})}
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	)
}
