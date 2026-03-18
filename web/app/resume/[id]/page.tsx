import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { resumes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { EditorShell } from '@/components/editor/editor-shell'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
	const { id } = await params
	/* title for the browser tab — best-effort, no extra DB call needed */
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

	return <EditorShell resume={row} />
}
