'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	async function handleSignUp(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		if (password.length < 8) {
			setError('Password must be at least 8 characters.')
			setLoading(false)
			return
		}

		const supabase = createClient()
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		})

		if (error) {
			setError(error.message)
			setLoading(false)
			return
		}

		setSuccess(true)
		setLoading(false)
	}

	async function handleGoogleSignIn() {
		setLoading(true)
		const supabase = createClient()
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		})
		if (error) {
			setError(error.message)
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-background px-4'>
				<div className='w-full max-w-sm text-center space-y-4'>
					<div className='text-2xl font-bold'>Check your email</div>
					<p className='text-sm text-muted-foreground'>
						We&apos;ve sent a confirmation link to <strong>{email}</strong>.
						Click it to activate your account.
					</p>
					<Link
						href='/sign-in'
						className='text-sm underline hover:text-foreground'
					>
						Back to sign in
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background px-4'>
			<div className='w-full max-w-sm space-y-6'>
				<div className='text-center space-y-2'>
					<div className='text-2xl font-bold tracking-tight'>
						Create an account
					</div>
					<p className='text-sm text-muted-foreground'>
						Start building a better resume today
					</p>
				</div>

				<Button
					type='button'
					variant='outline'
					className='w-full'
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					<svg className='w-4 h-4' viewBox='0 0 24 24'>
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
					Continue with Google
				</Button>

				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<span className='w-full border-t' />
					</div>
					<div className='relative flex justify-center text-xs uppercase'>
						<span className='bg-background px-2 text-muted-foreground'>Or</span>
					</div>
				</div>

				<form onSubmit={handleSignUp} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='email'>Email</Label>
						<Input
							id='email'
							type='email'
							placeholder='you@example.com'
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='password'>Password</Label>
						<Input
							id='password'
							type='password'
							placeholder='Min. 8 characters'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && <p className='text-sm text-destructive'>{error}</p>}

					<Button type='submit' className='w-full' disabled={loading}>
						{loading ? 'Creating account…' : 'Create account'}
					</Button>
				</form>

				<p className='text-center text-sm text-muted-foreground'>
					Already have an account?{' '}
					<Link href='/sign-in' className='underline hover:text-foreground'>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	)
}
