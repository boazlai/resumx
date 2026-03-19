'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SettingsPanel } from '@/components/settings-panel'

interface UserMenuProps {
	email: string
	name: string
	avatarUrl: string
}

function getInitials(name: string, email: string): string {
	if (name) {
		const parts = name.trim().split(/\s+/)
		return parts.length >= 2 ?
				(parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
			:	parts[0].slice(0, 2).toUpperCase()
	}
	return email.slice(0, 2).toUpperCase()
}

export function UserMenu({ email, name, avatarUrl }: UserMenuProps) {
	const router = useRouter()
	const initials = getInitials(name, email)
	const [settingsOpen, setSettingsOpen] = useState(false)

	async function handleSignOut() {
		await fetch('/auth/sign-out', { method: 'POST' })
		router.push('/sign-in')
		router.refresh()
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						className='flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-xs font-semibold overflow-hidden ring-2 ring-transparent hover:ring-border transition-all focus:outline-none focus:ring-ring'
						aria-label='User menu'
					>
						{avatarUrl ?
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={avatarUrl}
								alt={name || email}
								className='w-full h-full object-cover'
							/>
						:	initials}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-56'>
					<DropdownMenuLabel className='font-normal'>
						<div className='flex flex-col gap-0.5'>
							{name && <p className='text-sm font-medium'>{name}</p>}
							<p className='text-xs text-muted-foreground truncate'>{email}</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem disabled>
						<User className='mr-2 h-4 w-4' />
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
						<Settings className='mr-2 h-4 w-4' />
						Settings
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={handleSignOut}
						className='text-destructive focus:text-destructive'
					>
						<LogOut className='mr-2 h-4 w-4' />
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
		</>
	)
}
