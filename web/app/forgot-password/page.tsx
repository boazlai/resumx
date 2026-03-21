'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('')
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		const res = await fetch('/api/auth/forgot-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		})

		setLoading(false)
		if (!res.ok) {
			setError('Something went wrong. Please try again.')
		} else {
			setSent(true)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-background px-4'>
			<div className='w-full max-w-sm space-y-6'>
				<div className='text-center space-y-2'>
					<div className='text-2xl font-bold tracking-tight'>
						Forgot password
					</div>
					<p className='text-sm text-muted-foreground'>
						Enter your email and we&apos;ll send you a reset link.
					</p>
				</div>

				{sent ?
					<div className='rounded-lg border bg-muted/40 p-4 text-sm text-center space-y-1'>
						<p className='font-medium'>Check your inbox</p>
						<p className='text-muted-foreground'>
							A reset link was sent to{' '}
							<span className='font-medium'>{email}</span>.
						</p>
					</div>
				:	<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='you@example.com'
								value={email}
								onChange={e => setEmail(e.target.value)}
								required
								autoComplete='email'
								autoFocus
							/>
						</div>

						{error && <p className='text-sm text-destructive'>{error}</p>}

						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? 'Sending…' : 'Send reset link'}
						</Button>
					</form>
				}

				<p className='text-center text-sm text-muted-foreground'>
					<Link href='/sign-in' className='underline hover:text-foreground'>
						Back to sign in
					</Link>
				</p>
			</div>
		</div>
	)
}
