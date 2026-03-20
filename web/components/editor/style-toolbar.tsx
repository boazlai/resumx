'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDebouncedCallback } from 'use-debounce'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	ChevronDown,
	Highlighter,
	Italic,
	LayoutGrid,
	LayoutList,
	List,
	ListOrdered,
	Pipette,
	RefreshCw,
	Strikethrough,
	Table2,
	Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
	onInsertTable?: (rows: number, cols: number) => void
	onInsertGrid?: (cols: number) => void
	onInsertDefList?: () => void
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

// Google Docs-style color palette: 10 cols × 5 rows
const SWATCH_ROWS = [
	[
		'#000000',
		'#434343',
		'#666666',
		'#999999',
		'#b7b7b7',
		'#cccccc',
		'#d9d9d9',
		'#efefef',
		'#f3f3f3',
		'#ffffff',
	],
	[
		'#ff0000',
		'#ff9900',
		'#ffff00',
		'#00ff00',
		'#00ffff',
		'#4a86e8',
		'#0000ff',
		'#9900ff',
		'#ff00ff',
		'#ff66cc',
	],
	[
		'#e06666',
		'#f6b26b',
		'#ffd966',
		'#93c47d',
		'#76a5af',
		'#6fa8dc',
		'#6d9eeb',
		'#8e7cc3',
		'#c27ba0',
		'#ea9999',
	],
	[
		'#cc0000',
		'#e69138',
		'#f1c232',
		'#6aa84f',
		'#45818e',
		'#3c78d8',
		'#3d85c8',
		'#674ea7',
		'#a64d79',
		'#c27ba0',
	],
	[
		'#990000',
		'#b45f06',
		'#bf9000',
		'#38761d',
		'#134f5c',
		'#1155cc',
		'#1c4587',
		'#351c75',
		'#741b47',
		'#783f04',
	],
]

