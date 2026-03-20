'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ColorPickerProps {
	value?: string
	onChange: (hex: string) => void
}

export default function ColorPicker({
	value = '#000000',
	onChange,
}: ColorPickerProps) {
	const ref = useRef<HTMLDivElement | null>(null)
	const pickrRef = useRef<any>(null)
	const [pickrLoaded, setPickrLoaded] = useState(false)

	useEffect(() => {
		let mounted = true
		// Use native EyeDropper if available for quick pick
		const init = async () => {
			if (!ref.current) return
			try {
				// Dynamically import Pickr for richer UI; fall back to native input if not available
				const PickrModule = await import('@simonwep/pickr')
				// import css via side-effect
				await import('@simonwep/pickr/dist/themes/classic.min.css')
				const Pickr = (PickrModule as any).default ?? (PickrModule as any)
				if (!mounted) return
				// create a button anchor
				ref.current.style.display = 'inline-flex'
				ref.current.style.alignItems = 'center'
				ref.current.style.gap = '4px'
				const el = document.createElement('button')
				el.type = 'button'
				el.className = 'h-8 w-8 rounded border p-0'
				el.style.background = value
				ref.current.appendChild(el)
				const swatches = [
					'#000000',
					'#111111',
					'#222222',
					'#333333',
					'#444444',
					'#555555',
					'#666666',
					'#777777',
					'#888888',
					'#999999',
					'#AAAAAA',
					'#BBBBBB',
					'#CCCCCC',
					'#DDDDDD',
					'#EEEEEE',
					'#FFFFFF',
					'#ff0000',
					'#ff4d4d',
					'#ff8a00',
					'#ffb84d',
					'#ffd12a',
					'#fff18a',
					'#c1e1c1',
					'#a1d99b',
					'#5cb85c',
					'#2ca02c',
					'#1f77b4',
					'#4da6ff',
					'#6a5acd',
					'#9467bd',
					'#8c564b',
					'#c49c6c',
					'#f06292',
					'#d62728',
					'#17becf',
					'#9edae5',
					'#e377c2',
					'#7f7f7f',
					'#bcbd22',
					'#393b79',
					'#5254a3',
					'#7b4173',
				]
				// add an eyedropper button if browser supports the EyeDropper API
				const eyeBtn = document.createElement('button')
				eyeBtn.type = 'button'
				eyeBtn.className = 'ml-1 h-8 w-8 rounded border p-0'
				eyeBtn.title = 'Eyedropper'
				eyeBtn.innerText = '⊙'
				ref.current.appendChild(eyeBtn)

				const p = Pickr.create({
					el,
					theme: 'classic',
					default: value,
					swatches,
					components: {
						preview: true,
						opacity: true,
						hue: true,
						interaction: {
							hex: true,
							input: true,
							save: true,
							cancel: true,
						},
					},
				})
				pickrRef.current = p
				setPickrLoaded(true)
				p.on('save', (color: any) => {
					const hex = color.toHEXA().toString()
					el.style.background = hex
					onChange(hex)
					p.hide()
				})
				p.on('change', (color: any) => {
					// live preview while dragging
					const hex = color.toHEXA().toString()
					el.style.background = hex
				})
				// EyeDropper integration
				if ('EyeDropper' in window) {
					eyeBtn.addEventListener('click', async () => {
						try {
							// @ts-ignore
							const picker = new window.EyeDropper()
							const result = await picker.open()
							if (result && result.sRGBHex) {
								el.style.background = result.sRGBHex
								onChange(result.sRGBHex)
							}
						} catch (err) {
							console.warn('EyeDropper failed', err)
						}
					})
				} else {
					// hide eyedropper button if not supported
					eyeBtn.style.display = 'none'
				}
			} catch {
				// noop — fallback input will be rendered
			}
		}
		init()
		return () => {
			mounted = false
			try {
				pickrRef.current?.destroy?.()
			} catch {}
		}
	}, [])

	return (
		<div className='inline-flex items-center'>
			<div ref={ref} />
			{/* Fallback native color input — hidden once Pickr loads */}
			{!pickrLoaded && (
				<input
					type='color'
					defaultValue={value}
					onChange={e => onChange(e.target.value)}
					aria-label='Pick color'
					className='h-8 w-8 p-0 border rounded'
				/>
			)}
		</div>
	)
}
