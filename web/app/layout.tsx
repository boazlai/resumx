import type { Metadata } from 'next'
import './globals.css'
import { ToastContextProvider } from '@/lib/toast'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
	title: 'Resume Editor — Powered by Resumx',
	description:
		'A MS Word-like resume editor that generates perfectly fitted PDFs via Resumx.',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin='anonymous'
				/>
				<link
					href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
					rel='stylesheet'
				/>
			</head>
			<body className='antialiased'>
				<ToastContextProvider>
					{children}
					<Toaster />
				</ToastContextProvider>
			</body>
		</html>
	)
}
