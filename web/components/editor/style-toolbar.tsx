'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDebouncedCallback } from 'use-debounce'
import { FONT_GROUPS } from './font-map'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	ALargeSmall,
	Bold,
	ChevronDown,
	ChevronUp,
	Heading,
	Highlighter,
	Italic,
	LayoutGrid,
	LayoutList,
	List,
	ListOrdered,
	Pipette,
	RefreshCw,
	SlidersHorizontal,
	Strikethrough,
	Table2,
	Type,
	Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
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
	isMarkActive?: (mark: 'bold' | 'italic' | 'underline' | 'strike') => boolean
	isListActive?: (type: 'bullet' | 'ordered') => boolean
	onInsertTable?: (rows: number, cols: number) => void
	onInsertGrid?: (cols: number) => void
	onInsertDefList?: () => void
	isNarrow?: boolean
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

function readStyleKey(key: string, fm: string | undefined) {
	if (!fm) return null
	const m = fm.match(new RegExp(`^[ \\t]+${key}:\\s*(.+)$`, 'm'))
	if (!m) return null
	return m[1].trim().replace(/^["'](.*)["|']$/, '$1')
}

function setStyleKey(key: string, value: string, fm: string | undefined) {
	const fmText = fm ?? ''
	const line = `  ${key}: ${value}`
	if (fmText.match(new RegExp(`^[ \\t]+${key}:`, 'm'))) {
		return fmText.replace(new RegExp(`^([ \\t]+)${key}:.*$`, 'm'), line)
	}
	if (fmText.match(/^style:/m)) {
		// insert after the style: header line
		return fmText.replace(/^(style:[^\n]*)$/m, `$1\n${line}`)
	}
	return fmText.trimEnd() + `\nstyle:\n${line}\n`
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
						className='min-w-[240px] rounded border bg-popover text-popover-foreground p-3 shadow-lg'
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
						className='rounded border bg-popover text-popover-foreground p-3 shadow-lg'
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
						className='w-44 rounded border bg-popover text-popover-foreground py-1 shadow-lg'
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

function FontSizeControl({
	currentFontSize,
	onSetFrontmatter,
	frontmatter,
}: {
	currentFontSize: string
	onSetFrontmatter?: (s: string) => void
	frontmatter?: string
}) {
	const rawNum = currentFontSize.replace(/pt$/, '')
	const [inputVal, setInputVal] = useState(rawNum)
	const [open, setOpen] = useState(false)
	const [panelPos, setPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const chevRef = useRef<HTMLButtonElement>(null)

	const debouncedSet = useDebouncedCallback((next: string) => {
		onSetFrontmatter?.(next)
	}, 250)

	useEffect(() => {
		setInputVal(currentFontSize.replace(/pt$/, ''))
	}, [currentFontSize])

	useEffect(() => {
		if (!open) return
		const handleOut = (e: MouseEvent) => {
			if (
				panelRef.current
				&& !panelRef.current.contains(e.target as Node)
				&& containerRef.current
				&& !containerRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [open])

	const PRESETS = [
		'8',
		'9',
		'9.5',
		'10',
		'10.5',
		'11',
		'11.5',
		'12',
		'13',
		'14',
		'16',
		'18',
	]

	function commit(val: string) {
		const n = parseFloat(val)
		if (isNaN(n) || n < 6 || n > 72) return
		debouncedSet(setStyleKey('font-size', `${n}pt`, frontmatter))
	}

	return (
		<div
			ref={containerRef}
			className='relative inline-flex h-8 items-center overflow-hidden rounded border bg-background focus-within:ring-1 focus-within:ring-ring'
		>
			<ALargeSmall className='ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground' />
			<input
				type='text'
				value={inputVal}
				onChange={e => setInputVal(e.target.value)}
				onBlur={() => commit(inputVal)}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.currentTarget.blur()
						commit(inputVal)
					}
					if (e.key === 'ArrowUp') {
						e.preventDefault()
						const n = parseFloat(inputVal)
						if (!isNaN(n)) {
							const next = String(
								Math.min(72, parseFloat((n + 0.5).toFixed(1))),
							)
							setInputVal(next)
							commit(next)
						}
					}
					if (e.key === 'ArrowDown') {
						e.preventDefault()
						const n = parseFloat(inputVal)
						if (!isNaN(n)) {
							const next = String(Math.max(6, parseFloat((n - 0.5).toFixed(1))))
							setInputVal(next)
							commit(next)
						}
					}
				}}
				className='w-9 bg-transparent px-1.5 text-xs text-center focus:outline-none'
				aria-label='Font size'
			/>
			<button
				ref={chevRef}
				type='button'
				onClick={() => {
					if (!open && chevRef.current) {
						const rect = chevRef.current.getBoundingClientRect()
						setPanelPos({ top: rect.bottom + 4, left: rect.left - 20 })
					}
					setOpen(o => !o)
				}}
				className='flex h-full w-5 items-center justify-center hover:bg-foreground/5'
				aria-label='Font size presets'
			>
				<ChevronDown className='h-3 w-3 text-muted-foreground' />
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
						className='w-14 rounded border bg-popover text-popover-foreground py-1 shadow-lg'
					>
						{PRESETS.map(s => (
							<button
								key={s}
								type='button'
								onClick={() => {
									setInputVal(s)
									commit(s)
									setOpen(false)
								}}
								className={cn(
									'w-full px-3 py-1 text-xs text-right hover:bg-foreground/5',
									inputVal === s ? 'bg-foreground/5 font-medium' : '',
								)}
							>
								{s}
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
						className='w-32 rounded border bg-popover text-popover-foreground py-1 shadow-lg'
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
	isMarkActive,
	isListActive,
	onInsertTable,
	onInsertGrid,
	onInsertDefList,
	isNarrow = false,
}: StyleToolbarProps) {
	const currentPages =
		parseInt(readYamlTopLevel('pages', frontmatter) ?? '1', 10) || 1
	const currentFontSize = readStyleKey('font-size', frontmatter) ?? '11pt'

	const debouncedSetFrontmatter = useDebouncedCallback((next: string) => {
		onSetFrontmatter?.(next)
	}, 250)

	const [selectedHeaderLabel, setSelectedHeaderLabel] = useState('Normal')
	const [selectedFont, setSelectedFont] = useState('')

	// YAML panel state
	const [showYamlPanel, setShowYamlPanel] = useState(false)
	const [yamlPanelPos, setYamlPanelPos] = useState<{
		top: number
		left: number
	} | null>(null)
	const [localYaml, setLocalYaml] = useState(frontmatter ?? '')
	const yamlBtnRef = useRef<HTMLButtonElement>(null)
	const yamlPanelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!showYamlPanel) setLocalYaml(frontmatter ?? '')
	}, [frontmatter, showYamlPanel])

	useEffect(() => {
		if (!showYamlPanel) return
		const handleOut = (e: MouseEvent) => {
			if (
				yamlPanelRef.current
				&& !yamlPanelRef.current.contains(e.target as Node)
				&& yamlBtnRef.current
				&& !yamlBtnRef.current.contains(e.target as Node)
			) {
				setShowYamlPanel(false)
			}
		}
		document.addEventListener('mousedown', handleOut)
		return () => document.removeEventListener('mousedown', handleOut)
	}, [showYamlPanel])

	function handleYamlBtnClick() {
		if (showYamlPanel) {
			setShowYamlPanel(false)
			return
		}
		const rect = yamlBtnRef.current?.getBoundingClientRect()
		if (rect) {
			setYamlPanelPos({ top: rect.bottom + 6, left: rect.left })
		}
		setLocalYaml(frontmatter ?? '')
		setShowYamlPanel(true)
	}

	const iconBtn = (active?: boolean) =>
		cn('h-8 w-8 p-0', active ? 'bg-foreground/10' : '')

	const groupTriggerCls =
		'flex items-center gap-1 h-8 rounded px-2 text-xs hover:bg-muted transition-colors focus:outline-none border bg-background shrink-0'

	const yamlPortal =
		showYamlPanel
		&& yamlPanelPos
		&& createPortal(
			<div
				ref={yamlPanelRef}
				style={{
					position: 'fixed',
					top: yamlPanelPos.top,
					left: yamlPanelPos.left,
					zIndex: 9999,
				}}
				className='w-80 rounded-lg border bg-background shadow-xl'
			>
				<div className='flex items-center justify-between border-b px-3 py-2'>
					<span className='text-xs font-medium text-muted-foreground'>
						Resume configuration (YAML)
					</span>
					<button
						type='button'
						onClick={() => setShowYamlPanel(false)}
						className='text-muted-foreground hover:text-foreground text-sm leading-none'
						aria-label='Close'
					>
						✕
					</button>
				</div>
				<div className='p-3'>
					<textarea
						value={localYaml}
						onChange={e => {
							setLocalYaml(e.target.value)
							debouncedSetFrontmatter(e.target.value)
						}}
						className='h-48 w-full rounded border bg-background p-2 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring'
						spellCheck={false}
						placeholder='pages: 1&#10;style:&#10;  font-size: 11pt'
					/>
				</div>
			</div>,
			document.body,
		)

	if (isNarrow) {
		return (
			<div className='inline-flex flex-nowrap items-center gap-1 px-2'>
				{/* Pages stepper */}
				<div className='inline-flex h-8 items-center gap-1 overflow-hidden rounded border bg-background px-2 shrink-0'>
					<span className='text-xs text-muted-foreground select-none'>
						page:
					</span>
					<span className='min-w-[1.25ch] text-center text-sm'>
						{currentPages}
					</span>
					<div className='flex flex-col -my-0.5'>
						<button
							type='button'
							onClick={() => {
								if (!onSetFrontmatter) return
								const next = currentPages + 1
								debouncedSetFrontmatter(
									setYamlTopLevel('pages', next, frontmatter),
								)
							}}
							className='flex h-3.5 w-4 items-center justify-center rounded-sm hover:bg-foreground/5'
							aria-label='Increase pages'
						>
							<ChevronUp className='h-2.5 w-2.5' />
						</button>
						<button
							type='button'
							onClick={() => {
								if (!onSetFrontmatter) return
								const next = Math.max(1, currentPages - 1)
								debouncedSetFrontmatter(
									setYamlTopLevel('pages', next, frontmatter),
								)
							}}
							className='flex h-3.5 w-4 items-center justify-center rounded-sm hover:bg-foreground/5'
							aria-label='Decrease pages'
						>
							<ChevronDown className='h-2.5 w-2.5' />
						</button>
					</div>
				</div>

				<div className='mx-0.5 h-6 w-px bg-border shrink-0' />

				{/* Text group */}
				<Popover>
					<PopoverTrigger asChild>
						<button type='button' className={groupTriggerCls}>
							<Bold className='h-3.5 w-3.5' />
							<span>Text</span>
							<ChevronDown className='h-3 w-3 text-muted-foreground' />
						</button>
					</PopoverTrigger>
					<PopoverContent className='w-auto p-2' align='start' sideOffset={6}>
						<div className='flex items-center gap-0.5'>
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
							<div className='mx-1 h-6 w-px bg-border' />
							<Button
								type='button'
								variant='ghost'
								size='sm'
								onMouseDown={e => e.preventDefault()}
								onClick={() => onClearFormatting?.()}
								className='h-8 w-8 p-0'
								aria-label='Clear formatting'
							>
								<RefreshCw className='h-4 w-4' />
							</Button>
						</div>
					</PopoverContent>
				</Popover>

				{/* Styles group */}
				<Popover>
					<PopoverTrigger asChild>
						<button type='button' className={groupTriggerCls}>
							<Heading className='h-3.5 w-3.5' />
							<span>Styles</span>
							<ChevronDown className='h-3 w-3 text-muted-foreground' />
						</button>
					</PopoverTrigger>
					<PopoverContent className='w-auto p-2' align='start' sideOffset={6}>
						<div className='flex flex-col gap-2'>
							<div className='flex items-center gap-1 flex-wrap'>
								{/* Header dropdown */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											type='button'
											className='flex items-center gap-1.5 h-8 rounded-md border bg-background px-2 text-xs hover:bg-muted transition-colors focus:outline-none min-w-[84px]'
											aria-label='Header level'
										>
											<Heading className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
											<span className='flex-1 text-left'>
												{selectedHeaderLabel}
											</span>
											<ChevronDown className='h-3 w-3 text-muted-foreground shrink-0' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='start'
										className='rounded-xl p-1 min-w-[100px]'
									>
										{[
											{ label: 'Normal', value: 0 },
											{ label: 'H1', value: 1 },
											{ label: 'H2', value: 2 },
											{ label: 'H3', value: 3 },
											{ label: 'H4', value: 4 },
											{ label: 'H5', value: 5 },
											{ label: 'H6', value: 6 },
										].map(item => (
											<DropdownMenuItem
												key={item.value}
												onClick={() => {
													onSetHeader?.(item.value)
													setSelectedHeaderLabel(item.label)
												}}
												className={cn(
													'text-xs rounded-lg cursor-pointer',
													selectedHeaderLabel === item.label
														&& 'bg-foreground/5 font-medium',
												)}
											>
												{item.label}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								{/* Font size */}
								<FontSizeControl
									currentFontSize={currentFontSize}
									onSetFrontmatter={onSetFrontmatter}
									frontmatter={frontmatter}
								/>
							</div>

							{/* Font selector */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type='button'
										className='flex items-center gap-1.5 h-8 rounded-md border bg-background px-2 text-xs hover:bg-muted transition-colors focus:outline-none w-full'
										aria-label='Font'
									>
										<Type className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
										<span className='flex-1 text-left truncate'>
											{selectedFont || 'Font…'}
										</span>
										<ChevronDown className='h-3 w-3 text-muted-foreground shrink-0' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='start'
									className='rounded-xl p-1 max-h-72 overflow-y-auto w-32'
								>
									{FONT_GROUPS.map((group, gi) => (
										<React.Fragment key={group.label}>
											{gi > 0 && <DropdownMenuSeparator />}
											<DropdownMenuLabel className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1'>
												{group.label}
											</DropdownMenuLabel>
											{group.fonts.map(font => (
												<DropdownMenuItem
													key={font}
													onClick={() => {
														onSetFont?.(font)
														setSelectedFont(font)
													}}
													className={cn(
														'text-xs rounded-lg cursor-pointer',
														selectedFont === font
															&& 'bg-foreground/5 font-medium',
													)}
												>
													{font}
												</DropdownMenuItem>
											))}
										</React.Fragment>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Alignment */}
							<div className='flex items-center gap-1'>
								<AlignDropdown onSetAlign={onSetAlign} />
							</div>
						</div>
					</PopoverContent>
				</Popover>

				{/* Insert group */}
				<Popover>
					<PopoverTrigger asChild>
						<button type='button' className={groupTriggerCls}>
							<Table2 className='h-3.5 w-3.5' />
							<span>Insert</span>
							<ChevronDown className='h-3 w-3 text-muted-foreground' />
						</button>
					</PopoverTrigger>
					<PopoverContent className='w-auto p-2' align='start' sideOffset={6}>
						<div className='flex items-center gap-0.5'>
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
							<Button
								type='button'
								variant='ghost'
								size='sm'
								onClick={() => onInsertDefList?.()}
								className='h-8 w-8 p-0'
								aria-label='Insert definition list'
							>
								<LayoutList className='h-4 w-4' />
							</Button>
							<TablePicker onInsertTable={onInsertTable} />
							<GridPicker onInsertGrid={onInsertGrid} />
						</div>
					</PopoverContent>
				</Popover>

				{/* Format (always visible) */}
				<button
					ref={yamlBtnRef}
					type='button'
					onClick={handleYamlBtnClick}
					className={cn(
						'inline-flex h-8 items-center gap-1.5 rounded px-2 text-sm hover:bg-foreground/5 shrink-0',
						showYamlPanel && 'bg-foreground/10',
					)}
					aria-label='Edit frontmatter'
					title='Edit frontmatter YAML'
				>
					<SlidersHorizontal className='h-4 w-4' />
				</button>

				{yamlPortal}
			</div>
		)
	}

	return (
		<div className='inline-flex flex-wrap items-center gap-1 px-2'>
			{/* Pages stepper */}
			<div className='inline-flex h-8 items-center gap-1 overflow-hidden rounded border bg-background px-2'>
				<span className='text-xs text-muted-foreground select-none'>page:</span>
				<span className='min-w-[1.25ch] text-center text-sm'>
					{currentPages}
				</span>
				<div className='flex flex-col -my-0.5'>
					<button
						type='button'
						onClick={() => {
							if (!onSetFrontmatter) return
							const next = currentPages + 1
							debouncedSetFrontmatter(
								setYamlTopLevel('pages', next, frontmatter),
							)
						}}
						className='flex h-3.5 w-4 items-center justify-center rounded-sm hover:bg-foreground/5'
						aria-label='Increase pages'
					>
						<ChevronUp className='h-2.5 w-2.5' />
					</button>
					<button
						type='button'
						onClick={() => {
							if (!onSetFrontmatter) return
							const next = Math.max(1, currentPages - 1)
							debouncedSetFrontmatter(
								setYamlTopLevel('pages', next, frontmatter),
							)
						}}
						className='flex h-3.5 w-4 items-center justify-center rounded-sm hover:bg-foreground/5'
						aria-label='Decrease pages'
					>
						<ChevronDown className='h-2.5 w-2.5' />
					</button>
				</div>
			</div>

			{/* Font size (writes style.font-size in frontmatter) */}
			<FontSizeControl
				currentFontSize={currentFontSize}
				onSetFrontmatter={onSetFrontmatter}
				frontmatter={frontmatter}
			/>

			<div className='mx-1 h-6 w-px bg-border' />

			{/* Header level dropdown */}
			<label className='sr-only'>Header level</label>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						className='flex items-center gap-1.5 h-8 rounded-md border bg-background px-2 text-xs hover:bg-muted transition-colors focus:outline-none min-w-[84px]'
						aria-label='Header level'
					>
						<Heading className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
						<span className='flex-1 text-left'>{selectedHeaderLabel}</span>
						<ChevronDown className='h-3 w-3 text-muted-foreground shrink-0' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align='start'
					className='rounded-xl p-1 min-w-[100px]'
				>
					{[
						{ label: 'Normal', value: 0 },
						{ label: 'H1', value: 1 },
						{ label: 'H2', value: 2 },
						{ label: 'H3', value: 3 },
						{ label: 'H4', value: 4 },
						{ label: 'H5', value: 5 },
						{ label: 'H6', value: 6 },
					].map(item => (
						<DropdownMenuItem
							key={item.value}
							onClick={() => {
								onSetHeader?.(item.value)
								setSelectedHeaderLabel(item.label)
							}}
							className={cn(
								'text-xs rounded-lg cursor-pointer',
								selectedHeaderLabel === item.label
									&& 'bg-foreground/5 font-medium',
							)}
						>
							{item.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Font selector */}
			<label className='sr-only'>Font</label>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type='button'
						className='flex items-center gap-1.5 h-8 rounded-md border bg-background px-2 text-xs hover:bg-muted transition-colors focus:outline-none w-24'
						aria-label='Font'
					>
						<Type className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
						<span className='flex-1 text-left truncate'>
							{selectedFont || 'Font…'}
						</span>
						<ChevronDown className='h-3 w-3 text-muted-foreground shrink-0' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align='start'
					className='rounded-xl p-1 max-h-72 overflow-y-auto w-32'
				>
					{FONT_GROUPS.map((group, gi) => (
						<React.Fragment key={group.label}>
							{gi > 0 && <DropdownMenuSeparator />}
							<DropdownMenuLabel className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1'>
								{group.label}
							</DropdownMenuLabel>
							{group.fonts.map(font => (
								<DropdownMenuItem
									key={font}
									onClick={() => {
										onSetFont?.(font)
										setSelectedFont(font)
									}}
									className={cn(
										'text-xs rounded-lg cursor-pointer',
										selectedFont === font && 'bg-foreground/5 font-medium',
									)}
								>
									{font}
								</DropdownMenuItem>
							))}
						</React.Fragment>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

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
				<TablePicker onInsertTable={onInsertTable} />
				<GridPicker onInsertGrid={onInsertGrid} />
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={() => onInsertDefList?.()}
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

			<div className='mx-1 h-6 w-px bg-border' />

			{/* YAML frontmatter editor */}
			<button
				ref={yamlBtnRef}
				type='button'
				onClick={handleYamlBtnClick}
				className={cn(
					'inline-flex h-8 items-center gap-1.5 rounded px-2 text-sm hover:bg-foreground/5',
					showYamlPanel && 'bg-foreground/10',
				)}
				aria-label='Edit frontmatter'
				title='Edit frontmatter YAML'
			>
				<SlidersHorizontal className='h-4 w-4' />
				<span className='hidden sm:inline'>Format</span>
			</button>

			{yamlPortal}
		</div>
	)
}
