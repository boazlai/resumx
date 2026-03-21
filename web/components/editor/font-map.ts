export const FONT_MAP: Record<string, string> = {
	// Sans-serif
	Inter:
		"Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
	Roboto: "Roboto, Inter, system-ui, -apple-system, 'Segoe UI', Arial",
	'Open Sans': "'Open Sans', Inter, Arial, sans-serif",
	Lato: 'Lato, Inter, system-ui, Arial, sans-serif',
	Montserrat: 'Montserrat, Inter, system-ui, Arial, sans-serif',
	Nunito: 'Nunito, Inter, system-ui, Arial, sans-serif',
	Poppins: 'Poppins, Inter, system-ui, Arial, sans-serif',
	Raleway: 'Raleway, Inter, system-ui, Arial, sans-serif',
	'Work Sans': "'Work Sans', Inter, system-ui, Arial, sans-serif",
	'DM Sans': "'DM Sans', Inter, system-ui, Arial, sans-serif",
	'Plus Jakarta Sans':
		"'Plus Jakarta Sans', Inter, system-ui, Arial, sans-serif",
	'Space Grotesk': "'Space Grotesk', Inter, system-ui, Arial, sans-serif",
	// Serif
	Georgia: "Georgia, 'Times New Roman', Times, serif",
	Merriweather: 'Merriweather, Georgia, serif',
	Lora: 'Lora, Georgia, serif',
	'Playfair Display': "'Playfair Display', Georgia, serif",
	'Source Serif 4': "'Source Serif 4', Georgia, serif",
	'Crimson Pro': "'Crimson Pro', Georgia, serif",
	'EB Garamond': "'EB Garamond', Georgia, serif",
	'PT Serif': "'PT Serif', Georgia, serif",
	// Monospace
	'Source Code Pro':
		"'Source Code Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
	'JetBrains Mono':
		"'JetBrains Mono', 'Source Code Pro', ui-monospace, monospace",
	'Fira Code': "'Fira Code', 'Source Code Pro', ui-monospace, monospace",
	'IBM Plex Mono':
		"'IBM Plex Mono', 'Source Code Pro', ui-monospace, monospace",
}

export type FontGroup = { label: string; fonts: string[] }

export const FONT_GROUPS: FontGroup[] = [
	{
		label: 'Sans-serif',
		fonts: [
			'Inter',
			'Roboto',
			'Open Sans',
			'Lato',
			'Montserrat',
			'Nunito',
			'Poppins',
			'Raleway',
			'Work Sans',
			'DM Sans',
			'Plus Jakarta Sans',
			'Space Grotesk',
		],
	},
	{
		label: 'Serif',
		fonts: [
			'Georgia',
			'Merriweather',
			'Lora',
			'Playfair Display',
			'Source Serif 4',
			'Crimson Pro',
			'EB Garamond',
			'PT Serif',
		],
	},
	{
		label: 'Monospace',
		fonts: ['Source Code Pro', 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono'],
	},
]
