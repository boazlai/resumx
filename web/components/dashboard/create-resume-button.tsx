'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/toast'

export function CreateResumeButton() {
	const router = useRouter()
	const { toast } = useToast()
	const [open, setOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		const res = await fetch('/api/resume', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: title.trim() || 'Untitled Resume' }),
		})

		if (!res.ok) {
			toast({ title: 'Failed to create resume', variant: 'destructive' })
			setLoading(false)
			return
		}

		const data = await res.json()
		setOpen(false)
		setTitle('')
		router.push(`/resume/${data.id}`)
	}

	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<Plus className='h-4 w-4' />
				New Resume
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Resume</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleCreate} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='title'>Title</Label>
							<Input
								id='title'
								placeholder='e.g. Software Engineer — Google'
								value={title}
								onChange={e => setTitle(e.target.value)}
								autoFocus
							/>
						</div>
						<div className='flex justify-end gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={loading}>
								{loading ? 'Creating…' : 'Create'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
