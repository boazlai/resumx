import type { Metadata } from 'next'
import './globals.css'
import { ToastContextProvider } from '@/lib/toast'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/lib/theme'

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
				{/* Avoid flash of wrong theme */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){var t=localStorage.getItem('theme');var dark=['dark','catppuccin-mocha','one-dark-pro','dracula','nord','tokyo-night'];if(dark.indexOf(t)!==-1)document.documentElement.classList.add('dark');var cls={'catppuccin-mocha':'theme-catppuccin-mocha','catppuccin-latte':'theme-catppuccin-latte','one-dark-pro':'theme-one-dark-pro','dracula':'theme-dracula','nord':'theme-nord','solarized-light':'theme-solarized-light','tokyo-night':'theme-tokyo-night'};if(cls[t])document.documentElement.classList.add(cls[t]);})()`,
					}}
				/>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin='anonymous'
				/>
				{/* All fonts available in the font picker + for custom CSS files */}
				<link
					href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lato:ital,wght@0,400;0,700;1,400&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Fira+Code:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap'
					rel='stylesheet'
				/>
			</head>
			<body className='antialiased' suppressHydrationWarning>
				<ThemeProvider>
					<ToastContextProvider>
						{children}
						<Toaster />
					</ToastContextProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
