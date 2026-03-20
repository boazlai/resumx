'use client'

import { useToast } from '@/lib/toast'

interface IconCardProps {
	name: string
	/** URL to the icon image (SVG/PNG/JPG) */
	src: string
	/** If true, clicking also triggers onInsert callback */
	onInsert?: (syntax: string, url: string) => void
}

export function IconCard({ name, src, onInsert }: IconCardProps) {
	const { toast } = useToast()

	const syntax = `:${name}:`

	const handleClick = async () => {
		try {
			await navigator.clipboard.writeText(syntax)
			toast({ title: `Copied ${syntax}` })
		} catch {
			toast({ title: 'Copy failed', variant: 'destructive' })
		}
		onInsert?.(syntax, src)
	}

	return (
		<button
			type='button'
			onClick={handleClick}
			className='group flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 hover:border-border hover:bg-muted/50 transition-colors cursor-pointer'
			title={syntax}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={name}
				className='h-8 w-8 object-contain'
				loading='lazy'
			/>
			<span className='text-[10px] text-muted-foreground truncate max-w-[64px] group-hover:text-foreground transition-colors'>
				{name}
			</span>
		</button>
	)
}
