import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { ResumeCard } from '@/components/dashboard/resume-card'
import { CreateResumeButton } from '@/components/dashboard/create-resume-button'
import { ImportButton } from '@/components/dashboard/import-button'

export default async function DashboardPage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) redirect('/sign-in')

	const rows = await db
		.select({
			id: resumes.id,
			title: resumes.title,
			createdAt: resumes.createdAt,
			updatedAt: resumes.updatedAt,
		})
		.from(resumes)
		.where(eq(resumes.userId, user.id))
		.orderBy(resumes.updatedAt)

	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<header className='border-b bg-background sticky top-0 z-10'>
				<div className='max-w-5xl mx-auto px-4 h-14 flex items-center justify-between'>
					<Link href='/' className='text-sm font-semibold tracking-tight'>
						Resume Editor
					</Link>
					<div className='flex items-center gap-2'>
						<span className='text-sm text-muted-foreground hidden sm:inline'>
							{user.email}
						</span>
						<SignOutButton />
					</div>
				</div>
			</header>

			{/* Body */}
			<main className='max-w-5xl mx-auto px-4 py-10'>
				<div className='flex items-center justify-between mb-8'>
					<div>
						<h1 className='text-2xl font-bold tracking-tight'>My Resumes</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							{rows.length === 0 ?
								'Create your first resume to get started.'
							:	`${rows.length} resume${rows.length === 1 ? '' : 's'}`}
						</p>
					</div>
					<div className='flex gap-2'>
						<ImportButton />
						<CreateResumeButton />
					</div>
				</div>

				{rows.length === 0 ?
					<EmptyState />
				:	<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
						{rows.map(resume => (
							<ResumeCard key={resume.id} resume={resume} />
						))}
					</div>
				}
			</main>
		</div>
	)
}

function EmptyState() {
	return (
		<div className='border rounded-xl p-12 text-center text-muted-foreground space-y-4'>
			<div className='text-4xl'>📄</div>
			<p className='text-sm'>No resumes yet. Create one to get started.</p>
			<CreateResumeButton />
		</div>
	)
}

function SignOutButton() {
	return (
		<form action='/auth/sign-out' method='POST'>
			<Button type='submit' variant='ghost' size='sm'>
				Sign out
			</Button>
		</form>
	)
}
