'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function HowToBanner() {
	const [expanded, setExpanded] = useState(false)

	return (
		<div className='border rounded-lg bg-muted/20 px-4 py-3'>
			<button
				type='button'
				onClick={() => setExpanded(e => !e)}
				className='flex items-center gap-2 text-sm font-medium w-full text-left'
			>
				{expanded ?
					<ChevronDown className='h-4 w-4' />
				:	<ChevronRight className='h-4 w-4' />}
				How to Use Icons
			</button>

			{expanded && (
				<div className='mt-3 space-y-2 text-xs text-muted-foreground'>
					<p>
						<code className='bg-muted px-1 rounded'>:react:</code> — use a
						built-in icon (600+ bundled)
					</p>
					<p>
						<code className='bg-muted px-1 rounded'>:devicon/react:</code> — use
						any of 200,000+ Iconify icons
					</p>
					<p>
						Custom icons: upload your own, then use{' '}
						<code className='bg-muted px-1 rounded'>:my-icon:</code> in your
						resume. The URL is auto-added to frontmatter.
					</p>
					<p className='pt-1'>
						Click any icon to copy its shortcode to clipboard.
					</p>
				</div>
			)}
		</div>
	)
}
