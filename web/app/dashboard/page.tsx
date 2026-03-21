import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AppHeader } from '@/components/app-header'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

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
			tags: resumes.tags,
			thumbnailUrl: resumes.thumbnailUrl,
			createdAt: resumes.createdAt,
			updatedAt: resumes.updatedAt,
		})
		.from(resumes)
		.where(eq(resumes.userId, user.id))

	return (
		<div className='min-h-screen bg-background'>
			<AppHeader
				email={user.email ?? ''}
				name={user.user_metadata?.full_name ?? ''}
				avatarUrl={user.user_metadata?.avatar_url ?? ''}
			/>
			<DashboardShell rows={rows} />
		</div>
	)
}
