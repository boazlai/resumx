'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 50

interface TagEditorProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	initialTags: string[]
	onSave: (tags: string[]) => void
}

export function TagEditor({
	open,
	onOpenChange,
	initialTags,
	onSave,
}: TagEditorProps) {
	const [tags, setTags] = useState<string[]>(initialTags)
	const [input, setInput] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	// Reset when dialog opens
	function handleOpenChange(next: boolean) {
		if (next) {
			setTags(initialTags)
			setInput('')
		}
		onOpenChange(next)
	}

	function addTag() {
		const value = input.trim().slice(0, MAX_TAG_LENGTH)
		if (!value) return
		if (tags.includes(value)) {
			setInput('')
			return
		}
		if (tags.length >= MAX_TAGS) return
		setTags(prev => [...prev, value])
		setInput('')
	}

	function removeTag(tag: string) {
		setTags(prev => prev.filter(t => t !== tag))
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			addTag()
		} else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
			setTags(prev => prev.slice(0, -1))
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Tags</DialogTitle>
					<DialogDescription>
						Add up to {MAX_TAGS} tags to organize your resumes.
					</DialogDescription>
				</DialogHeader>

				{/* Tag chips + input */}
				<div
					className='flex flex-wrap gap-1.5 min-h-10 border rounded-md px-3 py-2 cursor-text'
					onClick={() => inputRef.current?.focus()}
				>
					{tags.map(tag => (
						<span
							key={tag}
							className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs'
						>
							{tag}
							<button
								type='button'
								aria-label={`Remove ${tag}`}
								onClick={e => {
									e.stopPropagation()
									removeTag(tag)
								}}
								className='hover:text-foreground transition-colors'
							>
								<X className='h-3 w-3' />
							</button>
						</span>
					))}
					<Input
						ref={inputRef}
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={tags.length === 0 ? 'Type a tag and press Enter…' : ''}
						className='border-0 shadow-none focus-visible:ring-0 p-0 h-6 text-sm flex-1 min-w-24'
						maxLength={MAX_TAG_LENGTH}
						disabled={tags.length >= MAX_TAGS}
						aria-label='New tag'
					/>
				</div>

				<p className='text-xs text-muted-foreground'>
					{tags.length}/{MAX_TAGS} tags
				</p>

				<div className='flex justify-end gap-2 mt-1'>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={() => onSave(tags)}>Save</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
