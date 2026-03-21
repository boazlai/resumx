'use client'

import { useEffect, useRef, useState } from 'react'
import {
	EditorView,
	keymap,
	highlightActiveLine,
	lineNumbers,
} from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
	syntaxHighlighting,
	HighlightStyle,
	syntaxTree,
} from '@codemirror/language'
import { tags } from '@lezer/highlight'
import {
	iconAutoInsert,
	iconAutoInsertConfig,
} from '@/lib/editor/icon-auto-insert'
import {
	htmlSpanDecorator,
	spanPopoverField,
	type SpanPopoverInfo,
} from '@/lib/editor/html-span-decorator'
import { SpanStylePopover } from './span-style-popover'
import { markdownInlineDecorator } from '@/lib/editor/markdown-inline-decorator'
import {
	diffField,
	diffTheme,
	setDiffsEffect,
	setDiffEffect,
	clearDiffEffect,
	clearDiffByIdEffect,
} from '@/lib/editor/diff-decoration'
import type { ResumeEditorSurfaceProps } from './types'

// Syntax highlight style — uses CSS variables so every theme (light/dark/Catppuccin…)
// gets appropriate colours. The built-in defaultHighlightStyle hard-codes a dark navy
// (#219) for links and list markers which becomes invisible on dark backgrounds.
const markdownHighlight = HighlightStyle.define([
	// Heading lines (includes the ## markers)
	{ tag: tags.heading1, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	{ tag: tags.heading2, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	{ tag: tags.heading3, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	{ tag: tags.heading4, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	{ tag: tags.heading5, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	{ tag: tags.heading6, color: 'hsl(var(--foreground))', fontWeight: 'bold' },
	// List markers (-, *, 1.)
	{ tag: tags.list, color: 'hsl(var(--muted-foreground))' },
	// Links and URLs
	{ tag: tags.link, color: 'hsl(var(--primary))', textDecoration: 'underline' },
	{ tag: tags.url, color: 'hsl(var(--primary))' },
	// Inline emphasis
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strong, fontWeight: 'bold' },
	// Inline code
	{ tag: tags.monospace, fontFamily: 'monospace' },
	// Punctuation / markers (e.g. **, *, _)
	{ tag: tags.punctuation, color: 'hsl(var(--muted-foreground))' },
	// YAML frontmatter / meta
	{ tag: tags.meta, color: 'hsl(var(--muted-foreground))' },
	{
		tag: tags.comment,
		color: 'hsl(var(--muted-foreground))',
		fontStyle: 'italic',
	},
])

// Coding-editor theme matching our CSS design tokens.
const lightTheme = EditorView.theme({
	'&': {
		height: '100%',
		fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
		fontSize: '13px',
		backgroundColor: 'transparent',
		color: 'hsl(var(--foreground))',
	},
	'.cm-scroller': {
		padding: '0',
		alignItems: 'flex-start',
	},
	'.cm-content': {
		padding: '16px 16px',
		caretColor: 'hsl(var(--foreground))',
	},
	'.cm-line': { lineHeight: '1.65' },
	'.cm-activeLine': { backgroundColor: 'hsl(var(--accent) / 0.35)' },
	'.cm-gutters': {
		backgroundColor: 'hsl(var(--background))',
		color: 'hsl(var(--muted-foreground))',
		border: 'none',
		borderRight: '1px solid hsl(var(--border))',
		paddingRight: '8px',
	},
	'.cm-activeLineGutter': { backgroundColor: 'hsl(var(--accent) / 0.35)' },
	'&.cm-focused .cm-cursor': { borderLeftColor: 'hsl(var(--foreground))' },
	'&.cm-focused': { outline: 'none' },
})

interface MarkdownEditorProps extends ResumeEditorSurfaceProps {
	/** Current YAML frontmatter (without --- fences) for icon auto-insert */
	frontmatter?: string
	/** User-uploaded icons (name → URL) for icon auto-insert */
	userIcons?: Map<string, string>
	/** Callback to update frontmatter when icons are auto-detected */
	onFrontmatterUpdate?: (newFrontmatter: string) => void
}

export function MarkdownEditor({
	value,
	onChange,
	onActionsReady,
	onSelectionUpdate,
	frontmatter,
	userIcons,
	onFrontmatterUpdate,
}: MarkdownEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const iconConfigCompartment = useRef(new Compartment())
	const [popoverInfo, setPopoverInfo] = useState<SpanPopoverInfo | null>(null)

	useEffect(() => {
		if (!containerRef.current) return

		const startState = EditorState.create({
			doc: value,
			extensions: [
				history(),
				highlightActiveLine(),
				lineNumbers(),
				markdown(),
				syntaxHighlighting(markdownHighlight),
				lightTheme,
				keymap.of([...defaultKeymap, ...historyKeymap]),
				EditorView.updateListener.of(update => {
					if (update.docChanged) {
						onChange(update.state.doc.toString())
					}
					if (update.selectionSet) {
						onSelectionUpdate?.()
					}
					// Bridge CodeMirror popover state → React
					const prev = update.startState.field(spanPopoverField)
					const next = update.state.field(spanPopoverField)
					if (prev !== next) setPopoverInfo(next)
				}),
				EditorView.lineWrapping,
				markdownInlineDecorator,
				htmlSpanDecorator,
				spanPopoverField,
				diffField,
				diffTheme,
				iconAutoInsert,
				iconConfigCompartment.current.of(
					iconAutoInsertConfig.of({
						frontmatter: frontmatter ?? '',
						userIcons: userIcons ?? new Map(),
						onUpdate: onFrontmatterUpdate ?? (() => {}),
					}),
				),
			],
		})

		const view = new EditorView({
			state: startState,
			parent: containerRef.current,
		})

		viewRef.current = view

		return () => {
			view.destroy()
			viewRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // mount once

	// Sync external value changes (e.g. import) without resetting history
	useEffect(() => {
		const view = viewRef.current
		if (!view) return
		const current = view.state.doc.toString()
		if (current !== value) {
			view.dispatch({
				changes: { from: 0, to: current.length, insert: value },
			})
		}
	}, [value])

	// Reconfigure icon auto-insert when frontmatter or user icons change
	useEffect(() => {
		const view = viewRef.current
		if (!view) return
		view.dispatch({
			effects: iconConfigCompartment.current.reconfigure(
				iconAutoInsertConfig.of({
					frontmatter: frontmatter ?? '',
					userIcons: userIcons ?? new Map(),
					onUpdate: onFrontmatterUpdate ?? (() => {}),
				}),
			),
		})
	}, [frontmatter, userIcons, onFrontmatterUpdate])

	// Expose simple action helpers for toolbar
	useEffect(() => {
		const view = viewRef.current
		if (!view || !onActionsReady) return

		const wrapSelection = (before: string, after = before) => {
			const state = view.state
			const { from, to } = state.selection.main
			const selected = state.doc.sliceString(from, to)
			const insert = `${before}${selected}${after}`
			view.dispatch({
				changes: { from, to, insert },
				selection: {
					anchor: from + before.length,
					head: from + before.length + selected.length,
				},
			})
			view.focus()
		}

		const removeWrapping = (prefix: string, suffix = prefix) => {
			const state = view.state
			const { from, to } = state.selection.main
			const selected = state.doc.sliceString(from, to)
			// naive removal if selection already wrapped
			if (selected.startsWith(prefix) && selected.endsWith(suffix)) {
				const inner = selected.slice(
					prefix.length,
					selected.length - suffix.length,
				)
				view.dispatch({
					changes: { from, to, insert: inner },
					selection: { anchor: from, head: from + inner.length },
				})
				view.focus()
				return true
			}
			return false
		}

		const actions = {
			toggleMark: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				if (!view) return
				const markSyntax: Record<string, [string, string]> = {
					bold: ['**', '**'],
					italic: ['_', '_'],
					strike: ['~~', '~~'],
					underline: ['<u>', '</u>'],
				}
				const [prefix, suffix] = markSyntax[mark]
				const state = view.state
				const { from, to } = state.selection.main
				const selected = state.doc.sliceString(from, to)
				const docLen = state.doc.length

				// Case 1: selection already wraps the markers — strip them
				if (
					selected.startsWith(prefix)
					&& selected.endsWith(suffix)
					&& selected.length >= prefix.length + suffix.length
				) {
					const inner = selected.slice(
						prefix.length,
						selected.length - suffix.length,
					)
					view.dispatch({
						changes: { from, to, insert: inner },
						selection: { anchor: from, head: from + inner.length },
					})
					view.focus()
					return
				}

				// Case 2: markers are just outside the selection — strip them
				const before = state.doc.sliceString(
					Math.max(0, from - prefix.length),
					from,
				)
				const after = state.doc.sliceString(
					to,
					Math.min(docLen, to + suffix.length),
				)
				if (before === prefix && after === suffix) {
					view.dispatch({
						changes: [
							{ from: from - prefix.length, to: from, insert: '' },
							{ from: to, to: to + suffix.length, insert: '' },
						],
						selection: {
							anchor: from - prefix.length,
							head: to - prefix.length,
						},
					})
					view.focus()
					return
				}

				// Default: wrap the selection
				wrapSelection(prefix, suffix)
			},
			toggleList: (type: 'bullet' | 'ordered') => {
				const state = view.state
				const { from, to } = state.selection.main
				const docText = state.doc.toString()
				// operate on full lines
				const startLine = state.doc.lineAt(from)
				const endLine = state.doc.lineAt(to)
				const changes = [] as any[]
				for (let n = startLine.number; n <= endLine.number; n++) {
					const line = state.doc.line(n)
					if (type === 'bullet') {
						changes.push({ from: line.from, to: line.from, insert: '- ' })
					} else {
						changes.push({ from: line.from, to: line.from, insert: '1. ' })
					}
				}
				view.dispatch({ changes })
				view.focus()
			},
			setHeader: (level: number) => {
				const state = view.state
				const { from, to } = state.selection.main
				const startLine = state.doc.lineAt(from)
				const endLine = state.doc.lineAt(to)
				const changes = [] as any[]
				for (let n = startLine.number; n <= endLine.number; n++) {
					const line = state.doc.line(n)
					// remove existing leading hashes
					const text = line.text.replace(/^#{1,6}\s*/, '')
					const prefix = level === 0 ? '' : '#'.repeat(level) + ' '
					changes.push({ from: line.from, to: line.to, insert: prefix + text })
				}
				view.dispatch({ changes })
				view.focus()
			},
			clearFormatting: () => {
				const state = view.state
				const { from, to } = state.selection.main
				const selected = state.doc.sliceString(from, to)
				// remove common markdown markers and simple HTML spans
				const cleaned = selected
					.replace(/\*\*(.*?)\*\*/gs, '$1')
					.replace(/~~(.*?)~~/gs, '$1')
					.replace(/_(.*?)_/gs, '$1')
					.replace(/<u>(.*?)<\/u>/gs, '$1')
					.replace(/<span[^>]*>(.*?)<\/span>/gs, '$1')
				view.dispatch({
					changes: { from, to, insert: cleaned },
					selection: { anchor: from, head: from + cleaned.length },
				})
				view.focus()
			},
			setAlign: (a: 'left' | 'center' | 'right' | 'justify') => {
				const state = view.state
				const { from, to } = state.selection.main
				const startLine = state.doc.lineAt(from)
				const endLine = state.doc.lineAt(to)
				const lines: string[] = []
				for (let n = startLine.number; n <= endLine.number; n++) {
					const line = state.doc.line(n)
					lines.push(line.text)
				}
				const wrapped = `<div style="text-align: ${a};">${lines.join('\n')}</div>`
				view.dispatch({
					changes: { from: startLine.from, to: endLine.to, insert: wrapped },
					selection: {
						anchor: startLine.from,
						head: startLine.from + wrapped.length,
					},
				})
				view.focus()
			},
			increaseIndent: () => {
				const state = view.state
				const { from, to } = state.selection.main
				const startLine = state.doc.lineAt(from)
				const endLine = state.doc.lineAt(to)
				const changes = [] as any[]
				for (let n = startLine.number; n <= endLine.number; n++) {
					const line = state.doc.line(n)
					changes.push({ from: line.from, to: line.from, insert: '  ' })
				}
				view.dispatch({ changes })
				view.focus()
			},
			decreaseIndent: () => {
				const state = view.state
				const { from, to } = state.selection.main
				const startLine = state.doc.lineAt(from)
				const endLine = state.doc.lineAt(to)
				const changes = [] as any[]
				for (let n = startLine.number; n <= endLine.number; n++) {
					const line = state.doc.line(n)
					const prefix =
						line.text.startsWith('  ') ?
							{ from: line.from, to: line.from + 2, insert: '' }
						:	null
					if (prefix) changes.push(prefix)
				}
				if (changes.length) view.dispatch({ changes })
				view.focus()
			},
			setFont: (font: string) => {
				const state = view.state
				const { from, to } = state.selection.main
				const selected = state.doc.sliceString(from, to)
				const wrapped = `<span style="font-family: ${font};">${selected}</span>`
				view.dispatch({
					changes: { from, to, insert: wrapped },
					selection: { anchor: from, head: from + wrapped.length },
				})
				view.focus()
			},
			setColor: (hex: string) => {
				const state = view.state
				const { from, to } = state.selection.main
				const selected = state.doc.sliceString(from, to)
				const wrapped = `<span style="color: ${hex};">${selected}</span>`
				view.dispatch({
					changes: { from, to, insert: wrapped },
					selection: { anchor: from, head: from + wrapped.length },
				})
				view.focus()
			},
			setHighlight: (hex: string) => {
				const state = view.state
				const { from, to } = state.selection.main
				const selected = state.doc.sliceString(from, to)
				const wrapped = `<span style="background-color: ${hex};">${selected}</span>`
				view.dispatch({
					changes: { from, to, insert: wrapped },
					selection: { anchor: from, head: from + wrapped.length },
				})
				view.focus()
			},
			setFontSize: (_size: 'small' | 'normal' | 'large') => {},
			isMarkActive: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				const state = view.state
				const pos = state.selection.main.from
				if (mark === 'underline') {
					// HTML underline: scan current line for <u>...</u> containing cursor
					const line = state.doc.lineAt(pos)
					const text = line.text
					const offset = pos - line.from
					let idx = 0
					while (true) {
						const openIdx = text.indexOf('<u>', idx)
						if (openIdx === -1 || openIdx > offset) break
						const closeIdx = text.indexOf('</u>', openIdx + 3)
						if (closeIdx === -1) break
						if (offset <= closeIdx + 4) return true
						idx = closeIdx + 4
					}
					return false
				}
				const nodeNames: Record<string, string> = {
					bold: 'StrongEmphasis',
					italic: 'Emphasis',
					strike: 'Strikethrough',
				}
				const typeName = nodeNames[mark]
				if (!typeName) return false
				const tree = syntaxTree(state)
				let node = tree.resolve(pos, -1)
				while (node) {
					if (node.type.name === typeName) return true
					if (!node.parent) break
					node = node.parent
				}
				return false
			},
			isListActive: (_type: 'bullet' | 'ordered') => false,
			insertTable: (rows: number, cols: number) => {
				const state = view.state
				const { from } = state.selection.main
				const headers = Array.from(
					{ length: cols },
					(_, i) => `Col ${i + 1}`,
				).join(' | ')
				const separator = Array.from({ length: cols }, () => '-------').join(
					' | ',
				)
				const dataRow =
					'| '
					+ Array.from({ length: cols }, () => '       ').join(' | ')
					+ ' |'
				const table = [
					`| ${headers} |`,
					`| ${separator} |`,
					...Array.from({ length: rows }, () => dataRow),
				].join('\n')
				const insert = `\n${table}\n`
				view.dispatch({
					changes: { from, to: from, insert },
					selection: { anchor: from + insert.length },
				})
				view.focus()
			},
			insertGrid: (cols: number) => {
				const state = view.state
				const { from, to } = state.selection.main
				if (from !== to) {
					const startLine = state.doc.lineAt(from)
					const endLine = state.doc.lineAt(to)
					const bullets = state.doc
						.sliceString(startLine.from, endLine.to)
						.split('\n')
						.filter(l => l.trim())
						.map(l => (l.trim().startsWith('- ') ? l.trim() : `- ${l.trim()}`))
						.join('\n')
					const wrapped = `::: {.grid .grid-cols-${cols}}\n${bullets}\n:::`
					view.dispatch({
						changes: { from: startLine.from, to: endLine.to, insert: wrapped },
						selection: {
							anchor: startLine.from,
							head: startLine.from + wrapped.length,
						},
					})
				} else {
					const template = `::: {.grid .grid-cols-${cols}}\n- Item 1\n- Item 2\n- Item 3\n:::`
					const insert = `\n${template}\n`
					view.dispatch({
						changes: { from, to: from, insert },
						selection: { anchor: from + 1, head: from + template.length + 1 },
					})
				}
				view.focus()
			},
			// AI chat helpers
			getSelection: () => {
				const state = view.state
				const { from, to } = state.selection.main
				if (from === to) return null
				return { text: state.doc.sliceString(from, to), from, to }
			},
			applyEdit: (from: number, to: number, newText: string) => {
				view.dispatch({
					changes: { from, to, insert: newText },
					selection: { anchor: from, head: from + newText.length },
				})
				view.focus()
			},
			applyDiff: (from: number, to: number, replacement: string) => {
				view.dispatch({
					effects: setDiffsEffect.of([{ id: 'single', from, to, replacement }]),
				})
			},
			applyDiffs: (
				diffs: { id: string; from: number; to: number; replacement: string }[],
			) => {
				view.dispatch({
					effects: setDiffsEffect.of(diffs),
				})
			},
			clearDiff: () => {
				view.dispatch({
					effects: clearDiffEffect.of(null),
				})
			},
			clearDiffById: (id: string) => {
				view.dispatch({
					effects: clearDiffByIdEffect.of(id),
				})
			},
			insertDefList: () => {
				const state = view.state
				const { from, to } = state.selection.main
				if (from !== to) {
					const converted = state.doc
						.sliceString(from, to)
						.split('\n')
						.filter(l => l.trim())
						.map(line => {
							const colonIdx = line.indexOf(':')
							if (colonIdx > 0) {
								const term = line.slice(0, colonIdx).trim()
								const values = line.slice(colonIdx + 1).trim()
								return `${term}\n: ${values}`
							}
							return `${line.trim()}\n: `
						})
						.join('\n\n')
					view.dispatch({
						changes: { from, to, insert: converted },
						selection: { anchor: from, head: from + converted.length },
					})
				} else {
					const insert = `\nTerm\n: Values\n`
					view.dispatch({
						changes: { from, to: from, insert },
						selection: { anchor: from + 1 },
					})
				}
				view.focus()
			},
		}

		onActionsReady(actions)
		// Keyboard shortcuts for common formatting when editor has focus
		const dom = containerRef.current
		const handler = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey
			if (!mod) return
			const k = e.key.toLowerCase()
			if (k === 'b') {
				e.preventDefault()
				actions.toggleMark('bold')
			} else if (k === 'i') {
				e.preventDefault()
				actions.toggleMark('italic')
			} else if (k === 'u') {
				e.preventDefault()
				actions.toggleMark('underline')
			} else if (k === 'x' && (e.shiftKey || e.metaKey)) {
				e.preventDefault()
				actions.toggleMark('strike')
			}
		}
		dom?.addEventListener('keydown', handler as any)
		return () => {
			dom?.removeEventListener('keydown', handler as any)
			onActionsReady?.({
				toggleMark: () => {},
				toggleList: () => {},
				setHeader: () => {},
				clearFormatting: () => {},
				setAlign: () => {},
				increaseIndent: () => {},
				decreaseIndent: () => {},
				setFont: () => {},
				setColor: () => {},
				setHighlight: () => {},
				setFontSize: () => {},
				isMarkActive: () => false,
				isListActive: () => false,
				insertTable: () => {},
				insertGrid: () => {},
				insertDefList: () => {},
				getSelection: () => null,
				applyEdit: () => {},
				applyDiff: () => {},
				applyDiffs: () => {},
				clearDiff: () => {},
				clearDiffById: () => {},
			})
		}
	}, [onActionsReady])

	return (
		<div ref={containerRef} className='h-full w-full'>
			{popoverInfo && <SpanStylePopover info={popoverInfo} viewRef={viewRef} />}
		</div>
	)
}
