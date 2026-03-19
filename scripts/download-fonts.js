#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const BROWSER_UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function fetchText(url) {
	const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
	if (!res.ok) throw new Error(`Fetch failed: ${url} -> ${res.status}`)
	return await res.text()
}

async function fetchArrayBuffer(url) {
	const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } })
	if (!res.ok) throw new Error(`Fetch failed: ${url} -> ${res.status}`)
	return await res.arrayBuffer()
}

function ensureDir(dir) {
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function sanitizeFilename(name) {
	return name.replace(/[^a-z0-9.-]/gi, '_')
}

async function downloadFonts() {
	const outDir = resolve(process.cwd(), 'styles', 'fonts')
	ensureDir(outDir)

	const families = [
		{
			css: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
			hint: 'Inter',
		},
		{
			css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
			hint: 'Roboto',
		},
		{
			css: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400&display=swap',
			hint: 'Merriweather',
		},
		{
			css: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400&display=swap',
			hint: 'SourceCodePro',
		},
	]

	for (const fam of families) {
		console.log('Fetching CSS for', fam.hint)
		const css = await fetchText(fam.css)
		// Extract all remote URLs (fonts.gstatic.com)
		const urlRegex = /url\((https?:\/\/[^)]+)\) format\('woff2'\)/g
		let m
		while ((m = urlRegex.exec(css)) !== null) {
			const url = m[1]
			try {
				console.log('  downloading', url)
				const buf = await fetchArrayBuffer(url)
				const fname = sanitizeFilename(fam.hint + '-' + url.split('/').pop())
				const outPath = resolve(outDir, fname)
				writeFileSync(outPath, Buffer.from(buf))
				console.log('  saved ->', outPath)
			} catch (err) {
				console.error('  failed to download', url, err.message)
			}
		}
	}
	console.log(
		'Done. Place any missing or preferred WOFF2 files in styles/fonts/',
	)
}

downloadFonts().catch(err => {
	console.error('Font download failed:', err)
	process.exit(1)
})
