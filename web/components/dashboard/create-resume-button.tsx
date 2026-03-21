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
	const [loading, setLoading] = useState(false)
	const [title, setTitle] = useState('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [location, setLocation] = useState('')

	function handleClose(nextOpen: boolean) {
		if (!nextOpen) {
			setTitle('')
			setName('')
			setEmail('')
			setPhone('')
			setLocation('')
		}
		setOpen(nextOpen)
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		try {
			const resolvedTitle = title.trim() || 'Untitled Resume'
			const markdown = buildMarkdown(name, email, phone, location)

			const res = await fetch('/api/resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: resolvedTitle, markdown }),
			})
			if (!res.ok) {
				toast({ title: 'Failed to create resume', variant: 'destructive' })
				setLoading(false)
				return
			}
			const data = (await res.json()) as { id: string }
			handleClose(false)
			router.push(`/resume/${data.id}`)
		} catch {
			toast({ title: 'Something went wrong', variant: 'destructive' })
			setLoading(false)
		}
	}

	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<Plus className='h-4 w-4' />
				New Resume
			</Button>

			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>New Resume</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='space-y-4 pt-1'>
						<div className='space-y-1.5'>
							<Label htmlFor='title'>Title</Label>
							<Input
								id='title'
								placeholder='e.g. Software Engineer — Google'
								value={title}
								onChange={e => setTitle(e.target.value)}
								autoFocus
							/>
						</div>

						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<span className='w-full border-t' />
							</div>
							<div className='relative flex justify-center text-xs uppercase'>
								<span className='bg-background px-2 text-muted-foreground'>
									Contact info (optional)
								</span>
							</div>
						</div>

						<div className='space-y-3'>
							<div className='space-y-1.5'>
								<Label htmlFor='name'>Full Name</Label>
								<Input
									id='name'
									placeholder='Jane Smith'
									value={name}
									onChange={e => setName(e.target.value)}
								/>
							</div>
							<div className='space-y-1.5'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									placeholder='jane@example.com'
									value={email}
									onChange={e => setEmail(e.target.value)}
								/>
							</div>
							<div className='grid grid-cols-2 gap-3'>
								<div className='space-y-1.5'>
									<Label htmlFor='phone'>Phone</Label>
									<Input
										id='phone'
										type='tel'
										placeholder='+1 555 000 0000'
										value={phone}
										onChange={e => setPhone(e.target.value)}
									/>
								</div>
								<div className='space-y-1.5'>
									<Label htmlFor='location'>Location</Label>
									<Input
										id='location'
										placeholder='San Francisco, CA'
										value={location}
										onChange={e => setLocation(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className='flex justify-end gap-2 pt-1'>
							<Button
								type='button'
								variant='ghost'
								onClick={() => handleClose(false)}
								disabled={loading}
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

function buildMarkdown(
	name: string,
	email: string,
	phone: string,
	location: string,
): string {
	const nameLine = name.trim() || 'Your Name'

	const contactParts = [
		email.trim() ? `[${email.trim()}](mailto:${email.trim()})` : null,
		phone.trim() || null,
		location.trim() || null,
	].filter(Boolean) as string[]

	const contactLine =
		contactParts.length > 0 ?
			contactParts.join(' | ')
		:	'[email@example.com](mailto:email@example.com) | [linkedin.com/in/yourname](https://linkedin.com/in/yourname) | [github.com/yourname](https://github.com/yourname)'

	return `---
pages: 1
---

# ${nameLine}

${contactLine}

## Work Experience

### Company Name || Month Year – Present

*Job Title* || City, State

- Describe your impact here with a quantified achievement
- Another bullet point about what you built or improved

## Education

### University Name || Graduation Year

**Degree, Major** || City, State

- GPA, honors, relevant coursework

## Projects

### Project Name

- Built X using Y, resulting in Z
- [GitHub](https://github.com)

## Technical Skills

Languages
: TypeScript, Python, Go

Frameworks
: React, Node.js, Next.js

Tools
: Git, Docker, AWS`
}
