import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from '@codemirror/view'
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'

// ────────────────────────────────────────────────────────────────────────────
// Public types / effects / state field
// ────────────────────────────────────────────────────────────────────────────

export interface SpanPopoverInfo {
	/** Start of the entire <span …>…</span> in the document */
	from: number
	/** End of the entire <span …>…</span> in the document */
	to: number
	/** The style attribute string, e.g. "background-color: #ffff00; color: #ff0000" */
	styleStr: string
	/** The inner text between the opening and closing tags */
	innerText: string
	/** Viewport-relative x (left of the dot widget) */
	x: number
	/** Viewport-relative y (bottom of the dot widget) */
	y: number
}

export const openSpanPopover = StateEffect.define<SpanPopoverInfo>()
export const closeSpanPopover = StateEffect.define<null>()

/** Holds the currently-open popover info, or null when closed. */
export const spanPopoverField = StateField.define<SpanPopoverInfo | null>({
	create: () => null,
	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(openSpanPopover)) return effect.value
			if (effect.is(closeSpanPopover)) return null
		}
		// Auto-close when the document changes so stale positions are never used
		if (tr.docChanged) return null
		return value
	},
})

// ────────────────────────────────────────────────────────────────────────────
// Span parsing
// ────────────────────────────────────────────────────────────────────────────

interface ParsedSpan {
	outerFrom: number
	innerFrom: number
	innerTo: number
	outerTo: number
	styleStr: string
}

/**
 * Stack-based parser that correctly handles nested spans.
 * Returns spans sorted by outerFrom ascending.
 */
function findSpans(doc: string): ParsedSpan[] {
	const events: Array<
		| { type: 'open'; from: number; to: number; styleStr: string }
		| { type: 'close'; from: number; to: number }
	> = []

	const openRe = /<span\s+style="([^"]*)"\s*>/g
	const closeRe = /<\/span>/g

	let m: RegExpExecArray | null

	openRe.lastIndex = 0
	while ((m = openRe.exec(doc)) !== null) {
		events.push({
			type: 'open',
			from: m.index,
			to: m.index + m[0].length,
			styleStr: m[1],
		})
	}

	closeRe.lastIndex = 0
	while ((m = closeRe.exec(doc)) !== null) {
		events.push({ type: 'close', from: m.index, to: m.index + m[0].length })
	}

	events.sort((a, b) => a.from - b.from)

	const spans: ParsedSpan[] = []
	const stack: { from: number; to: number; styleStr: string }[] = []

	for (const ev of events) {
		if (ev.type === 'open') {
			stack.push({ from: ev.from, to: ev.to, styleStr: ev.styleStr })
		} else {
			const open = stack.pop()
			if (open) {
				spans.push({
					outerFrom: open.from,
					innerFrom: open.to,
					innerTo: ev.from,
					outerTo: ev.to,
					styleStr: open.styleStr,
				})
			}
		}
	}

	return spans
}

/** Extract the most visually representative color from a style string for the dot. */
function extractDotColor(styleStr: string): string {
	const bgMatch = styleStr.match(/background-color:\s*([^;]+)/i)
	if (bgMatch) return bgMatch[1].trim()
	// Match "color:" but not "background-color:"
	const colorMatch = styleStr.match(/(?<![a-z-])color:\s*([^;]+)/i)
	if (colorMatch) return colorMatch[1].trim()
	return 'hsl(var(--muted-foreground, #888))'
}

// ────────────────────────────────────────────────────────────────────────────
// Dot widget
// ────────────────────────────────────────────────────────────────────────────

class SpanTagWidget extends WidgetType {
	constructor(
		private readonly spanFrom: number,
		private readonly spanTo: number,
		private readonly styleStr: string,
		private readonly innerText: string,
		private readonly dotColor: string,
	) {
		super()
	}

	eq(other: SpanTagWidget): boolean {
		return (
			other.spanFrom === this.spanFrom
			&& other.spanTo === this.spanTo
			&& other.styleStr === this.styleStr
		)
	}

	toDOM(view: EditorView): HTMLElement {
		const btn = document.createElement('button')
		btn.type = 'button'
		btn.title = 'Click to edit inline style'
		btn.setAttribute('aria-label', 'Edit inline style')
		Object.assign(btn.style, {
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '8px',
			height: '8px',
			borderRadius: '50%',
			background: this.dotColor,
			border: '1.5px solid rgba(0,0,0,0.3)',
			cursor: 'pointer',
			verticalAlign: 'middle',
			marginRight: '1px',
			padding: '0',
			flexShrink: '0',
			position: 'relative',
			top: '-1px',
			outline: 'none',
		})

		btn.addEventListener('mousedown', e => {
			e.preventDefault()
			e.stopPropagation()
			const rect = btn.getBoundingClientRect()
			view.dispatch({
				effects: openSpanPopover.of({
					from: this.spanFrom,
					to: this.spanTo,
					styleStr: this.styleStr,
					innerText: this.innerText,
					x: rect.left,
					y: rect.bottom + 6,
				}),
			})
		})

		return btn
	}

	/** Prevent CodeMirror from treating button events as selection changes */
	ignoreEvent() {
		return false
	}
}

// ────────────────────────────────────────────────────────────────────────────
// ViewPlugin — builds decorations on every doc / viewport change
// ────────────────────────────────────────────────────────────────────────────

export const htmlSpanDecorator = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view)
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = this.buildDecorations(update.view)
			}
		}

		buildDecorations(view: EditorView): DecorationSet {
			const doc = view.state.doc.toString()
			const spans = findSpans(doc)

			// Collect all decoration entries first, then sort.
			// RangeSetBuilder requires from values to be non-decreasing;
			// for equal from, smaller to must come first.
			const entries: { from: number; to: number; deco: Decoration }[] = []

			for (const span of spans) {
				const dotColor = extractDotColor(span.styleStr)
				const innerText = doc.slice(span.innerFrom, span.innerTo)

				// 1. Replace opening tag → dot widget
				entries.push({
					from: span.outerFrom,
					to: span.innerFrom,
					deco: Decoration.replace({
						widget: new SpanTagWidget(
							span.outerFrom,
							span.outerTo,
							span.styleStr,
							innerText,
							dotColor,
						),
					}),
				})

				// 2. Mark inner content with the actual CSS (visual preview)
				if (span.innerFrom < span.innerTo) {
					entries.push({
						from: span.innerFrom,
						to: span.innerTo,
						deco: Decoration.mark({ attributes: { style: span.styleStr } }),
					})
				}

				// 3. Replace closing tag → nothing
				entries.push({
					from: span.innerTo,
					to: span.outerTo,
					deco: Decoration.replace({}),
				})
			}

			// Sort: from asc, tie-break by to asc
			entries.sort((a, b) =>
				a.from !== b.from ? a.from - b.from : a.to - b.to,
			)

			const builder = new RangeSetBuilder<Decoration>()
			for (const { from, to, deco } of entries) {
				builder.add(from, to, deco)
			}

			return builder.finish()
		}
	},
	{ decorations: v => v.decorations },
)
