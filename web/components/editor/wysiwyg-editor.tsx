'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import { Markdown } from 'tiptap-markdown'
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
}: ResumeEditorSurfaceProps) {
	const initialHtml = useRef(astToHtml(parseMarkdownToAST(value)))
	const initialValue = useRef(initialHtml.current)
	const isFocused = useRef(false)

	const editor = useEditor({
		extensions: [
			StarterKit,
			TextStyle,
			Placeholder.configure({
				placeholder: 'Start writing your resume…',
			}),
			Markdown.configure({
				html: false,
				transformCopiedText: true,
				transformPastedText: true,
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
		onUpdate({ editor }) {
			// Convert editor HTML -> AST -> markdown body to keep structured nodes
			try {
				const html = editor.getHTML()
				const ast = htmlToAST(html)
				const md = serializeASTToMarkdown(ast)
				onChange(md)
			} catch {
				// fallback: keep TipTap markdown storage if conversion fails
				const md = editor.storage.markdown.getMarkdown()
				onChange(md)
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
		} catch {
			const currentMd = editor.storage.markdown.getMarkdown()
			if (currentMd !== value) {
				editor.commands.setContent(value, false)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	// Toolbar actions
	const toggleBold = () => {
		editor?.chain().focus().toggleBold().run()
	}
	const toggleItalic = () => {
		editor?.chain().focus().toggleItalic().run()
	}
	const toggleBulletList = () => {
		editor?.chain().focus().toggleBulletList().run()
	}
	const toggleOrderedList = () => {
		editor?.chain().focus().toggleOrderedList().run()
	}
	const clearFormatting = () => {
		editor?.chain().focus().clearNodes().unsetAllMarks().run()
	}

	const toggleStrike = () => {
		editor
			?.chain()
			.focus()
			.setMark('textStyle', { style: 'text-decoration: line-through;' })
			.run()
	}
	const setHeader = (level: number) => {
		editor?.chain().focus().toggleHeading({ level }).run()
	}
	const setFont = (font: string) => {
		editor
			?.chain()
			.focus()
			.setMark('textStyle', { style: `font-family: ${font};` })
			.run()
	}
	const setColor = (hex: string) => {
		editor
			?.chain()
			.focus()
			.setMark('textStyle', { style: `color: ${hex};` })
			.run()
	}
	const setHighlight = (hex: string) => {
		editor
			?.chain()
			.focus()
			.setMark('textStyle', { style: `background-color: ${hex};` })
			.run()
	}
	const increaseIndent = () => {
		/* implement later if needed */
	}
	const decreaseIndent = () => {
		/* implement later if needed */
	}
	const setAlign = (a: 'left' | 'center' | 'right' | 'justify') => {
		// Try to set paragraph node style
		editor
			?.chain()
			.focus()
			.command(({ tr, state, dispatch }) => {
				const { from, to } = state.selection
				state.doc.nodesBetween(from, to, (node, pos) => {
					if (node.type.name === 'paragraph' || node.type.name === 'heading') {
						dispatch?.(
							tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								style: `text-align: ${a};`,
							}),
						)
					}
				})
				return true
			})
			.run()
	}
	const incIndent = () => {
		editor
			?.chain()
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
	}
	const decIndent = () => {
		editor
			?.chain()
			.focus()
			.command(({ tr, state, dispatch }) => {
				const { from, to } = state.selection
				state.doc.nodesBetween(from, to, (node, pos) => {
					if (node.isTextblock) {
						const lineText = node.textContent
						if (lineText.startsWith('  ')) {
							// remove first two spaces
							const start = pos + 1
							dispatch?.(tr.delete(start, start + 2))
						}
					}
				})
				return true
			})
			.run()
	}

	const setFontSize = (size: 'small' | 'normal' | 'large') => {
		const map: Record<string, string> = {
			small: '11px',
			normal: '13px',
			large: '15px',
		}
		editor
			?.chain()
			.focus()
			.setMark('textStyle', { style: `font-size: ${map[size]};` })
			.run()
	}

	// Expose actionable helpers to surrounding UI (e.g. StyleToolbar)
	useEffect(() => {
		if (!editor) return
		const actions = {
			setAlign: (a: 'left' | 'center' | 'right' | 'justify') => setAlign(a),
			increaseIndent: () => incIndent(),
			decreaseIndent: () => decIndent(),
			toggleMark: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				if (mark === 'bold') toggleBold()
				else if (mark === 'italic') toggleItalic()
				else if (mark === 'underline')
					editor
						.chain()
						.focus()
						.setMark('textStyle', { style: 'text-decoration: underline;' })
						.run()
				else if (mark === 'strike') toggleStrike()
			},
			toggleList: (type: 'bullet' | 'ordered') => {
				if (type === 'bullet') toggleBulletList()
				else toggleOrderedList()
			},
			setFontSize: (size: 'small' | 'normal' | 'large') => setFontSize(size),
			setHeader: (level: number) => setHeader(level),
			setFont: (font: string) => setFont(font),
			setColor: (hex: string) => setColor(hex),
			setHighlight: (hex: string) => setHighlight(hex),
			clearFormatting: () => clearFormatting(),
			isMarkActive: (mark: 'bold' | 'italic' | 'underline' | 'strike') => {
				if (mark === 'bold') return !!editor.isActive('bold')
				if (mark === 'italic') return !!editor.isActive('italic')
				if (mark === 'underline') {
					const attrs = editor.getAttributes('textStyle') as Record<string, any>
					const style = attrs?.style || ''
					return style.includes('underline')
				}
				if (mark === 'strike') {
					const attrs = editor.getAttributes('textStyle') as Record<string, any>
					const style = attrs?.style || ''
					return style.includes('line-through')
				}
				return false
			},
			isListActive: (type: 'bullet' | 'ordered') => {
				if (type === 'bullet') return !!editor.isActive('bulletList')
				return !!editor.isActive('orderedList')
			},
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
			})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor])

	return (
		<div className={cn('h-full overflow-auto bg-background', className)}>
			<div className='px-4 py-2 border-b bg-muted/5'>
				<div className='flex items-center gap-2'>
					<button
						aria-label='Bold'
						onClick={toggleBold}
						className={cn(
							'px-2 py-1 rounded text-sm',
							editor?.isActive('bold') ?
								'bg-foreground/10'
							:	'hover:bg-foreground/5',
						)}
					>
						<strong>B</strong>
					</button>

					<button
						aria-label='Italic'
						onClick={toggleItalic}
						className={cn(
							'px-2 py-1 rounded text-sm',
							editor?.isActive('italic') ?
								'bg-foreground/10'
							:	'hover:bg-foreground/5',
						)}
					>
						<em>I</em>
					</button>

					<button
						aria-label='Bullet list'
						onClick={toggleBulletList}
						className={cn(
							'px-2 py-1 rounded text-sm',
							editor?.isActive('bulletList') ?
								'bg-foreground/10'
							:	'hover:bg-foreground/5',
						)}
					>
						• List
					</button>

					<button
						aria-label='Numbered list'
						onClick={toggleOrderedList}
						className={cn(
							'px-2 py-1 rounded text-sm',
							editor?.isActive('orderedList') ?
								'bg-foreground/10'
							:	'hover:bg-foreground/5',
						)}
					>
						1. List
					</button>

					{/* Font size control removed — font sizing is handled via style presets or custom CSS */}

					<button
						aria-label='Clear formatting'
						onClick={clearFormatting}
						className='ml-auto px-2 py-1 rounded text-sm hover:bg-foreground/5'
					>
						Clear
					</button>
				</div>
			</div>

			<EditorContent
				editor={editor}
				className='h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0'
			/>
		</div>
	)
}
