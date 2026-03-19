'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import type { Resume } from '@/lib/db/schema'
import { EditorToolbar } from './editor-toolbar'
import { MarkdownEditor } from './markdown-editor'
import { WysiwygEditor } from './wysiwyg-editor'
import { FrontmatterPanel } from './frontmatter-panel'
import { PdfPreview } from './pdf-preview'
import type { EditorMode, SaveStatus } from './types'

export function EditorShell({ resume }: { resume: Resume }) {
	const router = useRouter()

	// Editor mode + markdown/frontmatter split
	const [editorMode, setEditorMode] = useState<EditorMode>('markdown')

	// Parse YAML frontmatter (simple client-side extractor)
	const parseFrontmatter = (text: string) => {
		const m = text ?? ''
		const match = m.match(/^---\n([\s\S]*?)\n---\n?/)
		if (match) return { frontmatter: match[1], body: m.slice(match[0].length) }
		return { frontmatter: '', body: m }
	}

	const initial = parseFrontmatter(resume.markdown ?? '')
	const [frontmatter, setFrontmatter] = useState<string>(initial.frontmatter)
	const [body, setBody] = useState<string>(initial.body)
	const [markdown, setMarkdown] = useState(resume.markdown ?? '')
	const [title, setTitle] = useState(resume.title)
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
	const [showFrontmatter, setShowFrontmatter] = useState<boolean>(false)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)
	const [previewError, setPreviewError] = useState<string | null>(null)
	const prevUrlRef = useRef<string | null>(null)
	const markdownRef = useRef(resume.markdown ?? '')

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

	// Auto-compile preview at most once every 10s after edits
	const autoCompile = useDebouncedCallback(() => {
		handleCompile()
	}, 10000)

	// Manual compile: render the current markdown to the preview
	const handleCompile = useCallback(async () => {
		const value = markdownRef.current
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
				return
			}
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
			prevUrlRef.current = url
			setPreviewUrl(url)
		} catch {
			setPreviewError('Network error — could not reach server')
		} finally {
			setPreviewLoading(false)
		}
	}, [])

	// Auto-compile once when the editor first mounts
	useEffect(() => {
		if (resume.markdown.trim()) handleCompile()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleChange = useCallback(
		// Called by the Markdown (code) editor with the full markdown content.
		(value: string) => {
			setMarkdown(value)
			markdownRef.current = value
			const parsed = parseFrontmatter(value)
			setFrontmatter(parsed.frontmatter)
			setBody(parsed.body)
			autoSave(value)
			autoCompile()
		},
		[autoSave],
	)

	// Called by the WYSIWYG editor with the *body* (frontmatter excluded).
	const handleWysiwygChange = useCallback(
		(newBody: string) => {
			setBody(newBody)
			const full =
				frontmatter ? `---\n${frontmatter}\n---\n${newBody}` : newBody
			setMarkdown(full)
			markdownRef.current = full
			autoSave(full)
			autoCompile()
		},
		[frontmatter, autoSave],
	)

	// Update frontmatter from the dedicated panel and persist.
	const setFrontmatterAndSave = useCallback(
		(newFrontmatter: string) => {
			setFrontmatter(newFrontmatter)
			const full =
				newFrontmatter ? `---\n${newFrontmatter}\n---\n${body}` : body
			setMarkdown(full)
			markdownRef.current = full
			autoSave(full)
		},
		[body, autoSave],
	)

	const handleTitleChange = useDebouncedCallback(async (value: string) => {
		await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: value }),
		})
		router.refresh()
	}, 600)

	// Editor action helpers populated by the WYSIWYG or Markdown surface via onActionsReady
	const [editorActions, setEditorActions] = useState<{
		toggleMark: (m: 'bold' | 'italic' | 'underline' | 'strike') => void
		toggleList: (t: 'bullet' | 'ordered') => void
		setFontSize: (s: 'small' | 'normal' | 'large') => void
		setHeader?: (level: number) => void
		setFont?: (font: string) => void
		setColor?: (hex: string) => void
		setHighlight?: (hex: string) => void
		clearFormatting: () => void
		isMarkActive: (m: 'bold' | 'italic' | 'underline' | 'strike') => boolean
		isListActive: (t: 'bullet' | 'ordered') => boolean
		setAlign?: (a: 'left' | 'center' | 'right' | 'justify') => void
		increaseIndent?: () => void
		decreaseIndent?: () => void
	}>({
		toggleMark: () => {},
		toggleList: () => {},
		setFontSize: () => {},
		setHeader: () => {},
		setFont: () => {},
		setColor: () => {},
		setHighlight: () => {},
		clearFormatting: () => {},
		isMarkActive: () => false,
		isListActive: () => false,
		setAlign: () => {},
		increaseIndent: () => {},
		decreaseIndent: () => {},
	})

	return (
		<div className='flex flex-col flex-1 min-h-0 overflow-hidden bg-background'>
			<EditorToolbar
				resumeId={resume.id}
				title={title}
				saveStatus={saveStatus}
				editorMode={editorMode}
				onEditorModeChange={setEditorMode}
				onTitleChange={(v: string) => {
					setTitle(v)
					handleTitleChange(v)
				}}
				markdown={markdown}
				onCompile={handleCompile}
				isCompiling={previewLoading}
				onToggleFrontmatter={() => setShowFrontmatter(s => !s)}
				frontmatter={frontmatter}
				onSetFrontmatter={setFrontmatterAndSave}
				onToggleMark={editorActions.toggleMark}
				onToggleList={editorActions.toggleList}
				onSetFontSize={editorActions.setFontSize}
				onClearFormatting={editorActions.clearFormatting}
				onSetHeader={editorActions.setHeader}
				onSetFont={editorActions.setFont}
				onSetColor={editorActions.setColor}
				onSetHighlight={editorActions.setHighlight}
				onSetAlign={editorActions.setAlign}
				onIncreaseIndent={editorActions.increaseIndent}
				onDecreaseIndent={editorActions.decreaseIndent}
			/>

			{showFrontmatter && (
				<div className='border-b bg-muted/5'>
					<FrontmatterPanel
						frontmatter={frontmatter}
						onChange={setFrontmatterAndSave}
					/>
				</div>
			)}

			<PanelGroup
				direction='horizontal'
				className='flex-1 min-h-0 overflow-hidden'
			>
				{/* Left: active editor */}
				<Panel defaultSize={50} minSize={30}>
					<div className='h-full overflow-auto border-r bg-background'>
						{editorMode === 'markdown' ?
							<MarkdownEditor
								value={markdown}
								onChange={handleChange}
								onActionsReady={setEditorActions}
							/>
						:	<WysiwygEditor
								value={body}
								onChange={handleWysiwygChange}
								onActionsReady={setEditorActions}
							/>
						}
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
