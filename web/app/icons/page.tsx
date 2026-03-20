import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { IconBrowser } from '@/components/icons/icon-browser'
import { HowToBanner } from '@/components/icons/how-to-banner'

export default async function IconsPage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	return (
		<div className='min-h-screen bg-background'>
			<AppHeader
				email={user?.email ?? ''}
				name={user?.user_metadata?.full_name ?? ''}
				avatarUrl={user?.user_metadata?.avatar_url ?? ''}
			/>

			<main className='px-6 py-8 max-w-5xl mx-auto'>
				<h1 className='text-xl font-semibold tracking-tight mb-2'>
					Icon Reference
				</h1>
				<p className='text-sm text-muted-foreground mb-6'>
					Browse 600+ built-in icons, 200,000+ Iconify icons, emoji, or upload
					your own.
				</p>

				<div className='mb-6'>
					<HowToBanner />
				</div>

				<IconBrowser variant='page' />
			</main>
		</div>
	)
}
