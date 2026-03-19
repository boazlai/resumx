import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { EditorShell } from '@/components/editor/editor-shell'
import { AppHeader } from '@/components/app-header'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
	const { id } = await params
	return { title: `Edit Resume — ${id.slice(0, 8)}` }
}

export default async function ResumePage({ params }: Props) {
	const { id } = await params

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/sign-in')

	const [row] = await db
		.select()
		.from(resumes)
		.where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
		.limit(1)

	if (!row) notFound()

	return (
		<div className='flex flex-col h-screen overflow-hidden'>
			<AppHeader
				email={user.email ?? ''}
				name={user.user_metadata?.full_name ?? ''}
				avatarUrl={user.user_metadata?.avatar_url ?? ''}
			/>
			<EditorShell resume={row} />
		</div>
	)
}
