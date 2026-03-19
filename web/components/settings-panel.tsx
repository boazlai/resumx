'use client'

import { Moon, Sun } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const SWATCHES_LIGHT = ['#f5f1ec', '#DFD0B8', '#948979', '#222831']
const SWATCHES_DARK = ['#222831', '#393E46', '#948979', '#DFD0B8']

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
	const { theme, setTheme } = useTheme()

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-xs'>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>

				<div className='py-2 space-y-5'>
					{/* ── Theme ── */}
					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Theme
						</p>
						<div className='grid grid-cols-2 gap-3'>
							<ThemeCard
								label='Light'
								icon={<Sun className='h-3.5 w-3.5' />}
								swatches={SWATCHES_LIGHT}
								selected={theme === 'light'}
								onClick={() => setTheme('light')}
							/>
							<ThemeCard
								label='Dark'
								icon={<Moon className='h-3.5 w-3.5' />}
								swatches={SWATCHES_DARK}
								selected={theme === 'dark'}
								onClick={() => setTheme('dark')}
							/>
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function ThemeCard({
	label,
	icon,
	swatches,
	selected,
	onClick,
}: {
	label: string
	icon: React.ReactNode
	swatches: string[]
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'rounded-lg border-2 p-3 text-left transition-all w-full',
				selected ?
					'border-primary ring-1 ring-primary/30'
				:	'border-border hover:border-muted-foreground/50',
			)}
		>
			<div className='flex items-center gap-1.5 mb-2.5'>
				{icon}
				<span className='text-xs font-medium'>{label}</span>
			</div>
			<div className='flex gap-1'>
				{swatches.map(c => (
					<span
						key={c}
						className='h-4 flex-1 rounded-sm block'
						style={{ background: c }}
					/>
				))}
			</div>
		</button>
	)
}
