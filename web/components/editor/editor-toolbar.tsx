'use client'

import { useState } from 'react'
import {
	Download,
	Check,
	Loader2,
	AlertCircle,
	Play,
	Printer,
	Copy,
	Share2,
	History,
	Eye,
	EyeOff,
	PenLine,
} from 'lucide-react'
import StyleToolbar from './style-toolbar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { SaveStatus } from './types'
import type { ResumeAccessRole } from '@/lib/resume-access'

type ExportFormat = 'pdf' | 'html' | 'docx'

interface EditorToolbarProps {
	resumeId: string
	title: string
	saveStatus: SaveStatus
	onTitleChange: (value: string) => void
	markdown: string
	onCompile: () => void
	isCompiling: boolean
	// Frontmatter payload (YAML string) and setter for quick controls (style/pages)
	frontmatter?: string
	onSetFrontmatter?: (newFrontmatter: string) => void
	onToggleMark?: (mark: 'bold' | 'italic' | 'underline' | 'strike') => void
	onToggleList?: (type: 'bullet' | 'ordered') => void
	onSetFontSize?: (size: 'small' | 'normal' | 'large') => void
	onClearFormatting?: () => void
	// Additional editor actions
	onSetHeader?: (level: number) => void
	onSetFont?: (font: string) => void
	onSetColor?: (hex: string) => void
	onSetHighlight?: (hex: string) => void
	// Alignment and indent
	onSetAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
	onIncreaseIndent?: () => void
	onDecreaseIndent?: () => void
	// Editor query helpers for UI active state
	isMarkActive?: (mark: 'bold' | 'italic' | 'underline' | 'strike') => boolean
	isListActive?: (type: 'bullet' | 'ordered') => boolean
	onInsertTable?: (rows: number, cols: number) => void
	onInsertGrid?: (cols: number) => void
	onInsertDefList?: () => void
	// Extra actions
	wordCount?: number
	previewUrl?: string | null
	onDuplicate?: () => void
	onPrint?: () => void
	onOpenShare?: () => void
	onOpenCollaborators?: () => void
	onOpenHistory?: () => void
	showPreview?: boolean
	onTogglePreview?: () => void
	isNarrow?: boolean
	accessRole?: ResumeAccessRole
	canEdit?: boolean
	canManageCollaborators?: boolean
}

const EXPORT_LABELS: Record<ExportFormat, string> = {
	pdf: 'PDF',
	html: 'HTML (coming soon)',
	docx: 'Word / DOCX (coming soon)',
}

const EXPORT_ENABLED: Record<ExportFormat, boolean> = {
	pdf: true,
	html: false,
	docx: false,
}

const EXPORT_EXT: Record<ExportFormat, string> = {
	pdf: 'pdf',
	html: 'html',
	docx: 'docx',
}

