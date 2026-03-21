// Shared types for the editor UI

export type SaveStatus = 'saved' | 'saving' | 'error'

/** Actions exposed by the editor surface for the AI chat panel */
export interface ChatActions {
	/** Returns the current selection, or null if there is none */
	getSelection: () => { text: string; from: number; to: number } | null
	/** Replaces [from, to) in the document with newText and clears any pending diff */
	applyEdit: (from: number, to: number, newText: string) => void
	/** Shows a single green/red inline diff preview without committing the change */
	applyDiff: (from: number, to: number, replacement: string) => void
	/** Replaces the entire diffs list atomically (supports multiple simultaneous diffs) */
	applyDiffs: (
		diffs: { id: string; from: number; to: number; replacement: string }[],
	) => void
	/** Clears all inline diff previews */
	clearDiff: () => void
	/** Clears a single inline diff by its id */
	clearDiffById: (id: string) => void
}

export interface ResumeEditorSurfaceProps {
	value: string
	onChange: (value: string) => void
	className?: string
	/**
	 * Optional callback the surface can call to expose editor actions
	 * (used by the markdown editor to let surrounding UI toggle marks/lists, etc.)
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
		// AI chat helpers
		getSelection?: () => { text: string; from: number; to: number } | null
		applyEdit?: (from: number, to: number, newText: string) => void
		applyDiff?: (from: number, to: number, replacement: string) => void
		applyDiffs?: (
			diffs: { id: string; from: number; to: number; replacement: string }[],
		) => void
		clearDiff?: () => void
		clearDiffById?: (id: string) => void
	}) => void
	/** Fired whenever the editor selection changes – lets the shell re-render active-state buttons */
	onSelectionUpdate?: () => void
}

export interface PreviewMeta {
	warnings: string[]
	pageFit: string | null
}
