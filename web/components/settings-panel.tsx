'use client'

import { ChevronDown, Check } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/lib/theme'
import { usePreferences } from '@/lib/hooks/use-preferences'
import { FONT_GROUPS } from '@/components/editor/font-map'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

import type { Theme } from '@/lib/theme'

const THEMES: { id: Theme; label: string; swatches: string[] }[] = [
	{
		id: 'light',
		label: 'Light',
		swatches: ['#f5f1ec', '#DFD0B8', '#948979', '#222831'],
	},
	{
		id: 'dark',
		label: 'Dark',
		swatches: ['#222831', '#393E46', '#948979', '#DFD0B8'],
	},
	{
		id: 'catppuccin-latte',
		label: 'Catppuccin Latte',
		swatches: ['#eff1f5', '#ccd0da', '#8839ef', '#4c4f69'],
	},
	{
		id: 'catppuccin-mocha',
		label: 'Catppuccin Mocha',
		swatches: ['#1e1e2e', '#313244', '#cba6f7', '#cdd6f4'],
	},
	{
		id: 'one-dark-pro',
		label: 'One Dark Pro',
		swatches: ['#282c34', '#3e4451', '#61afef', '#abb2bf'],
	},
	{
		id: 'dracula',
		label: 'Dracula',
		swatches: ['#282a36', '#44475a', '#bd93f9', '#f8f8f2'],
	},
	{
		id: 'nord',
		label: 'Nord',
		swatches: ['#2e3440', '#3b4252', '#88c0d0', '#d8dee9'],
	},
	{
		id: 'solarized-light',
		label: 'Solarized Light',
		swatches: ['#fdf6e3', '#eee8d5', '#268bd2', '#657b83'],
	},
	{
		id: 'tokyo-night',
		label: 'Tokyo Night',
		swatches: ['#1a1b26', '#24283b', '#7aa2f7', '#a9b1d6'],
	},
]

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
	const { theme, setTheme } = useTheme()
	const { prefs, updatePrefs } = usePreferences()

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
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className='flex items-center justify-between gap-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors'>
									<span className='truncate'>
										{THEMES.find(t => t.id === theme)?.label ?? theme}
									</span>
									<div className='flex items-center gap-2 shrink-0'>
										<div className='flex gap-0.5'>
											{(THEMES.find(t => t.id === theme)?.swatches ?? []).map(
												c => (
													<span
														key={c}
														className='h-4 w-4 rounded-sm block'
														style={{ background: c }}
													/>
												),
											)}
										</div>
										<ChevronDown className='h-3.5 w-3.5 opacity-50' />
									</div>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='start'
								sideOffset={4}
								className='rounded-xl min-w-[220px]'
							>
								{THEMES.map(t => (
									<DropdownMenuItem
										key={t.id}
										className='rounded-lg flex items-center justify-between gap-4 cursor-pointer'
										onSelect={() => setTheme(t.id)}
									>
										<div className='flex items-center gap-2'>
											<Check
												className={cn(
													'h-3.5 w-3.5 shrink-0',
													theme === t.id ? 'opacity-100' : 'opacity-0',
												)}
											/>
											<span className='text-sm'>{t.label}</span>
										</div>
										<div className='flex gap-0.5'>
											{t.swatches.map(c => (
												<span
													key={c}
													className='h-4 w-4 rounded-sm block shrink-0'
													style={{ background: c }}
												/>
											))}
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</section>

					<div className='h-px bg-border' />

					<section>
						<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3'>
							Editor
						</p>
						<div className='space-y-4'>
							{/* Default font */}
							<div className='flex items-center justify-between gap-3'>
								<span className='text-sm'>Default font</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className='flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors min-w-[120px] justify-between'>
											<span className='truncate'>
												{prefs.defaultFont ?? 'Default'}
											</span>
											<ChevronDown className='h-3.5 w-3.5 shrink-0 opacity-50' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										className='rounded-xl max-h-64 overflow-y-auto'
									>
										<DropdownMenuItem
											className='rounded-lg'
											onSelect={() => updatePrefs({ defaultFont: null })}
										>
											<Check
												className={cn(
													'mr-2 h-3.5 w-3.5',
													prefs.defaultFont == null ?
														'opacity-100'
													:	'opacity-0',
												)}
											/>
											Default
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										{FONT_GROUPS.map(group => (
											<div key={group.label}>
												<DropdownMenuLabel className='text-xs'>
													{group.label}
												</DropdownMenuLabel>
												{group.fonts.map(font => (
													<DropdownMenuItem
														key={font}
														className='rounded-lg'
														onSelect={() => updatePrefs({ defaultFont: font })}
													>
														<Check
															className={cn(
																'mr-2 h-3.5 w-3.5',
																prefs.defaultFont === font ?
																	'opacity-100'
																:	'opacity-0',
															)}
														/>
														{font}
													</DropdownMenuItem>
												))}
											</div>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Auto-save */}
							<div className='flex items-center justify-between gap-3'>
								<span className='text-sm'>Auto-save</span>
								<button
									onClick={() => updatePrefs({ autoSave: !prefs.autoSave })}
									className={cn(
										'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
										prefs.autoSave ?
											'bg-primary text-primary-foreground'
										:	'bg-muted text-muted-foreground hover:bg-muted/80',
									)}
								>
									{prefs.autoSave ? 'On' : 'Off'}
								</button>
							</div>

							{/* Auto-save interval */}
							<div
								className={cn(
									'flex items-center justify-between gap-3',
									!prefs.autoSave && 'opacity-40 pointer-events-none',
								)}
							>
								<span className='text-sm'>Save interval</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											disabled={!prefs.autoSave}
											className='flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors min-w-[80px] justify-between disabled:cursor-not-allowed'
										>
											<span>{prefs.autoSaveInterval}s</span>
											<ChevronDown className='h-3.5 w-3.5 shrink-0 opacity-50' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='rounded-xl'>
										{[5, 10, 30, 60].map(s => (
											<DropdownMenuItem
												key={s}
												className='rounded-lg'
												onSelect={() => updatePrefs({ autoSaveInterval: s })}
											>
												<Check
													className={cn(
														'mr-2 h-3.5 w-3.5',
														prefs.autoSaveInterval === s ?
															'opacity-100'
														:	'opacity-0',
													)}
												/>
												{s}s
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Auto-compile */}
							<div className='flex items-center justify-between gap-3'>
								<span className='text-sm'>Auto-compile</span>
								<button
									onClick={() =>
										updatePrefs({ autoCompile: !prefs.autoCompile })
									}
									className={cn(
										'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
										prefs.autoCompile ?
											'bg-primary text-primary-foreground'
										:	'bg-muted text-muted-foreground hover:bg-muted/80',
									)}
								>
									{prefs.autoCompile ? 'On' : 'Off'}
								</button>
							</div>
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	)
}
