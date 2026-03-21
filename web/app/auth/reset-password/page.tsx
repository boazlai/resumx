'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [sessionReady, setSessionReady] = useState(false)

	useEffect(() => {
		// Supabase embeds token_hash (PKCE) in the URL fragment via the email link.
		// The SSR middleware exchangeCodeForSession handles this automatically when
		// the user lands here. We just need to confirm a session exists.
		const supabase = createClient()
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session) {
				setSessionReady(true)
			} else {
				setError('Invalid or expired reset link. Please request a new one.')
			}
		})
	}, [searchParams])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		if (password !== confirm) {
			setError('Passwords do not match')
			return
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters')
			return
		}
		setLoading(true)
		const supabase = createClient()
		const { error } = await supabase.auth.updateUser({ password })
		setLoading(false)
		if (error) {
			setError(error.message)
		} else {
			router.push('/dashboard')
		}
	}

	if (!sessionReady && !error) {
		return (
			<p className='text-sm text-muted-foreground text-center'>
				Verifying link…
			</p>
		)
	}

	if (error && !sessionReady) {
		return (
			<div className='space-y-4'>
				<p className='text-sm text-destructive text-center'>{error}</p>
				<Button
					variant='outline'
					className='w-full'
					onClick={() => router.push('/forgot-password')}
				>
					Request new link
				</Button>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<div className='space-y-2'>
				<Label htmlFor='password'>New password</Label>
				<Input
					id='password'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					minLength={8}
					autoComplete='new-password'
					autoFocus
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='confirm'>Confirm password</Label>
				<Input
					id='confirm'
					type='password'
					value={confirm}
					onChange={e => setConfirm(e.target.value)}
					required
					autoComplete='new-password'
				/>
			</div>

			{error && <p className='text-sm text-destructive'>{error}</p>}

			<Button type='submit' className='w-full' disabled={loading}>
				{loading ? 'Updating…' : 'Set new password'}
			</Button>
		</form>
	)
}

export default function ResetPasswordPage() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background px-4'>
			<div className='w-full max-w-sm space-y-6'>
				<div className='text-center space-y-2'>
					<div className='text-2xl font-bold tracking-tight'>
						Set new password
					</div>
					<p className='text-sm text-muted-foreground'>
						Choose a strong password for your account.
					</p>
				</div>
				<Suspense fallback={null}>
					<ResetPasswordForm />
				</Suspense>
			</div>
		</div>
	)
}