function InlineColorPicker({
	mode,
	initialValue,
	onChange,
}: {
	mode: 'text' | 'highlight'
	initialValue: string
	onChange?: (hex: string) => void
}) {
	const [open, setOpen] = useState(false)
	const [color, setColor] = useState(initialValue)
	const [hasEyeDropper, setHasEyeDropper] = useState(false)
	const [panelPos, setPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const btnRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const nativeRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setHasEyeDropper('EyeDropper' in window)
	}, [])

	useEffect(() => {
		if (!open) return
		const handleOut = (e: MouseEvent) => {
			if (
				panelRef.current
				&& !panelRef.current.contains(e.target as Node)
				&& btnRef.current
				&& !btnRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [open])

	const pick = (hex: string) => {
		setColor(hex)
		onChange?.(hex)
		setOpen(false)
	}

	const openEyeDropper = async () => {
		try {
			// @ts-ignore
			const ed = new window.EyeDropper()
			const result = await ed.open()
			if (result?.sRGBHex) pick(result.sRGBHex)
		} catch {}
	}

	const handleToggle = () => {
		if (!open && btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect()
			setPanelPos({ top: rect.bottom + 4, left: rect.left })
		}
		setOpen(o => !o)
	}

	return (
		<div className='relative'>
			<button
				ref={btnRef}
				type='button'
				onClick={handleToggle}
				className='flex h-8 w-8 flex-col items-center justify-center rounded hover:bg-foreground/5'
				title={mode === 'text' ? 'Text color' : 'Highlight color'}
			>
				{mode === 'text' ?
					<>
						<span className='text-sm font-bold leading-tight'>A</span>
						<span
							className='mt-0.5 h-[3px] w-[18px] rounded-sm'
							style={{ backgroundColor: color }}
						/>
					</>
				:	<>
						<Highlighter className='h-3.5 w-3.5' />
						<span
							className='mt-0.5 h-[3px] w-[18px] rounded-sm'
							style={{
								backgroundColor: color === 'transparent' ? '#fff8b3' : color,
							}}
						/>
					</>
				}
			</button>
			{open
				&& panelPos
				&& createPortal(
					<div
						ref={panelRef}
						style={{
							position: 'fixed',
							top: panelPos.top,
							left: panelPos.left,
							zIndex: 9999,
						}}
						className='min-w-[240px] rounded border bg-white p-3 shadow-lg'
					>
						{mode === 'highlight' && (
							<button
								type='button'
								className='mb-2 flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-foreground/5'
								onClick={() => pick('transparent')}
							>
								<span className='flex h-5 w-5 items-center justify-center text-base text-muted-foreground'>
									⊘
								</span>
								<span>None</span>
							</button>
						)}
						{SWATCH_ROWS.map((row, ri) => (
							<div key={ri} className='mb-0.5 flex gap-0.5'>
								{row.map(hex => (
									<button
										key={hex}
										type='button'
										title={hex}
										onClick={() => pick(hex)}
										className={cn(
											'h-5 w-5 rounded-full border border-transparent transition-transform hover:scale-110',
											hex === '#ffffff' ? 'border-gray-300' : '',
											color === hex ? 'ring-2 ring-offset-1 ring-blue-500' : '',
										)}
										style={{ backgroundColor: hex }}
									/>
								))}
							</div>
						))}
						<div className='mt-2 flex items-center gap-2 border-t pt-2'>
							<span className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
								Custom
							</span>
							<button
								type='button'
								onClick={() => nativeRef.current?.click()}
								className='flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-foreground/5'
								title='Custom color'
							>
								<span className='text-base leading-none'>+</span>
							</button>
							<input
								ref={nativeRef}
								type='color'
								className='sr-only'
								defaultValue={mode === 'text' ? '#000000' : '#fff8b3'}
								onChange={e => pick(e.target.value)}
								aria-label={
									mode === 'text' ? 'Custom text color' : (
										'Custom highlight color'
									)
								}
							/>
							{hasEyeDropper && (
								<button
									type='button'
									onClick={openEyeDropper}
									className='flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-foreground/5'
									title='Pick from screen'
								>
									<Pipette className='h-3.5 w-3.5' />
								</button>
							)}
						</div>
					</div>,
					document.body,
				)}
		</div>
	)
}

function TablePicker({
	onInsertTable,
	disabled,
}: {
	onInsertTable?: (rows: number, cols: number) => void
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)
	const [hover, setHover] = useState<{ rows: number; cols: number } | null>(
		null,
	)
	const [panelPos, setPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const btnRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handleOut = (e: MouseEvent) => {
			if (
				panelRef.current
				&& !panelRef.current.contains(e.target as Node)
				&& btnRef.current
				&& !btnRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [open])

	return (
		<div className='relative'>
			<button
				ref={btnRef}
				type='button'
				disabled={disabled}
				onClick={() => {
					if (!open && btnRef.current) {
						const rect = btnRef.current.getBoundingClientRect()
						setPanelPos({ top: rect.bottom + 4, left: rect.left })
					}
					setOpen(o => !o)
				}}
				className='inline-flex h-8 w-8 items-center justify-center rounded hover:bg-foreground/5 disabled:opacity-40'
				aria-label='Insert table'
				title='Insert table (markdown)'
			>
				<Table2 className='h-4 w-4' />
			</button>
			{open
				&& panelPos
				&& createPortal(
					<div
						ref={panelRef}
						style={{
							position: 'fixed',
							top: panelPos.top,
							left: panelPos.left,
							zIndex: 9999,
						}}
						className='rounded border bg-white p-3 shadow-lg'
						onMouseLeave={() => setHover(null)}
					>
						<p className='mb-2 text-xs text-muted-foreground'>
							{hover ? `${hover.rows} × ${hover.cols} table` : 'Insert table'}
						</p>
						<div className='flex flex-col gap-0.5'>
							{Array.from({ length: 5 }, (_, r) => (
								<div key={r} className='flex gap-0.5'>
									{Array.from({ length: 5 }, (_, c) => (
										<button
											key={c}
											type='button'
											onMouseEnter={() =>
												setHover({ rows: r + 1, cols: c + 1 })
											}
											onClick={() => {
												onInsertTable?.(r + 1, c + 1)
												setOpen(false)
												setHover(null)
											}}
											className={cn(
												'h-5 w-5 rounded-sm border transition-colors',
												hover && r < hover.rows && c < hover.cols ?
													'border-blue-400 bg-blue-100'
												:	'border-gray-200 hover:border-gray-400',
											)}
										/>
									))}
								</div>
							))}
						</div>
					</div>,
					document.body,
				)}
		</div>
	)
}

function GridPicker({
	onInsertGrid,
	disabled,
}: {
	onInsertGrid?: (cols: number) => void
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)
	const [panelPos, setPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const btnRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handleOut = (e: MouseEvent) => {
			if (
				panelRef.current
				&& !panelRef.current.contains(e.target as Node)
				&& btnRef.current
				&& !btnRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [open])

	return (
		<div className='relative'>
			<button
				ref={btnRef}
				type='button'
				disabled={disabled}
				onClick={() => {
					if (!open && btnRef.current) {
						const rect = btnRef.current.getBoundingClientRect()
						setPanelPos({ top: rect.bottom + 4, left: rect.left })
					}
					setOpen(o => !o)
				}}
				className='inline-flex h-8 items-center gap-0.5 rounded px-1.5 hover:bg-foreground/5 disabled:opacity-40'
				aria-label='Insert skills grid'
				title='Insert skills grid (markdown)'
			>
				<LayoutGrid className='h-4 w-4' />
				<ChevronDown className='h-3 w-3' />
			</button>
			{open
				&& panelPos
				&& createPortal(
					<div
						ref={panelRef}
						style={{
							position: 'fixed',
							top: panelPos.top,
							left: panelPos.left,
							zIndex: 9999,
						}}
						className='w-44 rounded border bg-white py-1 shadow-lg'
					>
						<p className='px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
							Skills Grid
						</p>
						{[2, 3, 4].map(cols => (
							<button
								key={cols}
								type='button'
								onClick={() => {
									onInsertGrid?.(cols)
									setOpen(false)
								}}
								className='flex w-full items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-foreground/5'
							>
								{Array.from({ length: cols }, (_, i) => (
									<div
										key={i}
										className='h-3.5 flex-1 rounded-sm border border-gray-300 bg-gray-50'
									/>
								))}
								<span className='ml-1 shrink-0 text-xs text-muted-foreground'>
									{cols} cols
								</span>
							</button>
						))}
					</div>,
					document.body,
				)}
		</div>
	)
}

type AlignValue = 'left' | 'center' | 'right' | 'justify'

const ALIGN_OPTIONS: {
	value: AlignValue
	icon: React.ReactNode
	label: string
}[] = [
	{ value: 'left', icon: <AlignLeft className='h-4 w-4' />, label: 'Left' },
	{
		value: 'center',
		icon: <AlignCenter className='h-4 w-4' />,
		label: 'Center',
	},
	{ value: 'right', icon: <AlignRight className='h-4 w-4' />, label: 'Right' },
	{
		value: 'justify',
		icon: <AlignJustify className='h-4 w-4' />,
		label: 'Justify',
	},
]

function AlignDropdown({
	onSetAlign,
}: {
	onSetAlign?: (a: AlignValue) => void
}) {
	const [open, setOpen] = useState(false)
	const [current, setCurrent] = useState<AlignValue>('left')
	const [panelPos, setPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const btnRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const handleOut = (e: MouseEvent) => {
			if (
				panelRef.current
				&& !panelRef.current.contains(e.target as Node)
				&& btnRef.current
				&& !btnRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [open])

	const currentOpt =
		ALIGN_OPTIONS.find(o => o.value === current) ?? ALIGN_OPTIONS[0]

	const handleToggle = () => {
		if (!open && btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect()
			setPanelPos({ top: rect.bottom + 4, left: rect.left })
		}
		setOpen(o => !o)
	}

	return (
		<div className='relative'>
			<button
				ref={btnRef}
				type='button'
				onClick={handleToggle}
				className='inline-flex h-8 items-center gap-0.5 rounded px-1.5 hover:bg-foreground/5'
				aria-label='Text alignment'
			>
				{currentOpt.icon}
				<ChevronDown className='h-3 w-3' />
			</button>
			{open
				&& panelPos
				&& createPortal(
					<div
						ref={panelRef}
						style={{
							position: 'fixed',
							top: panelPos.top,
							left: panelPos.left,
							zIndex: 9999,
						}}
						className='w-32 rounded border bg-white py-1 shadow-lg'
					>
						{ALIGN_OPTIONS.map(opt => (
							<button
								key={opt.value}
								type='button'
								className={cn(
									'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-foreground/5',
									current === opt.value ? 'bg-foreground/5 font-medium' : '',
								)}
								onClick={() => {
									setCurrent(opt.value)
									onSetAlign?.(opt.value)
									setOpen(false)
								}}
							>
								{opt.icon}
								{opt.label}
							</button>
						))}
					</div>,
					document.body,
				)}
		</div>
	)
}

export default function StyleToolbar({
	frontmatter,
	onSetFrontmatter,
	onToggleMark,
	onToggleList,
	onSetFontSize: _onSetFontSize,
	onSetHeader,
	onSetFont,
	onSetColor,
	onSetHighlight,
	onClearFormatting,
	onSetAlign,
	editorMode = 'wysiwyg',
	isMarkActive,
	isListActive,
	onInsertTable,
	onInsertGrid,
	onInsertDefList,
}: StyleToolbarProps) {
	const currentPages =
		parseInt(readYamlTopLevel('pages', frontmatter) ?? '1', 10) || 1

	const debouncedSetFrontmatter = useDebouncedCallback((next: string) => {
		onSetFrontmatter?.(next)
	}, 250)

	const iconBtn = (active?: boolean) =>
		cn('h-8 w-8 p-0', active ? 'bg-foreground/10' : '')

	return (
		<div className='inline-flex flex-wrap items-center gap-1 px-2'>
			{/* Pages stepper */}
			<div className='inline-flex h-8 items-center overflow-hidden rounded border bg-background'>
				<button
					type='button'
					onClick={() => {
						if (!onSetFrontmatter) return
						const next = Math.max(1, currentPages - 1)
						debouncedSetFrontmatter(setYamlTopLevel('pages', next, frontmatter))
					}}
					className='flex h-full w-7 items-center justify-center border-r text-sm hover:bg-foreground/5'
					aria-label='Decrease pages'
				>
					−
				</button>
				<span className='w-6 text-center text-sm'>{currentPages}</span>
				<button
					type='button'
					onClick={() => {
						if (!onSetFrontmatter) return
						const next = currentPages + 1
						debouncedSetFrontmatter(setYamlTopLevel('pages', next, frontmatter))
					}}
					className='flex h-full w-7 items-center justify-center border-l text-sm hover:bg-foreground/5'
					aria-label='Increase pages'
				>
					+
				</button>
			</div>

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Header level dropdown */}
			<label className='sr-only'>Header level</label>
			<select
				className='h-8 w-24 rounded border bg-background px-2 text-sm'
				aria-label='Header level'
				onChange={e => onSetHeader?.(parseInt(e.target.value, 10))}
			>
				<option value={0}>Normal</option>
				<option value={1}>H1</option>
				<option value={2}>H2</option>
				<option value={3}>H3</option>
				<option value={4}>H4</option>
				<option value={5}>H5</option>
				<option value={6}>H6</option>
			</select>

			{/* Font selector */}
			<label className='sr-only'>Font</label>
			<select
				className='h-8 w-28 rounded border bg-background px-2 text-sm'
				aria-label='Font'
				onChange={e => onSetFont?.(e.target.value)}
			>
				<option value='Inter'>Inter</option>
				<option value='Roboto'>Roboto</option>
				<option value='Open Sans'>Open Sans</option>
				<option value='Georgia'>Georgia</option>
				<option value='Source Code Pro'>Mono</option>
			</select>

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Inline formatting */}
			<div className='inline-flex items-center gap-0.5'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleMark?.('bold')}
					aria-label='Bold'
					className={iconBtn(isMarkActive?.('bold'))}
				>
					<Bold className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleMark?.('italic')}
					aria-label='Italic'
					className={iconBtn(isMarkActive?.('italic'))}
				>
					<Italic className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleMark?.('underline')}
					aria-label='Underline'
					className={iconBtn(isMarkActive?.('underline'))}
				>
					<Underline className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleMark?.('strike')}
					aria-label='Strikethrough'
					className={iconBtn(isMarkActive?.('strike'))}
				>
					<Strikethrough className='h-4 w-4' />
				</Button>
			</div>

			{/* Color pickers (Google Docs style) */}
			<InlineColorPicker
				mode='text'
				initialValue='#000000'
				onChange={onSetColor}
			/>
			<InlineColorPicker
				mode='highlight'
				initialValue='#fff8b3'
				onChange={onSetHighlight}
			/>

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Lists */}
			<div className='inline-flex items-center gap-0.5'>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleList?.('bullet')}
					aria-label='Bullet list'
					className={iconBtn(isListActive?.('bullet'))}
				>
					<List className='h-4 w-4' />
				</Button>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onMouseDown={e => e.preventDefault()}
					onClick={() => onToggleList?.('ordered')}
					aria-label='Numbered list'
					className={iconBtn(isListActive?.('ordered'))}
				>
					<ListOrdered className='h-4 w-4' />
				</Button>
			</div>

			{/* Alignment dropdown */}
			<AlignDropdown onSetAlign={onSetAlign} />

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Structure insertion: table, skills grid, definition list (markdown only) */}
			<div className='inline-flex items-center gap-0.5'>
				<TablePicker
					onInsertTable={onInsertTable}
					disabled={editorMode === 'wysiwyg'}
				/>
				<GridPicker
					onInsertGrid={onInsertGrid}
					disabled={editorMode === 'wysiwyg'}
				/>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onInsertDefList?.()}
					disabled={editorMode === 'wysiwyg'}
					className='h-8 w-8 p-0 disabled:opacity-40'
					aria-label='Insert definition list'
					title='Definition list (markdown)'
				>
					<LayoutList className='h-4 w-4' />
				</Button>
			</div>

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Clear formatting */}
			<Button
				type='button'
				variant='ghost'
				size='sm'
				onMouseDown={e => e.preventDefault()}
				onClick={() => onClearFormatting?.()}
				className='h-8 gap-1.5'
				aria-label='Clear formatting'
			>
				<RefreshCw className='h-4 w-4' />
				Clear
			</Button>
		</div>
	)
}
