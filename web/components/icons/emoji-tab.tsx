'use client'

import { useMemo } from 'react'
import { useToast } from '@/lib/toast'

interface EmojiTabProps {
	search: string
	onInsert?: (syntax: string, url: string) => void
}

// Curated emoji shortcodes commonly used in resumes
const EMOJIS: { code: string; emoji: string }[] = [
	{ code: 'star', emoji: '⭐' },
	{ code: 'rocket', emoji: '🚀' },
	{ code: 'fire', emoji: '🔥' },
	{ code: 'sparkles', emoji: '✨' },
	{ code: 'trophy', emoji: '🏆' },
	{ code: 'medal', emoji: '🏅' },
	{ code: 'target', emoji: '🎯' },
	{ code: 'chart-up', emoji: '📈' },
	{ code: 'chart-down', emoji: '📉' },
	{ code: 'bulb', emoji: '💡' },
	{ code: 'wrench', emoji: '🔧' },
	{ code: 'gear', emoji: '⚙️' },
	{ code: 'hammer', emoji: '🔨' },
	{ code: 'laptop', emoji: '💻' },
	{ code: 'phone', emoji: '📱' },
	{ code: 'globe', emoji: '🌍' },
	{ code: 'link', emoji: '🔗' },
	{ code: 'lock', emoji: '🔒' },
	{ code: 'key', emoji: '🔑' },
	{ code: 'shield', emoji: '🛡️' },
	{ code: 'checkmark', emoji: '✅' },
	{ code: 'cross', emoji: '❌' },
	{ code: 'warning', emoji: '⚠️' },
	{ code: 'info', emoji: 'ℹ️' },
	{ code: 'heart', emoji: '❤️' },
	{ code: 'thumbsup', emoji: '👍' },
	{ code: 'handshake', emoji: '🤝' },
	{ code: 'people', emoji: '👥' },
	{ code: 'person', emoji: '👤' },
	{ code: 'graduation', emoji: '🎓' },
	{ code: 'book', emoji: '📚' },
	{ code: 'pencil', emoji: '✏️' },
	{ code: 'megaphone', emoji: '📣' },
	{ code: 'mail', emoji: '📧' },
	{ code: 'calendar', emoji: '📅' },
	{ code: 'clock', emoji: '🕐' },
	{ code: 'money', emoji: '💰' },
	{ code: 'dollar', emoji: '💵' },
	{ code: 'briefcase', emoji: '💼' },
	{ code: 'building', emoji: '🏢' },
	{ code: 'factory', emoji: '🏭' },
	{ code: 'microscope', emoji: '🔬' },
	{ code: 'test-tube', emoji: '🧪' },
	{ code: 'dna', emoji: '🧬' },
	{ code: 'brain', emoji: '🧠' },
	{ code: 'robot', emoji: '🤖' },
	{ code: 'light', emoji: '💡' },
	{ code: 'puzzle', emoji: '🧩' },
	{ code: 'flag', emoji: '🚩' },
	{ code: 'pin', emoji: '📌' },
	{ code: 'package', emoji: '📦' },
	{ code: 'cloud', emoji: '☁️' },
	{ code: 'database', emoji: '🗄️' },
	{ code: 'terminal', emoji: '🖥️' },
	{ code: 'paint', emoji: '🎨' },
	{ code: 'music', emoji: '🎵' },
	{ code: 'video', emoji: '🎬' },
	{ code: 'camera', emoji: '📷' },
	{ code: 'map', emoji: '🗺️' },
	{ code: 'compass', emoji: '🧭' },
	{ code: 'airplane', emoji: '✈️' },
	{ code: 'car', emoji: '🚗' },
	{ code: 'satellite', emoji: '🛰️' },
	{ code: 'atom', emoji: '⚛️' },
	{ code: 'battery', emoji: '🔋' },
	{ code: 'plug', emoji: '🔌' },
	{ code: 'magnet', emoji: '🧲' },
]

export function EmojiTab({ search, onInsert }: EmojiTabProps) {
	const { toast } = useToast()

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim()
		if (!q) return EMOJIS
		return EMOJIS.filter(e => e.code.includes(q) || e.emoji.includes(q))
	}, [search])

	const handleClick = async (emoji: { code: string; emoji: string }) => {
		const syntax = `:${emoji.code}:`
		try {
			await navigator.clipboard.writeText(syntax)
			toast({ title: `Copied ${syntax}` })
		} catch {
			toast({ title: 'Copy failed', variant: 'destructive' })
		}
		onInsert?.(syntax, '')
	}

	return (
		<div className='grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1'>
			{filtered.map(emoji => (
				<button
					key={emoji.code}
					type='button'
					onClick={() => handleClick(emoji)}
					className='group flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 hover:border-border hover:bg-muted/50 transition-colors cursor-pointer'
					title={`:${emoji.code}:`}
				>
					<span className='text-2xl'>{emoji.emoji}</span>
					<span className='text-[10px] text-muted-foreground truncate max-w-[64px] group-hover:text-foreground transition-colors'>
						{emoji.code}
					</span>
				</button>
			))}
		</div>
	)
}
