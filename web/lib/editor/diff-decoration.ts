import {
	Decoration,
	type DecorationSet,
	EditorView,
	WidgetType,
} from '@codemirror/view'
import { StateEffect, StateField, type Range } from '@codemirror/state'

// ── Public types ─────────────────────────────────────────────────────────────

export interface DiffRange {
	/** Stable identifier used for per-diff clear */
	id: string
	/** Start position in the document */
	from: number
	/** End position of the OLD text (the range to be replaced) */
	to: number
	/** The new text to show as a green "insertion" preview */
	replacement: string
}

// ── Effects ──────────────────────────────────────────────────────────────────

/** Replace the entire diffs list atomically */
export const setDiffsEffect = StateEffect.define<DiffRange[]>()
/** Remove a single diff by its id */
export const clearDiffByIdEffect = StateEffect.define<string>()
/** Clear all diffs */
export const clearDiffEffect = StateEffect.define<null>()
/** Backward-compat single-diff helper — replaces list with one item */
export const setDiffEffect = StateEffect.define<DiffRange>()

// ── Global diff-action callback registry ────────────────────────────────────
// CodeMirror widgets are plain DOM — they can't close over React state.
// The chat panel registers callbacks here; widgets look them up by diff id.

type DiffActionCallbacks = { onAccept: () => void; onReject: () => void }
const diffActionRegistry = new Map<string, DiffActionCallbacks>()

export function registerDiffActions(id: string, cb: DiffActionCallbacks) {
	diffActionRegistry.set(id, cb)
}

export function unregisterDiffActions(id: string) {
	diffActionRegistry.delete(id)
}

// ── Inline accept / reject widget ────────────────────────────────────────────

class DiffActionWidget extends WidgetType {
	constructor(readonly id: string) {
		super()
	}

	eq(other: DiffActionWidget) {
		return other.id === this.id
	}

	toDOM() {
		const wrap = document.createElement('span')
		wrap.style.cssText =
			'display:inline-flex;align-items:center;gap:2px;margin-left:4px;vertical-align:middle;'

		const acceptBtn = document.createElement('button')
		acceptBtn.type = 'button'
		acceptBtn.title = 'Accept change'
		acceptBtn.textContent = '✓'
		acceptBtn.style.cssText =
			'display:inline-flex;align-items:center;justify-content:center;'
			+ 'width:17px;height:17px;border-radius:3px;cursor:pointer;padding:0;'
			+ 'border:1px solid rgba(34,197,94,0.45);background:rgba(34,197,94,0.15);'
			+ 'color:rgb(22,163,74);font-size:11px;line-height:1;'
		acceptBtn.addEventListener('mousedown', e => {
			e.preventDefault()
			e.stopPropagation()
			diffActionRegistry.get(this.id)?.onAccept()
		})

		const rejectBtn = document.createElement('button')
		rejectBtn.type = 'button'
		rejectBtn.title = 'Reject change'
		rejectBtn.textContent = '✕'
		rejectBtn.style.cssText =
			'display:inline-flex;align-items:center;justify-content:center;'
			+ 'width:17px;height:17px;border-radius:3px;cursor:pointer;padding:0;'
			+ 'border:1px solid rgba(239,68,68,0.45);background:rgba(239,68,68,0.15);'
			+ 'color:rgb(220,38,38);font-size:11px;line-height:1;'
		rejectBtn.addEventListener('mousedown', e => {
			e.preventDefault()
			e.stopPropagation()
			diffActionRegistry.get(this.id)?.onReject()
		})

		wrap.appendChild(acceptBtn)
		wrap.appendChild(rejectBtn)
		return wrap
	}

	// Allow mouse events so the buttons are clickable
	ignoreEvent() {
		return false
	}
}

// ── Insertion widget (green) ─────────────────────────────────────────────────

class InsertionWidget extends WidgetType {
	constructor(readonly text: string) {
		super()
	}

	toDOM() {
		const el = document.createElement('span')
		el.textContent = this.text
		el.className = 'cm-diff-add'
		return el
	}

	eq(other: InsertionWidget) {
		return other.text === this.text
	}

	ignoreEvent() {
		return true
	}
}

// ── State field ───────────────────────────────────────────────────────────────

export const diffField = StateField.define<DiffRange[]>({
	create: () => [],

	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setDiffsEffect)) return effect.value
			if (effect.is(clearDiffEffect)) return []
			if (effect.is(clearDiffByIdEffect))
				return value.filter(d => d.id !== effect.value)
			if (effect.is(setDiffEffect)) return [effect.value]
		}
		// Shift positions when document changes so decorations stay aligned
		if (tr.docChanged && value.length > 0) {
			return value.map(d => ({
				...d,
				from: tr.changes.mapPos(d.from),
				to: tr.changes.mapPos(d.to),
			}))
		}
		return value
	},

	provide(field) {
		return EditorView.decorations.from(field, diffs => {
			if (!diffs.length) return Decoration.none as DecorationSet

			const decos: Range<Decoration>[] = []

			for (const { id, from, to, replacement } of diffs) {
				// Red mark over deleted range
				if (from < to) {
					decos.push(Decoration.mark({ class: 'cm-diff-del' }).range(from, to))
				}

				// Green widget for inserted text, rendered before the deleted range
				if (replacement) {
					decos.push(
						Decoration.widget({
							widget: new InsertionWidget(replacement),
							side: -1,
						}).range(from),
					)
				}

				// Accept / reject buttons — shown after the diff, only for named diffs
				if (id && id !== '__streaming__') {
					decos.push(
						Decoration.widget({
							widget: new DiffActionWidget(id),
							side: 1,
						}).range(to > from ? to : from),
					)
				}
			}

			// Decoration.set requires sorted ranges; true = sort for us
			return Decoration.set(decos, true) as DecorationSet
		})
	},
})

// ── Theme ─────────────────────────────────────────────────────────────────────

export const diffTheme = EditorView.baseTheme({
	'.cm-diff-del': {
		backgroundColor: 'rgba(239, 68, 68, 0.2)',
		textDecoration: 'line-through',
		borderRadius: '2px',
	},
	'.cm-diff-add': {
		backgroundColor: 'rgba(34, 197, 94, 0.25)',
		borderRadius: '2px',
		padding: '0 1px',
		whiteSpace: 'pre-wrap',
	},
})
