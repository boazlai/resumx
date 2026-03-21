'use client'

import { useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import {
	closeSpanPopover,
	type SpanPopoverInfo,
} from '@/lib/editor/html-span-decorator'

// ─── Style parsing helpers ────────────────────────────────────────────────────

interface StyleProp {
	property: string
	value: string
}

function parseStyle(styleStr: string): StyleProp[] {
	return styleStr
		.split(';')
		.map(s => s.trim())
		.filter(Boolean)
		.map(s => {
			const colonIdx = s.indexOf(':')
			if (colonIdx === -1) return null
			return {
				property: s.slice(0, colonIdx).trim(),
				value: s.slice(colonIdx + 1).trim(),
			}
		})
		.filter((x): x is StyleProp => x !== null)
}

function buildStyleStr(props: StyleProp[]): string {
	return props.map(p => `${p.property}: ${p.value}`).join('; ')
}

const COLOR_PROPS = new Set(['color', 'background-color', 'border-color'])

/** Normalize a CSS color value to a 6-char hex for <input type="color"> */
function toHexInput(value: string): string {
	if (/^#[0-9a-f]{6}$/i.test(value)) return value
	if (/^#[0-9a-f]{3}$/i.test(value)) {
		const [, r, g, b] = value
		return `#${r}${r}${g}${g}${b}${b}`
	}
	// Fallback — render as text input so the user can fix it
	return ''
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SpanStylePopoverProps {
	info: SpanPopoverInfo
	viewRef: React.MutableRefObject<EditorView | null>
}

export function SpanStylePopover({ info, viewRef }: SpanStylePopoverProps) {
	const [props, setProps] = useState<StyleProp[]>(() =>
		parseStyle(info.styleStr),
	)
	const [newProp, setNewProp] = useState('')
	const [newVal, setNewVal] = useState('')
	const popoverRef = useRef<HTMLDivElement>(null)

	// ── Dismiss on outside mousedown ────────────────────────────────────────
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				popoverRef.current
				&& !popoverRef.current.contains(e.target as Node)
			) {
				viewRef.current?.dispatch({ effects: closeSpanPopover.of(null) })
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [viewRef])

	// ── Dismiss on Escape ───────────────────────────────────────────────────
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				viewRef.current?.dispatch({ effects: closeSpanPopover.of(null) })
			}
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [viewRef])

	// ── Property mutation helpers ─────────────────────────────────────────
	function updateProp(index: number, value: string) {
		setProps(prev => prev.map((p, i) => (i === index ? { ...p, value } : p)))
	}

	function removeProp(index: number) {
		setProps(prev => prev.filter((_, i) => i !== index))
	}

	function addProp() {
		const p = newProp.trim()
		const v = newVal.trim()
		if (!p || !v) return
		setProps(prev => [...prev, { property: p, value: v }])
		setNewProp('')
		setNewVal('')
	}

	// ── Apply / Remove ────────────────────────────────────────────────────
	function handleApply() {
		const view = viewRef.current
		if (!view) return
		const newStyle = buildStyleStr(props)
		const newSpan =
			newStyle.trim() ?
				`<span style="${newStyle}">${info.innerText}</span>`
			:	info.innerText
		view.dispatch({
			changes: { from: info.from, to: info.to, insert: newSpan },
			effects: closeSpanPopover.of(null),
		})
		view.focus()
	}

	function handleRemove() {
		const view = viewRef.current
		if (!view) return
		view.dispatch({
			changes: { from: info.from, to: info.to, insert: info.innerText },
			effects: closeSpanPopover.of(null),
		})
		view.focus()
	}

	// ── Position: keep inside viewport ────────────────────────────────────
	const POPOVER_W = 272
	const left = Math.max(
		8,
		Math.min(
			info.x,
			(typeof window !== 'undefined' ? window.innerWidth : 800) - POPOVER_W - 8,
		),
	)
	const top = info.y

	return (
		<div
			ref={popoverRef}
			style={{ position: 'fixed', left, top, zIndex: 9999, width: POPOVER_W }}
			className='rounded-lg border bg-popover p-3 shadow-lg text-sm text-popover-foreground'
			// Prevent CM from treating clicks inside as blur
			onMouseDown={e => e.stopPropagation()}
		>
			{/* Header */}
			<div className='mb-2.5 flex items-center justify-between'>
				<span className='font-medium'>Inline style</span>
				<button
					type='button'
					onClick={() =>
						viewRef.current?.dispatch({ effects: closeSpanPopover.of(null) })
					}
					className='text-muted-foreground hover:text-foreground leading-none'
					aria-label='Close'
				>
					✕
				</button>
			</div>

			{/* Property rows */}
			<div className='space-y-1.5'>
				{props.map((p, i) => {
					const hexVal = toHexInput(p.value)
					const isColor = COLOR_PROPS.has(p.property)
					return (
						<div key={i} className='flex items-center gap-1.5'>
							<span
								className='w-28 shrink-0 truncate text-xs text-muted-foreground'
								title={p.property}
							>
								{p.property}
							</span>
							{isColor && hexVal ?
								<label className='flex flex-1 items-center gap-1.5'>
									<input
										type='color'
										value={hexVal}
										onChange={e => updateProp(i, e.target.value)}
										className='h-7 w-10 cursor-pointer rounded border p-0.5'
									/>
									<span className='font-mono text-xs text-muted-foreground'>
										{p.value}
									</span>
								</label>
							:	<input
									type='text'
									value={p.value}
									onChange={e => updateProp(i, e.target.value)}
									className='h-7 min-w-0 flex-1 rounded border bg-background px-1.5 text-xs font-mono'
								/>
							}
							<button
								type='button'
								onClick={() => removeProp(i)}
								className='shrink-0 text-muted-foreground hover:text-destructive text-xs leading-none'
								aria-label={`Remove ${p.property}`}
							>
								×
							</button>
						</div>
					)
				})}
			</div>

			{/* Add new property */}
			<div className='mt-2 flex items-center gap-1'>
				<input
					type='text'
					placeholder='property'
					value={newProp}
					onChange={e => setNewProp(e.target.value)}
					className='h-6 w-24 rounded border bg-background px-1.5 text-xs font-mono'
				/>
				<input
					type='text'
					placeholder='value'
					value={newVal}
					onChange={e => setNewVal(e.target.value)}
					onKeyDown={e => e.key === 'Enter' && addProp()}
					className='h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-xs font-mono'
				/>
				<button
					type='button'
					onClick={addProp}
					className='shrink-0 h-6 rounded border px-1.5 text-xs hover:bg-muted'
					title='Add property'
				>
					+
				</button>
			</div>

			{/* Actions */}
			<div className='mt-3 flex gap-2'>
				<button
					type='button'
					onClick={handleApply}
					className='flex-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90'
				>
					Apply
				</button>
				<button
					type='button'
					onClick={handleRemove}
					className='rounded border px-2 py-1 text-xs text-muted-foreground hover:border-destructive hover:text-destructive'
				>
					Remove span
				</button>
			</div>
		</div>
	)
}
