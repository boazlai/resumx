'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type SaveStatus = 'saved' | 'saving' | 'error'
type ExportFormat = 'pdf' | 'html' | 'docx'

interface EditorToolbarProps {
	resumeId: string
	title: string
	saveStatus: SaveStatus
	onTitleChange: (value: string) => void
	markdown: string
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

const EXPORT_MIME: Record<ExportFormat, string> = {
	pdf: 'application/pdf',
	html: 'text/html',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
}: EditorToolbarProps) {
	const { toast } = useToast()
	const [exporting, setExporting] = useState<ExportFormat | null>(null)

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
		<header className='flex items-center gap-3 px-4 h-14 border-b bg-background shrink-0'>
			{/* Back to dashboard */}
			<Button variant='ghost' size='icon' asChild className='shrink-0'>
				<Link href='/dashboard'>
					<ArrowLeft className='h-4 w-4' />
					<span className='sr-only'>Back to dashboard</span>
				</Link>
			</Button>

			{/* Editable title */}
			<input
				type='text'
				value={title}
				onChange={e => onTitleChange(e.target.value)}
				placeholder='Untitled Resume'
				className='flex-1 min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground border-b border-transparent hover:border-border focus:border-foreground transition-colors truncate'
			/>

			{/* Save status */}
			<SaveIndicator status={saveStatus} />

			{/* Export dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='default'
						size='sm'
						disabled={exporting !== null}
						className='shrink-0'
					>
						{exporting ?
							<Loader2 className='h-4 w-4 animate-spin' />
						:	<Download className='h-4 w-4' />}
						{exporting ? `Exporting ${EXPORT_LABELS[exporting]}…` : 'Export'}
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
		</header>
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
