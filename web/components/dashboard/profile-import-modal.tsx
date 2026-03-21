'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/lib/toast'

const MAX_LINKEDIN_BYTES = 10 * 1024 * 1024 // 10 MB

export function ProfileImportModal() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { toast } = useToast()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [githubToken, setGithubToken] = useState<string | null>(null)
	const [linkedinFile, setLinkedinFile] = useState<File | null>(null)

	// After GitHub OAuth redirect, ?gh=1 is present — auto-open and capture token
	useEffect(() => {
		if (searchParams.get('gh') !== '1') return
		;(async () => {
			const supabase = createClient()
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (session?.provider_token) {
				setGithubToken(session.provider_token)
			}
			setOpen(true)
			// Clean ?gh=1 from URL without triggering navigation
			const url = new URL(window.location.href)
			url.searchParams.delete('gh')
			window.history.replaceState({}, '', url.toString())
		})()
	}, [searchParams])

	async function handleGitHubConnect() {
		const supabase = createClient()
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard?gh=1')}`,
				scopes: 'read:user user:email public_repo',
			},
		})
		if (error) {
			toast({ title: error.message, variant: 'destructive' })
		}
	}

	function handleLinkedInFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0] ?? null
		if (!file) return
		if (!file.name.toLowerCase().endsWith('.pdf')) {
			toast({
				title: 'Must be a PDF file',
				description: 'Export your LinkedIn profile as a PDF first.',
				variant: 'destructive',
			})
			e.target.value = ''
			return
		}
		if (file.size > MAX_LINKEDIN_BYTES) {
			toast({ title: 'File too large (10 MB max)', variant: 'destructive' })
			e.target.value = ''
			return
		}
		setLinkedinFile(file)
	}

	function handleRemoveLinkedIn() {
		setLinkedinFile(null)
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	async function handleImport() {
		if (!githubToken && !linkedinFile) return
		setLoading(true)
		try {
			let linkedinBase64: string | undefined
			if (linkedinFile) {
				linkedinBase64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader()
					reader.onload = () => {
						// result is a data URL: "data:application/pdf;base64,<data>"
						const dataUrl = reader.result as string
						resolve(dataUrl.split(',')[1])
					}
					reader.onerror = reject
					reader.readAsDataURL(linkedinFile)
				})
			}

			const importRes = await fetch('/api/profile/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					linkedinFile: linkedinBase64,
					linkedinFilename: linkedinFile?.name,
				}),
			})

			if (!importRes.ok) {
				const err = (await importRes.json().catch(() => ({}))) as {
					error?: string
				}
				toast({
					title: err.error ?? 'Import failed',
					variant: 'destructive',
				})
				setLoading(false)
				return
			}

			const { markdown } = (await importRes.json()) as { markdown: string }

			const resumeRes = await fetch('/api/resume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'My Resume', markdown }),
			})

			if (!resumeRes.ok) {
				toast({ title: 'Failed to save resume', variant: 'destructive' })
				setLoading(false)
				return
			}

			const { id } = (await resumeRes.json()) as { id: string }
			setOpen(false)
			router.push(`/resume/${id}`)
		} catch {
			toast({ title: 'Something went wrong', variant: 'destructive' })
			setLoading(false)
		}
	}

	const sourceCount = (githubToken ? 1 : 0) + (linkedinFile ? 1 : 0)

	return (
		<>
			<Button variant='outline' onClick={() => setOpen(true)}>
				<Sparkles className='h-4 w-4' />
				Import from Profile
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Import from Profile</DialogTitle>
						<DialogDescription>
							Connect your GitHub and/or upload your LinkedIn PDF. AI will
							generate a complete resume draft.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-3 py-2'>
						{/* GitHub section */}
						<div className='rounded-lg border p-4 space-y-2'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<svg
										className='w-5 h-5'
										viewBox='0 0 24 24'
										fill='currentColor'
										aria-hidden='true'
									>
										<path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z' />
									</svg>
									<span className='text-sm font-medium'>GitHub</span>
								</div>
								{githubToken ?
									<div className='flex items-center gap-2'>
										<span className='text-xs text-green-600 font-medium'>
											✓ Connected
										</span>
										<button
											type='button'
											onClick={() => setGithubToken(null)}
											className='text-xs text-muted-foreground hover:text-foreground underline'
										>
											Disconnect
										</button>
									</div>
								:	<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={handleGitHubConnect}
										disabled={loading}
									>
										Connect
									</Button>
								}
							</div>
							<p className='text-xs text-muted-foreground'>
								Imports your public repositories and profile bio.
							</p>
						</div>

						{/* LinkedIn section */}
						<div className='rounded-lg border p-4 space-y-2'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<svg
										className='w-5 h-5 text-[#0A66C2]'
										viewBox='0 0 24 24'
										fill='currentColor'
										aria-hidden='true'
									>
										<path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
									</svg>
									<span className='text-sm font-medium'>LinkedIn</span>
								</div>
								{linkedinFile ?
									<div className='flex items-center gap-2'>
										<span className='text-xs text-green-600 font-medium'>
											✓ Ready
										</span>
										<button
											type='button'
											onClick={handleRemoveLinkedIn}
											className='text-xs text-muted-foreground hover:text-foreground underline'
										>
											Remove
										</button>
									</div>
								:	<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => fileInputRef.current?.click()}
										disabled={loading}
									>
										Upload PDF
									</Button>
								}
							</div>
							<p className='text-xs text-muted-foreground'>
								{linkedinFile ?
									`${linkedinFile.name} (${(linkedinFile.size / 1024).toFixed(0)} KB)`
								:	'On LinkedIn: Me → Save to PDF. Upload that file here.'}
							</p>
							<input
								ref={fileInputRef}
								type='file'
								accept='.pdf'
								aria-label='Upload LinkedIn PDF'
								className='hidden'
								onChange={handleLinkedInFileChange}
							/>
						</div>
					</div>

					<div className='flex justify-end gap-2 pt-1'>
						<Button
							variant='ghost'
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleImport}
							disabled={sourceCount === 0 || loading}
						>
							{loading ?
								'Generating…'
							: sourceCount > 0 ?
								`Generate Resume (${sourceCount} source${sourceCount > 1 ? 's' : ''})`
							:	'Select a source first'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
