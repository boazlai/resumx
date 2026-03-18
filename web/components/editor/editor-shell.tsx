'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import type { Resume } from '@/lib/db/schema'
import { EditorToolbar } from './editor-toolbar'
import { MarkdownEditor } from './markdown-editor'
import { PdfPreview } from './pdf-preview'

type SaveStatus = 'saved' | 'saving' | 'error'

export function EditorShell({ resume }: { resume: Resume }) {
	const router = useRouter()
	const [markdown, setMarkdown] = useState(resume.markdown)
	const [title, setTitle] = useState(resume.title)
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)
	const [previewError, setPreviewError] = useState<string | null>(null)
	const prevUrlRef = useRef<string | null>(null)

	// Auto-save markdown after 800ms of inactivity
	const autoSave = useDebouncedCallback(async (value: string) => {
		setSaveStatus('saving')
		const res = await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ markdown: value }),
		})
		setSaveStatus(res.ok ? 'saved' : 'error')
	}, 800)

	// Refresh PDF preview after 1.5s of inactivity
	const refreshPreview = useDebouncedCallback(async (value: string) => {
		setPreviewLoading(true)
		setPreviewError(null)
		try {
			const res = await fetch('/api/render/preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ markdown: value }),
			})
			if (!res.ok) {
				const data = await res.json().catch(() => ({}))
				setPreviewError(data.error ?? 'Render failed')
				setPreviewLoading(false)
				return
			}
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			// Revoke the previous object URL to free memory
			if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
			prevUrlRef.current = url
			setPreviewUrl(url)
		} catch {
			setPreviewError('Network error — could not reach server')
		} finally {
			setPreviewLoading(false)
		}
	}, 1500)

	const handleChange = useCallback(
		(value: string) => {
			setMarkdown(value)
			autoSave(value)
			refreshPreview(value)
		},
		[autoSave, refreshPreview],
	)

	const handleTitleChange = useDebouncedCallback(async (value: string) => {
		await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: value }),
		})
		router.refresh()
	}, 600)

	return (
		<div className='flex flex-col h-screen overflow-hidden bg-background'>
			<EditorToolbar
				resumeId={resume.id}
				title={title}
				saveStatus={saveStatus}
				onTitleChange={v => {
					setTitle(v)
					handleTitleChange(v)
				}}
				markdown={markdown}
			/>

			<PanelGroup direction='horizontal' className='flex-1 overflow-hidden'>
				{/* Left: Markdown editor */}
				<Panel defaultSize={50} minSize={30}>
					<div className='h-full overflow-auto border-r'>
						<MarkdownEditor value={markdown} onChange={handleChange} />
					</div>
				</Panel>

				<PanelResizeHandle className='w-1 bg-border hover:bg-foreground/20 transition-colors cursor-col-resize' />

				{/* Right: PDF preview */}
				<Panel defaultSize={50} minSize={25}>
					<PdfPreview
						url={previewUrl}
						loading={previewLoading}
						error={previewError}
					/>
				</Panel>
			</PanelGroup>
		</div>
	)
}
