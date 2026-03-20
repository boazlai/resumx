'use client'

import { useEffect, useRef } from 'react'
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import {
	iconAutoInsert,
	iconAutoInsertConfig,
} from '@/lib/editor/icon-auto-insert'
import type { ResumeEditorSurfaceProps } from './types'

// Light theme that matches our CSS design tokens.
// The outer editor is transparent so the parent bg-background shows through.
// Content is rendered as a centred A4-sized white paper (794 px wide).
const lightTheme = EditorView.theme({
	'&': {
		height: '100%',
		fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
		fontSize: '13px',
		backgroundColor: 'transparent',
		color: 'hsl(var(--foreground))',
	},
	'.cm-scroller': {
		padding: '32px 24px',
		alignItems: 'flex-start',
	},
	'.cm-content': {
		padding: '48px 56px',
		caretColor: 'hsl(var(--foreground))',
		maxWidth: '794px',
		width: '100%',
		margin: '0 auto',
		minHeight: '1123px',
		backgroundColor: 'hsl(var(--card))',
		boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
		borderRadius: '2px',
	},
	'.cm-line': { lineHeight: '1.65' },
	'.cm-activeLine': { backgroundColor: 'hsl(var(--accent) / 0.35)' },
	'.cm-gutters': { display: 'none' },
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
	frontmatter,
	userIcons,
	onFrontmatterUpdate,
}: MarkdownEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const iconConfigCompartment = useRef(new Compartment())

	useEffect(() => {
		if (!containerRef.current) return

		const startState = EditorState.create({
			doc: value,
			extensions: [
				history(),
				highlightActiveLine(),
				markdown(),
				syntaxHighlighting(defaultHighlightStyle),
				lightTheme,
				keymap.of([...defaultKeymap, ...historyKeymap]),
				EditorView.updateListener.of(update => {
					if (update.docChanged) {
						onChange(update.state.doc.toString())
					}
				}),
				EditorView.lineWrapping,
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
				if (mark === 'bold') {
					const applied = removeWrapping('**', '**')
					if (!applied) wrapSelection('**', '**')
				} else if (mark === 'italic') {
					const applied = removeWrapping('_', '_')
					if (!applied) wrapSelection('_', '_')
				} else if (mark === 'strike') {
					const applied = removeWrapping('~~', '~~')
					if (!applied) wrapSelection('~~', '~~')
				} else if (mark === 'underline') {
					// Markdown has no underline—use HTML span
					const applied = removeWrapping('<u>', '</u>')
					if (!applied) wrapSelection('<u>', '</u>')
				}
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
			isMarkActive: (_mark: 'bold' | 'italic' | 'underline' | 'strike') =>
				false,
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
			})
		}
	}, [onActionsReady])

	return <div ref={containerRef} className='h-full w-full' />
}
