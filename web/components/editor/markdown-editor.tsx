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
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

type Props = {
	value: string
	onChange: (value: string) => void
}

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

export function MarkdownEditor({ value, onChange }: Props) {
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

	return <div ref={containerRef} className='h-full w-full' />
}
