import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
} from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { RangeSet, RangeSetBuilder } from '@codemirror/state'

// ── Decorations ───────────────────────────────────────────────────────────────
const hideDeco = Decoration.replace({})
const boldDeco = Decoration.mark({ attributes: { style: 'font-weight: bold' } })
const italicDeco = Decoration.mark({
	attributes: { style: 'font-style: italic' },
})
const strikeDeco = Decoration.mark({
	attributes: { style: 'text-decoration: line-through' },
})
const underlineDeco = Decoration.mark({
	attributes: { style: 'text-decoration: underline' },
})

type Pos = { from: number; to: number }

/**
 * Build a DecorationSet from same-typed, possibly unsorted entries.
 * Sorts, then skips any range that overlaps the previous (dedup).
 */
function makeSet(entries: Pos[], deco: Decoration): DecorationSet {
	if (!entries.length) return Decoration.none
	entries.sort((a, b) => a.from - b.from)
	const builder = new RangeSetBuilder<Decoration>()
	let lastTo = -1
	for (const e of entries) {
		if (e.from >= lastTo && e.to > e.from) {
			builder.add(e.from, e.to, deco)
			lastTo = e.to
		}
	}
	return builder.finish()
}

// ── Pass 1: markdown syntax tree (bold / italic / strikethrough) ──────────────
function fromSyntaxTree(view: EditorView) {
	const { state } = view
	const tree = syntaxTree(state)
	const sel = state.selection
	const hides: Pos[] = []
	const bold: Pos[] = []
	const italic: Pos[] = []
	const strike: Pos[] = []

	tree.cursor().iterate(node => {
		const cursorIn = sel.ranges.some(r => r.from < node.to && r.to > node.from)

		if (
			node.name === 'StrongEmphasis'
			|| node.name === 'Emphasis'
			|| node.name === 'Strikethrough'
		) {
			if (cursorIn) return
			const first = node.node.firstChild
			const last = node.node.lastChild
			if (!first || !last || first.from === last.from) return
			const inner: Pos = { from: first.to, to: last.from }
			if (inner.from >= inner.to) return
			if (node.name === 'StrongEmphasis') bold.push(inner)
			else if (node.name === 'Emphasis') italic.push(inner)
			else strike.push(inner)
			return
		}

		if (node.name === 'EmphasisMark' || node.name === 'StrikethroughMark') {
			const parent = node.node.parent
			const parentIn =
				parent ?
					sel.ranges.some(r => r.from < parent.to && r.to > parent.from)
				:	cursorIn
			if (!parentIn) hides.push({ from: node.from, to: node.to })
		}
	})

	return { hides, bold, italic, strike }
}

// ── Pass 2: inline HTML tags <b> <i> <u> <s> <strong> <em> <del> ─────────────
const TAG_MAP: Record<string, 'bold' | 'italic' | 'strike' | 'underline'> = {
	b: 'bold',
	strong: 'bold',
	i: 'italic',
	em: 'italic',
	u: 'underline',
	s: 'strike',
	del: 'strike',
	strike: 'strike',
}

function fromHtmlTags(view: EditorView) {
	const { state } = view
	const sel = state.selection
	const doc = state.doc.toString()
	const hides: Pos[] = []
	const bold: Pos[] = []
	const italic: Pos[] = []
	const strike: Pos[] = []
	const underline: Pos[] = []

	const keys = Object.keys(TAG_MAP).join('|')
	const re = new RegExp(`<(${keys})(?:\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>`, 'gi')
	let m: RegExpExecArray | null

	while ((m = re.exec(doc)) !== null) {
		const tag = m[1].toLowerCase()
		const fullStart = m.index
		const fullEnd = m.index + m[0].length
		const openEnd = fullStart + m[0].indexOf('>') + 1
		const closeStart = fullStart + m[0].lastIndexOf('<')
		if (openEnd >= closeStart) continue

		const cursorIn = sel.ranges.some(r => r.from < fullEnd && r.to > fullStart)
		if (cursorIn) continue

		hides.push({ from: fullStart, to: openEnd })
		hides.push({ from: closeStart, to: fullEnd })
		const inner: Pos = { from: openEnd, to: closeStart }

		const bucket = TAG_MAP[tag]
		if (bucket === 'bold') bold.push(inner)
		else if (bucket === 'italic') italic.push(inner)
		else if (bucket === 'strike') strike.push(inner)
		else underline.push(inner)
	}

	return { hides, bold, italic, strike, underline }
}

// ── Combine both passes ───────────────────────────────────────────────────────
function buildDecorations(view: EditorView): DecorationSet {
	const md = fromSyntaxTree(view)
	const html = fromHtmlTags(view)

	const sets: DecorationSet[] = [
		makeSet([...md.hides, ...html.hides], hideDeco),
		makeSet([...md.bold, ...html.bold], boldDeco),
		makeSet([...md.italic, ...html.italic], italicDeco),
		makeSet([...md.strike, ...html.strike], strikeDeco),
		makeSet(html.underline, underlineDeco),
	].filter(s => s !== Decoration.none)

	return sets.length ? RangeSet.join(sets) : Decoration.none
}

export const markdownInlineDecorator = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet
		constructor(view: EditorView) {
			this.decorations = buildDecorations(view)
		}
		update(update: ViewUpdate) {
			if (update.docChanged || update.selectionSet || update.viewportChanged) {
				this.decorations = buildDecorations(update.view)
			}
		}
	},
	{ decorations: v => v.decorations },
)
