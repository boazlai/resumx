import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (user) redirect('/dashboard')

	return (
		<div className='min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center'>
			<div className='max-w-xl space-y-6'>
				<div className='space-y-2'>
					<h1 className='text-4xl font-bold tracking-tight'>Resume Editor</h1>
					<p className='text-lg text-muted-foreground'>
						A clean, distraction-free editor. Write your resume in markdown, get
						a perfectly fitted PDF every time — powered by&nbsp;
						<a
							href='https://resumx.dev'
							target='_blank'
							rel='noopener noreferrer'
							className='underline hover:text-foreground'
						>
							Resumx
						</a>
						.
					</p>
				</div>
				<div className='flex gap-3 justify-center'>
					<Button asChild>
						<Link href='/sign-in'>Sign in</Link>
					</Button>
					<Button asChild variant='outline'>
						<Link href='/sign-up'>Create account</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
