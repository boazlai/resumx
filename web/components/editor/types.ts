// Shared types for the editor UI

export type EditorMode = 'markdown' | 'wysiwyg'

export type SaveStatus = 'saved' | 'saving' | 'error'

export interface EditorToolbarProps {
	resumeId: string
	title: string
	saveStatus: SaveStatus
	editorMode: EditorMode
	onEditorModeChange: (mode: EditorMode) => void
	onTitleChange: (value: string) => void
	markdown: string
	onCompile: () => void
	isCompiling: boolean
	onSetAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
	onIncreaseIndent?: () => void
	onDecreaseIndent?: () => void
}

export interface ResumeEditorSurfaceProps {
	value: string
	onChange: (value: string) => void
	className?: string
	// Optional hook to expose actionable editor helpers to the toolbar/shell
	onActionsReady?: (actions: Record<string, (...args: any[]) => any>) => void
}

export interface PreviewMeta {
	warnings?: string[]
	pageFit?: string | null
}

// Helper: default editor mode resolver (client-only)
export const getInitialEditorMode = (): EditorMode => {
	try {
		const v = localStorage.getItem('resumx.editorMode')
		if (v === 'markdown' || v === 'wysiwyg') return v
	} catch (e) {
		// ignore
	}
	return 'markdown'
}
export type EditorMode = 'markdown' | 'wysiwyg'

export type SaveStatus = 'saved' | 'saving' | 'error'

export interface ResumeEditorSurfaceProps {
	value: string
	onChange: (value: string) => void
	className?: string
	/**
	 * Optional callback the surface can call to expose editor actions
	 * (used by the WYSIWYG editor to let surrounding UI toggle marks/lists, etc.)
	 */
	onActionsReady?: (actions: {
		toggleMark: (mark: 'bold' | 'italic' | 'underline') => void
		toggleList: (type: 'bullet' | 'ordered') => void
		setFontSize: (size: 'small' | 'normal' | 'large') => void
		clearFormatting: () => void
		// query helpers for UI active state
		isMarkActive: (mark: 'bold' | 'italic' | 'underline') => boolean
		isListActive: (type: 'bullet' | 'ordered') => boolean
	}) => void
}

export interface PreviewMeta {
	warnings: string[]
	pageFit: string | null
}
