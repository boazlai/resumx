import { db } from '@/lib/db'
import { resumeShares, resumes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface Props {
	params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
	const { token } = await params

	const share = await db.query.resumeShares.findFirst({
		where: eq(resumeShares.token, token),
	})

	const expired = share?.expiresAt && share.expiresAt < new Date()

	if (!share || expired) {
		return (
			<div className='flex h-screen items-center justify-center bg-background text-center'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						{expired ? 'Link expired' : 'Not found'}
					</h1>
					<p className='mt-2 text-muted-foreground text-sm'>
						{expired ?
							'This share link has expired.'
						:	'This share link is invalid or has been revoked.'}
					</p>
				</div>
			</div>
		)
	}

	const resume = await db.query.resumes.findFirst({
		where: eq(resumes.id, share.resumeId),
		columns: { title: true },
	})

	const title = resume?.title ?? 'Shared Resume'

	return (
		<div className='flex h-screen flex-col bg-background'>
			<header className='flex h-12 shrink-0 items-center border-b px-4 gap-3'>
				<span className='text-sm font-medium truncate'>{title}</span>
				{share.expiresAt && (
					<span className='ml-auto text-xs text-muted-foreground shrink-0'>
						Expires {share.expiresAt.toLocaleDateString()}
					</span>
				)}
			</header>
			<iframe
				src={`/api/share/${token}`}
				className='flex-1 w-full border-0'
				title={title}
			/>
		</div>
	)
}
