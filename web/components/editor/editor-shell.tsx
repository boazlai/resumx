'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import type { Resume } from '@/lib/db/schema'
import { EditorToolbar } from './editor-toolbar'
import { MarkdownEditor } from './markdown-editor'
import { PdfPreview } from './pdf-preview'
import { EditorSidebar } from './editor-sidebar'
import { VersionHistoryDialog } from './version-history-dialog'
import { ShareDialog } from './share-dialog'
import { CollaboratorDialog } from './collaborator-dialog'
import type { SaveStatus, ChatActions, ResumeEditorSurfaceProps } from './types'
import { usePreferences } from '@/lib/hooks/use-preferences'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { useToast } from '@/lib/toast'
import type { ResumeAccess } from '@/lib/resume-access'

function countWords(text: string): number {
	const stripped = text
		.replace(/!\[.*?\]\(.*?\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\{[^}]*\}/g, '')
		.replace(/^#+\s*/gm, '')
		.replace(/[*_`~>|]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
	return stripped ? stripped.split(' ').filter(w => w.length > 0).length : 0
}

interface EditorShellProps {
	resume: Resume
	user: {
		email: string
		name: string
		avatarUrl: string
	}
	access: ResumeAccess
}

export function EditorShell({ resume, user, access }: EditorShellProps) {
	const router = useRouter()
	const { toast } = useToast()
	const { prefs } = usePreferences()
	const prefsRef = useRef(prefs)
	useEffect(() => {
		prefsRef.current = prefs
	}, [prefs])

	// User-uploaded icons for auto-insert
	const [userIcons, setUserIcons] = useState<Map<string, string>>(new Map())

	useEffect(() => {
		fetch('/api/icons')
			.then(r => (r.ok ? r.json() : []))
			.then((icons: { name: string; url: string }[]) => {
				setUserIcons(new Map(icons.map(i => [i.name, i.url])))
			})
			.catch(() => {})
	}, [])

	// Parse YAML frontmatter (simple client-side extractor)
	const parseFrontmatter = (text: string) => {
		const m = text ?? ''
		const match = m.match(/^---\n([\s\S]*?)\n---\n?/)
		if (match) return { frontmatter: match[1], body: m.slice(match[0].length) }
		return { frontmatter: '', body: m }
	}

	const initial = parseFrontmatter(resume.markdown ?? '')
	const [frontmatter, setFrontmatter] = useState<string>(initial.frontmatter)
	const frontmatterRef = useRef<string>(initial.frontmatter)
	const [body, setBody] = useState<string>(initial.body)
	const [markdown, setMarkdown] = useState(resume.markdown ?? '')
	const [title, setTitle] = useState(resume.title)
	const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)
	const [previewError, setPreviewError] = useState<string | null>(null)
	const [selectionTick, setSelectionTick] = useState(0)
	const prevUrlRef = useRef<string | null>(null)
	const markdownRef = useRef(resume.markdown ?? '')
	const isCompilingRef = useRef(false)
	const pendingPrintRef = useRef(false)
	const [showHistory, setShowHistory] = useState(false)
	const [showShare, setShowShare] = useState(false)
	const [showCollaborators, setShowCollaborators] = useState(false)
	const [showPreview, setShowPreview] = useState(true)
	const canEdit = access.canEdit

	const isNarrow = useMediaQuery('(max-width: 1023px)')
	useEffect(() => {
		if (isNarrow) setShowPreview(false)
	}, [isNarrow])

	const handleSelectionUpdate = useCallback(() => {
		setSelectionTick(t => t + 1)
	}, [])

	// Auto-save markdown after a debounce period matching the user's preference
	const autoSave = useDebouncedCallback(
		async (value: string) => {
			if (!prefsRef.current.autoSave || !canEdit) return
			setSaveStatus('saving')
			const res = await fetch(`/api/resume/${resume.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ markdown: value }),
			})
			setSaveStatus(res.ok ? 'saved' : 'error')
		},
		(prefs.autoSaveInterval ?? 10) * 1000,
	)

	// Auto-compile preview at most once every 10s after edits
	const autoCompile = useDebouncedCallback(() => {
		if (!prefsRef.current.autoCompile) return
		handleCompile(false)
	}, 10000)

	// Manual compile: render the current markdown to the preview
	const handleCompile = useCallback(
		async (isManual = false) => {
			if (isCompilingRef.current) return
			isCompilingRef.current = true
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

				// Auto-snapshot on every manual compile (fire-and-forget)
				if (isManual && canEdit) {
					fetch(`/api/resume/${resume.id}/snapshots`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ markdown: value }),
					}).catch(() => {})
				}

				// Refresh dashboard thumbnail (fire-and-forget)
				if (canEdit) {
					fetch(`/api/resume/${resume.id}/thumbnail`, {
						method: 'POST',
					}).catch(() => {})
				}
			} catch {
				setPreviewError('Network error — could not reach server')
			} finally {
				setPreviewLoading(false)
				isCompilingRef.current = false
			}
		},
		[canEdit, resume.id],
	)

	// Auto-compile once when the editor first mounts
	useEffect(() => {
		if (resume.markdown.trim()) handleCompile(false)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Print: open previewUrl in a hidden iframe and trigger window.print
	const handlePrint = useCallback(() => {
		if (!previewUrl) {
			pendingPrintRef.current = true
			handleCompile(true)
			return
		}
		const iframe = document.createElement('iframe')
		iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0'
		iframe.src = previewUrl
		document.body.appendChild(iframe)
		iframe.onload = () => {
			iframe.contentWindow?.print()
			setTimeout(() => document.body.removeChild(iframe), 1000)
		}
	}, [previewUrl, handleCompile])

	// After a compile triggered by pending print, auto-print
	const prevPreviewUrlRef = useRef<string | null>(null)
	useEffect(() => {
		if (
			previewUrl
			&& previewUrl !== prevPreviewUrlRef.current
			&& pendingPrintRef.current
		) {
			pendingPrintRef.current = false
			handlePrint()
		}
		prevPreviewUrlRef.current = previewUrl
	}, [previewUrl, handlePrint])

	// Duplicate: create a copy and navigate to it
	const handleDuplicate = useCallback(async () => {
		if (!access.canDuplicate) return
		try {
			const res = await fetch('/api/resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: `${title} (copy)`,
					markdown: markdownRef.current,
				}),
			})
			if (!res.ok) throw new Error()
			const created = await res.json()
			router.push(`/resume/${created.id}`)
		} catch {
			toast({ title: 'Could not duplicate resume', variant: 'destructive' })
		}
	}, [access.canDuplicate, title, router, toast])

	// Restore: overwrite editor content with snapshot markdown
	const handleRestore = useCallback(
		(restoredMarkdown: string) => {
			const { frontmatter: fm, body: bd } = parseFrontmatter(restoredMarkdown)
			setFrontmatter(fm)
			frontmatterRef.current = fm
			setBody(bd)
			setMarkdown(restoredMarkdown)
			markdownRef.current = restoredMarkdown
			autoSave(restoredMarkdown)
		},
		[autoSave],
	)

	// Live word count from body (markdown symbols stripped)
	const wordCount = useMemo(() => countWords(body), [body])

	const handleChange = useCallback(
		// Called by the Markdown editor with just the body content (no frontmatter block).
		(value: string) => {
			if (!canEdit) return
			setBody(value)
			const full =
				frontmatterRef.current ?
					`---\n${frontmatterRef.current}\n---\n${value}`
				:	value
			setMarkdown(full)
			markdownRef.current = full
			autoSave(full)
			autoCompile()
		},
		[autoSave, canEdit],
	)

	// Update frontmatter from the toolbar controls/YAML panel and persist.
	const setFrontmatterAndSave = useCallback(
		(newFrontmatter: string) => {
			if (!canEdit) return
			setFrontmatter(newFrontmatter)
			frontmatterRef.current = newFrontmatter
			const currentBody =
				markdownRef.current ? parseFrontmatter(markdownRef.current).body : body
			const full =
				newFrontmatter ?
					`---\n${newFrontmatter}\n---\n${currentBody}`
				:	currentBody
			setMarkdown(full)
			markdownRef.current = full
			autoSave(full)
		},
		[body, autoSave, canEdit],
	)

	const handleTitleChange = useDebouncedCallback(async (value: string) => {
		if (!canEdit) return
		await fetch(`/api/resume/${resume.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: value }),
		})
		router.refresh()
	}, 600)

	// Editor action helpers populated by the Markdown surface via onActionsReady
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
		insertTable?: (rows: number, cols: number) => void
		insertGrid?: (cols: number) => void
		insertDefList?: () => void
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

	const [chatActions, setChatActions] = useState<ChatActions>({
		getSelection: () => null,
		applyEdit: () => {},
		applyDiff: () => {},
		applyDiffs: () => {},
		clearDiff: () => {},
		clearDiffById: () => {},
	})

	const handleActionsReady = useCallback(
		(
			actions: Parameters<
				NonNullable<ResumeEditorSurfaceProps['onActionsReady']>
			>[0],
		) => {
			setEditorActions(actions)
			setChatActions({
				getSelection: actions.getSelection ?? (() => null),
				applyEdit: actions.applyEdit ?? (() => {}),
				applyDiff: actions.applyDiff ?? (() => {}),
				applyDiffs: actions.applyDiffs ?? (() => {}),
				clearDiff: actions.clearDiff ?? (() => {}),
				clearDiffById: actions.clearDiffById ?? (() => {}),
			})
		},
		[],
	)

	return (
		<div className='flex h-screen overflow-hidden bg-background'>
			<EditorSidebar
				email={user.email}
				name={user.name}
				avatarUrl={user.avatarUrl}
				markdown={markdown}
				chatActions={chatActions}
				isNarrow={isNarrow}
				canUseAi={canEdit}
			/>
			<div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
				{!canEdit && (
					<div className='border-b bg-amber-50 px-4 py-2 text-sm text-amber-900'>
						{access.role === 'commenter' ?
							'Commenter suggestion mode is not wired yet. This resume is currently read-only.'
						:	'You have view-only access to this resume.'}
					</div>
				)}
				<EditorToolbar
					resumeId={resume.id}
					title={title}
					saveStatus={saveStatus}
					onTitleChange={(v: string) => {
						if (!canEdit) return
						setTitle(v)
						handleTitleChange(v)
					}}
					markdown={markdown}
					onCompile={() => handleCompile(true)}
					isCompiling={previewLoading}
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
					isMarkActive={editorActions.isMarkActive}
					isListActive={editorActions.isListActive}
					onInsertTable={editorActions.insertTable}
					onInsertGrid={editorActions.insertGrid}
					onInsertDefList={editorActions.insertDefList}
					wordCount={wordCount}
					previewUrl={previewUrl}
					onDuplicate={access.canDuplicate ? handleDuplicate : undefined}
					onPrint={handlePrint}
					onOpenShare={
						access.canManageShare ? () => setShowShare(true) : undefined
					}
					onOpenCollaborators={
						access.canManageCollaborators ?
							() => setShowCollaborators(true)
						:	undefined
					}
					onOpenHistory={
						access.canRestoreSnapshots ? () => setShowHistory(true) : undefined
					}
					showPreview={showPreview}
					onTogglePreview={() => setShowPreview(v => !v)}
					isNarrow={isNarrow}
					accessRole={access.role}
					canEdit={canEdit}
					canManageCollaborators={access.canManageCollaborators}
				/>

				{isNarrow ?
					<div className='flex-1 min-h-0 overflow-hidden'>
						{showPreview ?
							<PdfPreview
								url={previewUrl}
								loading={previewLoading}
								error={previewError}
							/>
						:	<div className='h-full overflow-auto bg-background'>
								<MarkdownEditor
									value={body}
									onChange={handleChange}
									onActionsReady={handleActionsReady}
									onSelectionUpdate={handleSelectionUpdate}
									frontmatter={frontmatter}
									userIcons={userIcons}
									onFrontmatterUpdate={setFrontmatterAndSave}
									editable={canEdit}
								/>
							</div>
						}
					</div>
				:	<PanelGroup
						direction='horizontal'
						className='flex-1 min-h-0 overflow-hidden'
					>
						{/* Left: active editor */}
						<Panel defaultSize={50} minSize={30}>
							<div className='h-full overflow-auto border-r bg-background'>
								<MarkdownEditor
									value={body}
									onChange={handleChange}
									onActionsReady={handleActionsReady}
									onSelectionUpdate={handleSelectionUpdate}
									frontmatter={frontmatter}
									userIcons={userIcons}
									onFrontmatterUpdate={setFrontmatterAndSave}
									editable={canEdit}
								/>
							</div>
						</Panel>

						{showPreview && (
							<PanelResizeHandle className='w-1 bg-border hover:bg-foreground/20 transition-colors cursor-col-resize' />
						)}

						{/* Right: PDF preview */}
						{showPreview && (
							<Panel defaultSize={50} minSize={25}>
								<PdfPreview
									url={previewUrl}
									loading={previewLoading}
									error={previewError}
								/>
							</Panel>
						)}
					</PanelGroup>
				}
			</div>

			<VersionHistoryDialog
				resumeId={resume.id}
				open={showHistory}
				onClose={() => setShowHistory(false)}
				onRestore={handleRestore}
			/>
			<ShareDialog
				resumeId={resume.id}
				open={showShare}
				onClose={() => setShowShare(false)}
			/>
			<CollaboratorDialog
				resumeId={resume.id}
				open={showCollaborators}
				onClose={() => setShowCollaborators(false)}
				ownerEmail={user.email}
				ownerName={user.name || user.email}
				ownerAvatarUrl={user.avatarUrl}
				currentRole={access.role}
				canManage={access.canManageCollaborators}
			/>
		</div>
	)
}
