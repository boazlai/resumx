'use client'

import { FileText, Loader2, AlertCircle } from 'lucide-react'

type Props = {
	url: string | null
	loading: boolean
	error: string | null
}

export function PdfPreview({ url, loading, error }: Props) {
	if (error) {
		return (
			<div className='h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-6'>
				<AlertCircle className='h-8 w-8 text-destructive' />
				<p className='text-sm text-center text-destructive'>{error}</p>
			</div>
		)
	}

	if (!url && !loading) {
		return (
			<div className='h-full flex flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground'>
				<FileText className='h-10 w-10' />
				<p className='text-sm font-medium'>PDF preview will appear here</p>
				<p className='max-w-xs text-xs leading-5'>
					Edit your resume in Markdown, then compile to refresh the rendered
					preview.
				</p>
			</div>
		)
	}

	return (
		<div className='relative h-full bg-muted/30'>
			{loading && (
				<div className='absolute inset-0 flex items-center justify-center bg-background/50 z-10'>
					<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
				</div>
			)}
			{url && (
				<iframe
					src={url}
					className='w-full h-full border-0'
					title='Resume PDF Preview'
				/>
			)}
		</div>
	)
}
