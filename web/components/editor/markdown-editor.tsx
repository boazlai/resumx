'use client'

import { useEffect, useRef } from 'react'
import {
	EditorView,
	keymap,
	highlightActiveLine,
	lineNumbers,
	highlightActiveLineGutter,
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import type { ResumeEditorSurfaceProps } from './types'

// Light theme that matches our CSS design tokens
const lightTheme = EditorView.theme({
	'&': {
		height: '100%',
		fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
		fontSize: '13px',
		backgroundColor: 'hsl(0 0% 100%)',
		color: 'hsl(224 71.4% 4.1%)',
	},
	'.cm-content': {
		padding: '16px',
		caretColor: 'hsl(224 71.4% 4.1%)',
		minHeight: '100%',
	},
	'.cm-line': { lineHeight: '1.65' },
	'.cm-activeLine': { backgroundColor: 'hsl(220 14.3% 95.9%)' },
	'.cm-activeLineGutter': { backgroundColor: 'hsl(220 14.3% 95.9%)' },
	'.cm-gutters': {
		backgroundColor: 'hsl(0 0% 100%)',
		borderRight: '1px solid hsl(220 13% 91%)',
		color: 'hsl(220 8.9% 46.1%)',
	},
	'&.cm-focused .cm-cursor': { borderLeftColor: 'hsl(224 71.4% 4.1%)' },
	'&.cm-focused': { outline: 'none' },
})

export function MarkdownEditor({
	value,
	onChange,
	onActionsReady,
}: ResumeEditorSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)

	useEffect(() => {
		if (!containerRef.current) return

		const startState = EditorState.create({
			doc: value,
			extensions: [
				history(),
				lineNumbers(),
				highlightActiveLine(),
				highlightActiveLineGutter(),
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
			onActionsReady({})
		}
	}, [onActionsReady])

	return <div ref={containerRef} className='h-full w-full' />
}
