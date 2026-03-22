import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorShell } from '@/components/editor/editor-shell'
import { getResumeAccess } from '@/lib/resume-access'

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

	const access = await getResumeAccess(id, {
		id: user.id,
		email: user.email,
		name: user.user_metadata?.full_name ?? '',
		avatarUrl: user.user_metadata?.avatar_url ?? '',
	})

	if (!access) notFound()

	return (
		<EditorShell
			resume={access.resume}
			user={{
				email: user.email ?? '',
				name: user.user_metadata?.full_name ?? '',
				avatarUrl: user.user_metadata?.avatar_url ?? '',
			}}
			access={access}
		/>
	)
}
