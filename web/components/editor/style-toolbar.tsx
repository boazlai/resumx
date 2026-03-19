'use client'

import React from 'react'
import { useDebouncedCallback } from 'use-debounce'
import {
	Bold,
	Italic,
	Underline,
	List,
	ListOrdered,
	RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ColorPicker from './color-picker'
import { cn } from '@/lib/utils'

interface StyleToolbarProps {
	frontmatter?: string
	onSetFrontmatter?: (newFrontmatter: string) => void
	onToggleMark?: (mark: 'bold' | 'italic' | 'underline' | 'strike') => void
	onToggleList?: (type: 'bullet' | 'ordered') => void
	onSetFontSize?: (size: 'small' | 'normal' | 'large') => void
	onSetHeader?: (level: number) => void
	onSetFont?: (font: string) => void
	onSetColor?: (hex: string) => void
	onSetHighlight?: (hex: string) => void
	onClearFormatting?: () => void
	onSetAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void
	onIncreaseIndent?: () => void
	onDecreaseIndent?: () => void
	editorMode?: 'markdown' | 'wysiwyg'
	isMarkActive?: (mark: 'bold' | 'italic' | 'underline' | 'strike') => boolean
	isListActive?: (type: 'bullet' | 'ordered') => boolean
}

function readYamlTopLevel(key: string, fm: string | undefined) {
	if (!fm) return null
	const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
	if (!m) return null
	let v = m[1].trim()
	v = v.replace(/^["'](.*)["']$/, '$1')
	return v
}

function setYamlTopLevel(
	key: string,
	value: string | number | null,
	fm: string | undefined,
) {
	const fmText = fm ?? ''
	const line =
		typeof value === 'number' ?
			`${key}: ${value}`
		:	`${key}: "${String(value)}"`
	if (fmText.match(new RegExp(`^${key}:`, 'm'))) {
		return fmText.replace(new RegExp(`^${key}:.*$`, 'm'), line)
	}
	if (!fmText.trim()) return `${line}\n`
	return `${line}\n${fmText}`
}

/**
 * Minimal Style toolbar implementing Phase 1 (MVP) controls:
 * - Style preset selector
 * - Pages stepper
 * - Bold, Italic, Underline
 * - Lists (bullet/number)
 * - Font size (small/normal/large)
 * - Clear formatting
 */
export default function StyleToolbar({
	frontmatter,
	onSetFrontmatter,
	onToggleMark,
	onToggleList,
	onSetFontSize,
	onClearFormatting,
	editorMode = 'wysiwyg',
	isMarkActive,
	isListActive,
}: StyleToolbarProps) {
	const currentStyle = readYamlTopLevel('style', frontmatter) ?? 'default'
	const currentPages =
		parseInt(readYamlTopLevel('pages', frontmatter) ?? '1', 10) || 1
	const currentFontSize = readYamlTopLevel('fontSize', frontmatter) ?? 'normal'

	const debouncedSetFrontmatter = useDebouncedCallback((next: string) => {
		onSetFrontmatter?.(next)
	}, 250)

	return (
		<div className='inline-flex items-center gap-2 px-2'>
			{/* Pages stepper (with label) */}
			<div className='inline-flex items-center gap-2'>
				<span className='text-sm text-muted-foreground'>Page</span>
				<div className='inline-flex items-center gap-1'>
					<button
						type='button'
						onClick={() => {
							if (!onSetFrontmatter) return
							const next = Math.max(1, currentPages - 1)
							debouncedSetFrontmatter(
								setYamlTopLevel('pages', next, frontmatter),
							)
						}}
						className='px-2 py-1 rounded border bg-background text-sm'
						aria-label='Decrease pages'
					>
						−
					</button>
					<div className='px-2 text-sm'>{currentPages}</div>
					<button
						type='button'
						onClick={() => {
							if (!onSetFrontmatter) return
							const next = currentPages + 1
							debouncedSetFrontmatter(
								setYamlTopLevel('pages', next, frontmatter),
							)
						}}
						className='px-2 py-1 rounded border bg-background text-sm'
						aria-label='Increase pages'
					>
						+
					</button>
				</div>
			</div>

			{/* Header level dropdown */}
			<label className='sr-only'>Header level</label>
			<select
				className='text-sm px-2 py-1 rounded bg-background border ml-2'
				aria-label='Header level'
				onChange={e => {
					const v = parseInt(e.target.value, 10)
					if (v === 0) onSetHeader?.(0)
					else onSetHeader?.(v)
				}}
			>
				<option value={0}>Normal text</option>
				<option value={1}>Heading 1</option>
				<option value={2}>Heading 2</option>
				<option value={3}>Heading 3</option>
				<option value={4}>Heading 4</option>
				<option value={5}>Heading 5</option>
				<option value={6}>Heading 6</option>
			</select>

			{/* Font selector */}
			<label className='sr-only'>Font</label>
			<select
				className='text-sm px-2 py-1 rounded bg-background border ml-2'
				aria-label='Font'
				onChange={e => onSetFont?.(e.target.value)}
			>
				<option value='Inter'>Inter</option>
				<option value='Roboto'>Roboto</option>
				<option value='Open Sans'>Open Sans</option>
				<option value='Georgia'>Georgia</option>
				<option value='Source Code Pro'>Source Code Pro</option>
			</select>

			{/* Inline formatting marks */}
			<div className='inline-flex items-center gap-1 border rounded px-1 py-0.5 ml-2'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleMark && onToggleMark('bold')}
					aria-label='Bold'
					className={cn(
						'h-8 w-8 p-0',
						isMarkActive?.('bold') ? 'bg-foreground/10' : '',
					)}
					disabled={false}
				>
					<Bold className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleMark && onToggleMark('italic')}
					aria-label='Italic'
					className={cn(
						'h-8 w-8 p-0',
						isMarkActive?.('italic') ? 'bg-foreground/10' : '',
					)}
				>
					<Italic className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleMark && onToggleMark('underline')}
					aria-label='Underline'
					className={cn(
						'h-8 w-8 p-0',
						isMarkActive?.('underline') ? 'bg-foreground/10' : '',
					)}
				>
					<Underline className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleMark && onToggleMark('strike')}
					aria-label='Strikethrough'
					className={cn(
						'h-8 w-8 p-0',
						isMarkActive?.('strike') ? 'bg-foreground/10' : '',
					)}
				>
					<span className='text-sm'>S</span>
				</Button>
			</div>

			{/* Lists */}
			<div className='inline-flex items-center gap-1 border rounded px-1 py-0.5 ml-2'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleList && onToggleList('bullet')}
					aria-label='Bullet list'
					className={cn(
						'h-8 w-8 p-0',
						isListActive?.('bullet') ? 'bg-foreground/10' : '',
					)}
				>
					<List className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onToggleList && onToggleList('ordered')}
					aria-label='Numbered list'
					className={cn(
						'h-8 w-8 p-0',
						isListActive?.('ordered') ? 'bg-foreground/10' : '',
					)}
				>
					<ListOrdered className='h-4 w-4' />
				</Button>
			</div>

			{/* Paragraph: align + indent */}
			<div className='inline-flex items-center gap-1 ml-2'>
				<button
					type='button'
					aria-label='Align left'
					onClick={() => onSetAlign?.('left')}
					className='px-2 py-1 rounded text-sm hover:bg-foreground/5'
				>
					L
				</button>
				<button
					type='button'
					aria-label='Align center'
					onClick={() => onSetAlign?.('center')}
					className='px-2 py-1 rounded text-sm hover:bg-foreground/5'
				>
					C
				</button>
				<button
					type='button'
					aria-label='Align right'
					onClick={() => onSetAlign?.('right')}
					className='px-2 py-1 rounded text-sm hover:bg-foreground/5'
				>
					R
				</button>
				<button
					type='button'
					aria-label='Decrease indent'
					onClick={() => onDecreaseIndent?.()}
					className='px-2 py-1 rounded text-sm hover:bg-foreground/5'
				>
					←
				</button>
				<button
					type='button'
					aria-label='Increase indent'
					onClick={() => onIncreaseIndent?.()}
					className='px-2 py-1 rounded text-sm hover:bg-foreground/5'
				>
					→
				</button>
			</div>

			{/* Color pickers */}
			<div className='inline-flex items-center gap-2 ml-2'>
				<ColorPicker value='#000000' onChange={h => onSetColor?.(h)} />
				<ColorPicker value='#fff8b3' onChange={h => onSetHighlight?.(h)} />
			</div>

			{/* Clear formatting */}
			<Button
				type='button'
				variant='ghost'
				size='sm'
				onClick={() => onClearFormatting && onClearFormatting()}
				className='h-8 gap-1.5 ml-2'
				aria-label='Clear formatting'
			>
				<RefreshCw className='h-4 w-4' />
				Clear
			</Button>
		</div>
	)
}
