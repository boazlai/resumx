import Link from 'next/link'
import { UserMenu } from '@/components/dashboard/user-menu'

interface AppHeaderProps {
	email: string
	name: string
	avatarUrl: string
}

export function AppHeader({ email, name, avatarUrl }: AppHeaderProps) {
	return (
		<header className='border-b bg-background sticky top-0 z-20 shrink-0'>
			<div className='px-6 h-14 flex items-center justify-between'>
				<div className='flex items-center gap-6'>
					<Link href='/' className='text-sm font-semibold tracking-tight'>
						Resume Editor
					</Link>
					<Link
						href='/dashboard'
						className='text-sm text-muted-foreground hover:text-foreground transition-colors font-medium'
					>
						My Resumes
					</Link>
				</div>
				<UserMenu email={email} name={name} avatarUrl={avatarUrl} />
			</div>
		</header>
	)
}
