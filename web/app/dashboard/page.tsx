import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ResumeCard } from '@/components/dashboard/resume-card'
import { CreateResumeButton } from '@/components/dashboard/create-resume-button'
import { ImportButton } from '@/components/dashboard/import-button'
import { AppHeader } from '@/components/app-header'

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
			<AppHeader
				email={user.email ?? ''}
				name={user.user_metadata?.full_name ?? ''}
				avatarUrl={user.user_metadata?.avatar_url ?? ''}
			/>

			<main className='px-6 py-8'>
				<div className='flex items-center justify-between mb-6'>
					<div>
						<h1 className='text-xl font-semibold tracking-tight'>My Resumes</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							{rows.length === 0 ?
								'Create your first resume to get started.'
							:	`${rows.length} resume${rows.length === 1 ? '' : 's'}`}
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<ImportButton />
						<CreateResumeButton />
					</div>
				</div>

				{rows.length === 0 ?
					<EmptyState />
				:	<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'>
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
