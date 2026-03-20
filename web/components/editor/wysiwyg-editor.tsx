'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'
import { Section } from './extensions/section'
import { Entry } from './extensions/entry'
import { cn } from '@/lib/utils'
import type { ResumeEditorSurfaceProps } from './types'

import {
	parseMarkdownToAST,
	serializeASTToMarkdown,
} from '@/lib/editor/serializers'
import { astToHtml } from '@/lib/editor/html-serializer'
import { htmlToAST } from '@/lib/editor/html-parser'

export function WysiwygEditor({
	value,
	onChange,
	className,
	onActionsReady,
	onSelectionUpdate,
}: ResumeEditorSurfaceProps) {
	const initialHtml = useRef(astToHtml(parseMarkdownToAST(value)))
	const initialValue = useRef(initialHtml.current)
	const isFocused = useRef(false)

	const editor = useEditor({
		extensions: [
			StarterKit,
			TextStyle,
			Underline,
			Color,
			Highlight.configure({ multicolor: true }),
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			FontFamily,
			Section,
			Entry,
			Placeholder.configure({
				placeholder: 'Start writing your resume…',
			}),
		],
		// Use the initial value only — don't re-initialize from `value` prop
		content: initialValue.current,
		editorProps: {
			attributes: {
				class:
					'prose prose-sm max-w-none focus:outline-none min-h-full px-6 py-4',
			},
		},
		onFocus() {
			isFocused.current = true
		},
		onBlur() {
			isFocused.current = false
		},
		onSelectionUpdate() {
			onSelectionUpdate?.()
		},
		onUpdate({ editor }) {
			onSelectionUpdate?.()
			// Convert editor HTML -> AST -> markdown body to keep structured nodes
			try {
				const html = editor.getHTML()
				const ast = htmlToAST(html)
				const md = serializeASTToMarkdown(ast)
				onChange(md)
			} catch {
				onChange(editor.getText())
			}
		},
	})

	// Only sync external value when the editor does NOT have focus (e.g. title rename triggers re-render)
	useEffect(() => {
		if (!editor || isFocused.current) return
		try {
			const html = astToHtml(parseMarkdownToAST(value))
			const currentHtml = editor.getHTML()
			if (currentHtml !== html) {
				editor.commands.setContent(html, false)
			}
			return
		} catch {
			// If HTML conversion fails, set content directly
			editor.commands.setContent(value, false)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	// Expose actionable helpers to surrounding UI (e.g. StyleToolbar)
	useEffect(() => {
		if (!editor) return
		const actions = {
			toggleMark: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				if (mark === 'bold') editor.chain().focus().toggleBold().run()
				else if (mark === 'italic') editor.chain().focus().toggleItalic().run()
				else if (mark === 'underline')
					editor.chain().focus().toggleUnderline().run()
				else if (mark === 'strike') editor.chain().focus().toggleStrike().run()
			},
			toggleList: (type: 'bullet' | 'ordered') => {
				if (type === 'bullet') editor.chain().focus().toggleBulletList().run()
				else editor.chain().focus().toggleOrderedList().run()
			},
			setFontSize: (size: 'small' | 'normal' | 'large') => {
				const map: Record<string, string> = {
					small: '11px',
					normal: '13px',
					large: '15px',
				}
				editor
					.chain()
					.focus()
					.setMark('textStyle', { style: `font-size: ${map[size]};` })
					.run()
			},
			setHeader: (level: number) => {
				if (level === 0) editor.chain().focus().setParagraph().run()
				else
					editor
						.chain()
						.focus()
						.toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
						.run()
			},
			setFont: (font: string) => {
				editor.chain().focus().setFontFamily(font).run()
			},
			setColor: (hex: string) => {
				editor.chain().focus().setColor(hex).run()
			},
			setHighlight: (hex: string) => {
				if (hex === 'transparent') editor.chain().focus().unsetHighlight().run()
				else editor.chain().focus().setHighlight({ color: hex }).run()
			},
			clearFormatting: () => {
				editor.chain().focus().clearNodes().unsetAllMarks().run()
			},
			setAlign: (a: 'left' | 'center' | 'right' | 'justify') => {
				editor.chain().focus().setTextAlign(a).run()
			},
			increaseIndent: () => {
				editor
					.chain()
					.focus()
					.command(({ tr, state, dispatch }) => {
						const { from, to } = state.selection
						state.doc.nodesBetween(from, to, (node, pos) => {
							if (node.isTextblock) {
								dispatch?.(tr.insertText('  ', pos + 1))
							}
						})
						return true
					})
					.run()
			},
			decreaseIndent: () => {
				editor
					.chain()
					.focus()
					.command(({ tr, state, dispatch }) => {
						const { from, to } = state.selection
						state.doc.nodesBetween(from, to, (node, pos) => {
							if (node.isTextblock) {
								const lineText = node.textContent
								if (lineText.startsWith('  ')) {
									const start = pos + 1
									dispatch?.(tr.delete(start, start + 2))
								}
							}
						})
						return true
					})
					.run()
			},
			isMarkActive: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				if (mark === 'bold') return !!editor.isActive('bold')
				if (mark === 'italic') return !!editor.isActive('italic')
				if (mark === 'underline') return !!editor.isActive('underline')
				if (mark === 'strike') return !!editor.isActive('strike')
				return false
			},
			isListActive: (type: 'bullet' | 'ordered') => {
				if (type === 'bullet') return !!editor.isActive('bulletList')
				return !!editor.isActive('orderedList')
			},
			insertTable: (_rows: number, _cols: number) => {},
			insertGrid: (_cols: number) => {},
			insertDefList: () => {},
		}
		onActionsReady?.(actions)
		return () =>
			onActionsReady?.({
				toggleMark: () => {},
				toggleList: () => {},
				setFontSize: () => {},
				clearFormatting: () => {},
				isMarkActive: () => false,
				isListActive: () => false,
				insertTable: () => {},
				insertGrid: () => {},
				insertDefList: () => {},
			})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor])

	return (
		// Outer area uses app background colour; content is the white A4 paper
		<div className={cn('h-full overflow-auto bg-background', className)}>
			<div className='flex min-h-full justify-center px-4 py-8'>
				{/* White A4-proportioned page: 750 px wide, min-height ≈ 750 × (297/210) ≈ 1061 px */}
				<div className='w-full max-w-[750px] min-h-[1061px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.25)] rounded-sm'>
					<EditorContent
						editor={editor}
						className='[&_.ProseMirror]:min-h-[1061px] [&_.ProseMirror]:px-16 [&_.ProseMirror]:py-12 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0'
					/>
				</div>
			</div>
		</div>
	)
}