export function EditorToolbar({
	resumeId,
	title,
	saveStatus,
	onTitleChange,
	markdown,
	onCompile,
	isCompiling,
	frontmatter,
	onSetFrontmatter,
	onToggleMark,
	onToggleList,
	onSetFontSize,
	onClearFormatting,
	onSetHeader,
	onSetFont,
	onSetColor,
	onSetHighlight,
	onSetAlign,
	onIncreaseIndent,
	onDecreaseIndent,
	isMarkActive,
	isListActive,
	onInsertTable,
	onInsertGrid,
	onInsertDefList,
	wordCount,
	previewUrl,
	onDuplicate,
	onPrint,
	onOpenShare,
	onOpenCollaborators,
	onOpenHistory,
	showPreview = true,
	onTogglePreview,
	isNarrow = false,
	accessRole = 'owner',
	canEdit = true,
	canManageCollaborators = false,
}: EditorToolbarProps) {
	const { toast } = useToast()
	const [exporting, setExporting] = useState<ExportFormat | null>(null)

	function readYamlTopLevel(key: string, fm: string | undefined) {
		if (!fm) return null
		const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
		if (!m) return null
		let v = m[1].trim()
		// strip surrounding quotes if present
		v = v.replace(/^["'](.*)["']$/, '$1')
		return v
	}

	function setYamlTopLevel(
		key: string,
		value: string | number | null,
		fm: string | undefined,
	) {
		const fmText = fm ?? ''
		const line =
			typeof value === 'number' ?
				`${key}: ${value}`
			:	`${key}: "${String(value)}"`
		if (fmText.match(new RegExp(`^${key}:`, 'm'))) {
			return fmText.replace(new RegExp(`^${key}:.*$`, 'm'), line)
		}
		// prepend new key at top
		if (!fmText.trim()) return `${line}\n`
		return `${line}\n${fmText}`
	}

	async function handleExport(format: ExportFormat) {
		setExporting(format)
		try {
			const res = await fetch('/api/render/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ markdown, format }),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				toast({
					title: `Export failed`,
					description: data.error ?? 'Could not generate file.',
					variant: 'destructive',
				})
				return
			}

			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const slug =
				title
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '') || 'resume'
			const filename = `${slug}.${EXPORT_EXT[format]}`

			const a = document.createElement('a')
			a.href = url
			a.download = filename
			a.click()
			URL.revokeObjectURL(url)

			toast({ title: `Downloaded ${filename}` })
		} catch {
			toast({
				title: 'Export failed',
				description: 'Network error.',
				variant: 'destructive',
			})
		} finally {
			setExporting(null)
		}
	}

	return (
		<div className='flex flex-col border-b bg-background/80 backdrop-blur shrink-0'>
			{/* Row 1: title, mode toggle, save status, compile, export */}
			<div className='flex h-auto min-h-11 flex-wrap items-center gap-3 px-4 py-2'>
				<div className='flex min-w-0 flex-1 items-center gap-3'>
					{/* Editable title */}
					<input
						type='text'
						value={title}
						onChange={e => onTitleChange(e.target.value)}
						placeholder='Untitled Resume'
						readOnly={!canEdit}
						className='min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground hover:border-border focus:border-foreground'
					/>
					<span className='rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground'>
						{accessRole}
					</span>
				</div>

				<div className='flex items-center gap-2 ml-auto'>
					{/* Save status */}
					<SaveIndicator status={saveStatus} />

					{/* Word count */}
					{wordCount !== undefined && (
						<span className='text-xs text-muted-foreground shrink-0 select-none tabular-nums'>
							{wordCount} {wordCount === 1 ? 'word' : 'words'}
						</span>
					)}

					<TooltipProvider delayDuration={400}>
						{/* History */}
						{onOpenHistory && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 w-8 p-0 shrink-0'
										onClick={onOpenHistory}
									>
										<History className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Version history</TooltipContent>
							</Tooltip>
						)}

						{/* Share */}
						{onOpenShare && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 w-8 p-0 shrink-0'
										onClick={onOpenShare}
									>
										<Share2 className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Share resume</TooltipContent>
							</Tooltip>
						)}

						{onOpenCollaborators && canManageCollaborators && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 px-2 shrink-0'
										onClick={onOpenCollaborators}
									>
										<Share2 className='h-4 w-4' />
										<span className='sr-only'>Manage collaborators</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>Manage collaborators</TooltipContent>
							</Tooltip>
						)}

						{/* Duplicate */}
						{onDuplicate && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 w-8 p-0 shrink-0'
										onClick={onDuplicate}
									>
										<Copy className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Duplicate resume</TooltipContent>
							</Tooltip>
						)}

						{/* Print */}
						{onPrint && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='h-8 w-8 p-0 shrink-0'
										onClick={onPrint}
										disabled={!previewUrl}
									>
										<Printer className='h-4 w-4' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{previewUrl ? 'Print' : 'Compile first to print'}
								</TooltipContent>
							</Tooltip>
						)}
					</TooltipProvider>

					{/* Compile button */}
					<Button
						variant='outline'
						size='sm'
						onClick={onCompile}
						disabled={isCompiling || !canEdit}
						className='shrink-0 gap-1.5'
					>
						{isCompiling ?
							<Loader2 className='h-3.5 w-3.5 animate-spin' />
						:	<Play className='h-3.5 w-3.5' />}
						{isCompiling ? 'Compiling…' : 'Compile'}
					</Button>

					{/* Export dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='default'
								size='sm'
								disabled={exporting !== null || !canEdit}
								className='shrink-0'
							>
								{exporting ?
									<Loader2 className='h-4 w-4 animate-spin' />
								:	<Download className='h-4 w-4' />}
								{exporting ? `Exporting…` : 'Export'}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							{(Object.keys(EXPORT_LABELS) as ExportFormat[]).map(fmt => (
								<DropdownMenuItem
									key={fmt}
									onSelect={() => EXPORT_ENABLED[fmt] && handleExport(fmt)}
									disabled={exporting !== null || !EXPORT_ENABLED[fmt]}
								>
									{EXPORT_LABELS[fmt]}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Row 2: style toolbar – overflow-x auto but must NOT clip y (for dropdowns) */}
			<div
				className='border-t px-2 py-1 flex items-center gap-1'
				style={{ overflowX: 'auto', overflowY: 'visible' }}
			>
				<div className='flex-1'>
					<StyleToolbar
						disabled={!canEdit}
						frontmatter={frontmatter}
						onSetFrontmatter={onSetFrontmatter}
						onToggleMark={onToggleMark}
						onToggleList={onToggleList}
						onSetFontSize={onSetFontSize}
						onClearFormatting={onClearFormatting}
						onSetHeader={onSetHeader}
						onSetFont={onSetFont}
						onSetColor={onSetColor}
						onSetHighlight={onSetHighlight}
						onSetAlign={onSetAlign}
						onIncreaseIndent={onIncreaseIndent}
						onDecreaseIndent={onDecreaseIndent}
						isMarkActive={isMarkActive}
						isListActive={isListActive}
						onInsertTable={onInsertTable}
						onInsertGrid={onInsertGrid}
						onInsertDefList={onInsertDefList}
						isNarrow={isNarrow}
					/>
				</div>

				{/* Toggle preview */}
				{onTogglePreview && (
					<TooltipProvider delayDuration={400}>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='sm'
									className='h-7 w-7 p-0 shrink-0'
									onClick={onTogglePreview}
								>
									{isNarrow ?
										showPreview ?
											<PenLine className='h-4 w-4' />
										:	<Eye className='h-4 w-4' />
									: showPreview ?
										<Eye className='h-4 w-4' />
									:	<EyeOff className='h-4 w-4' />}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isNarrow ?
									showPreview ?
										'Back to editor'
									:	'Switch to preview'
								: showPreview ?
									'Hide preview'
								:	'Show preview'}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
		</div>
	)
}

function SaveIndicator({ status }: { status: SaveStatus }) {
	return (
		<span
			className={cn(
				'flex items-center gap-1 text-xs shrink-0 select-none transition-opacity',
				status === 'saved' && 'text-muted-foreground',
				status === 'saving' && 'text-muted-foreground',
				status === 'error' && 'text-destructive',
			)}
		>
			{status === 'saving' && <Loader2 className='h-3 w-3 animate-spin' />}
			{status === 'saved' && <Check className='h-3 w-3' />}
			{status === 'error' && <AlertCircle className='h-3 w-3' />}
			{status === 'saving' ?
				'Saving…'
			: status === 'error' ?
				'Save failed'
			:	'Saved'}
		</span>
	)
}
