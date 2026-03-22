'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	FileText,
	Home,
	Palette,
	Settings,
	User,
	X,
	Plus,
	Loader2,
	Sparkles,
} from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { IconBrowser } from '@/components/icons/icon-browser'
import { ChatPanel } from './chat-panel'
import { SettingsPanel } from '@/components/settings-panel'
import { ProfilePanel } from '@/components/profile-panel'
import type { ChatActions } from './types'
import { cn } from '@/lib/utils'

type PanelId = 'resumes' | 'icons' | 'ai'

type ResumeRow = {
	id: string
	title: string
	updatedAt: string | Date
}

interface EditorSidebarProps {
	email: string
	name: string
	avatarUrl: string
	markdown: string
	chatActions: ChatActions
	onInsert?: (syntax: string, url: string) => void
	isNarrow?: boolean
	canUseAi?: boolean
}

export function EditorSidebar({
	email,
	name,
	avatarUrl,
	markdown,
	chatActions,
	onInsert,
	isNarrow = false,
	canUseAi = true,
}: EditorSidebarProps) {
	const [activePanel, setActivePanel] = useState<PanelId | null>(null)
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [profileOpen, setProfileOpen] = useState(false)
	const [resumes, setResumes] = useState<ResumeRow[] | null>(null)
	const [resumesLoading, setResumesLoading] = useState(false)
	const [chatKey, setChatKey] = useState(0)
	const [panelWidth, setPanelWidth] = useState(280)
	const [isDragging, setIsDragging] = useState(false)
	const router = useRouter()

	useEffect(() => {
		if (isNarrow) setActivePanel(null)
	}, [isNarrow])

	function handleDragMouseDown(e: React.MouseEvent) {
		e.preventDefault()
		const startX = e.clientX
		const startWidth = panelWidth
		setIsDragging(true)

		function onMove(ev: MouseEvent) {
			const newWidth = Math.max(
				200,
				Math.min(520, startWidth + ev.clientX - startX),
			)
			setPanelWidth(newWidth)
		}

		function onUp() {
			setIsDragging(false)
			document.removeEventListener('mousemove', onMove)
			document.removeEventListener('mouseup', onUp)
		}

		document.addEventListener('mousemove', onMove)
		document.addEventListener('mouseup', onUp)
	}

	const toggle = (panel: PanelId) =>
		setActivePanel(prev => (prev === panel ? null : panel))

	// Fetch resumes when the resumes panel opens
	useEffect(() => {
		if (activePanel !== 'resumes') return
		setResumesLoading(true)
		fetch('/api/resume')
			.then(r => (r.ok ? r.json() : []))
			.then((rows: ResumeRow[]) => setResumes(rows))
			.catch(() => setResumes([]))
			.finally(() => setResumesLoading(false))
	}, [activePanel])

	async function handleNewResume() {
		const res = await fetch('/api/resume', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Untitled Resume' }),
		})
		if (res.ok) {
			const row = await res.json()
			router.push(`/resume/${row.id}`)
		}
	}

	return (
		<>
			<TooltipProvider delayDuration={300}>
				<div className='flex h-full shrink-0'>
					{/* Column 1: Icon rail */}
					<nav className='flex flex-col items-center w-12 border-r bg-muted/30 py-2 gap-1 shrink-0'>
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									href='/'
									aria-label='Dashboard'
									className='p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
								>
									<Home className='h-5 w-5' />
								</Link>
							</TooltipTrigger>
							<TooltipContent side='right'>Dashboard</TooltipContent>
						</Tooltip>

						<RailButton
							label='My Resumes'
							active={activePanel === 'resumes'}
							onClick={() => toggle('resumes')}
						>
							<FileText className='h-5 w-5' />
						</RailButton>

						<RailButton
							label='Icons'
							active={activePanel === 'icons'}
							onClick={() => toggle('icons')}
						>
							<Palette className='h-5 w-5' />
						</RailButton>

						<RailButton
							label='AI Assistant'
							active={activePanel === 'ai'}
							onClick={() => canUseAi && toggle('ai')}
						>
							<Sparkles className='h-5 w-5' />
						</RailButton>

						<div className='flex-1' />

						<div className='w-6 border-t my-1' />

						<RailButton
							label='Settings'
							active={false}
							onClick={() => setSettingsOpen(true)}
						>
							<Settings className='h-5 w-5' />
						</RailButton>

						<RailButton
							label='Account'
							active={false}
							onClick={() => setProfileOpen(true)}
						>
							{avatarUrl ?
								// eslint-disable-next-line @next/next/no-img-element
								<img src={avatarUrl} alt='' className='h-5 w-5 rounded-full' />
							:	<User className='h-5 w-5' />}
						</RailButton>
					</nav>

					{/* Column 2: Slide-out content panel */}
					<aside
						className={cn(
							'relative overflow-hidden border-r bg-background',
							isDragging ?
								'transition-none select-none'
							:	'transition-[width] duration-200 ease-in-out',
						)}
						style={{ width: activePanel ? panelWidth : 0 }}
					>
						<div className='w-full h-full flex flex-col'>
							{/* Panel header */}
							<div className='flex items-center justify-between px-3 py-2 border-b shrink-0'>
								<span className='text-sm font-medium'>
									{activePanel === 'resumes' && 'My Resumes'}
									{activePanel === 'icons' && 'Icons'}
									{activePanel === 'ai' && 'AI Assistant'}{' '}
								</span>
								<div className='flex items-center gap-1'>
									{activePanel === 'resumes' && (
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type='button'
													onClick={handleNewResume}
													className='p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
													aria-label='New resume'
												>
													<Plus className='h-4 w-4' />
												</button>
											</TooltipTrigger>
											<TooltipContent side='bottom'>New resume</TooltipContent>
										</Tooltip>
									)}
									{activePanel === 'ai' && canUseAi && (
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type='button'
													onClick={() => setChatKey(k => k + 1)}
													className='p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
													aria-label='New chat'
												>
													<Plus className='h-4 w-4' />
												</button>
											</TooltipTrigger>
											<TooltipContent side='bottom'>New chat</TooltipContent>
										</Tooltip>
									)}
									<button
										type='button'
										onClick={() => setActivePanel(null)}
										aria-label='Close panel'
										className='p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground'
									>
										<X className='h-4 w-4' />
									</button>
								</div>
							</div>

							{/* Panel content */}
							<div
								className={cn(
									'flex-1 min-h-0',
									activePanel === 'icons' || activePanel === 'ai' ?
										'overflow-hidden'
									:	'p-3 overflow-y-auto',
								)}
							>
								{activePanel === 'resumes' && (
									<div className='space-y-0.5'>
										{resumesLoading && (
											<div className='flex justify-center py-6'>
												<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
											</div>
										)}
										{!resumesLoading && resumes?.length === 0 && (
											<p className='text-xs text-muted-foreground py-4 text-center'>
												No resumes yet.
											</p>
										)}
										{!resumesLoading
											&& resumes?.map(r => (
												<Link
													key={r.id}
													href={`/resume/${r.id}`}
													className='flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors group'
												>
													<FileText className='h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground' />
													<span className='truncate'>
														{r.title || 'Untitled'}
													</span>
												</Link>
											))}
									</div>
								)}
								{activePanel === 'icons' && (
									<IconBrowser variant='sidebar' onInsert={onInsert} />
								)}
								{activePanel === 'ai' && canUseAi && (
									<ChatPanel
										key={chatKey}
										markdown={markdown}
										chatActions={chatActions}
									/>
								)}
								{activePanel === 'ai' && !canUseAi && (
									<div className='flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground'>
										AI tools are available only while editing.
									</div>
								)}
							</div>
						</div>
						{activePanel && (
							<div
								className='absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 z-10'
								onMouseDown={handleDragMouseDown}
							/>
						)}
					</aside>
				</div>
			</TooltipProvider>

			<SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
			<ProfilePanel
				open={profileOpen}
				onOpenChange={setProfileOpen}
				initialName={name}
				initialEmail={email}
				avatarUrl={avatarUrl}
			/>
		</>
	)
}

/* â”€â”€ Rail sub-components â”€â”€ */

function RailButton({
	label,
	active,
	onClick,
	children,
}: {
	label: string
	active: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type='button'
					onClick={onClick}
					className={cn(
						'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
						active ?
							'bg-primary/10 text-primary'
						:	'text-muted-foreground hover:text-foreground hover:bg-muted',
					)}
				>
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side='right'>{label}</TooltipContent>
		</Tooltip>
	)
}
