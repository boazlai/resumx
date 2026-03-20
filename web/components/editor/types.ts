// Shared types for the editor UI

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
		toggleMark: (mark: 'bold' | 'italic' | 'underline' | 'strike') => void
		toggleList: (type: 'bullet' | 'ordered') => void
		setFontSize: (size: 'small' | 'normal' | 'large') => void
		setHeader?: (level: number) => void
		setFont?: (font: string) => void
		setColor?: (hex: string) => void
		setHighlight?: (hex: string) => void
		clearFormatting: () => void
		setAlign?: (a: 'left' | 'center' | 'right' | 'justify') => void
		increaseIndent?: () => void
		decreaseIndent?: () => void
		// query helpers for UI active state
		isMarkActive: (mark: 'bold' | 'italic' | 'underline' | 'strike') => boolean
		isListActive: (type: 'bullet' | 'ordered') => boolean
		// structure insertion (primary in markdown mode)
		insertTable?: (rows: number, cols: number) => void
		insertGrid?: (cols: number) => void
		insertDefList?: () => void
	}) => void
	/** Fired whenever the editor selection changes – lets the shell re-render active-state buttons */
	onSelectionUpdate?: () => void
}

export interface PreviewMeta {
	warnings: string[]
	pageFit: string | null
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
