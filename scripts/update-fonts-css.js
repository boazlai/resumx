#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const cssPath = resolve(process.cwd(), 'styles', 'fonts.css')
const fontsDir = resolve(process.cwd(), 'styles', 'fonts')
if (!existsSync(cssPath)) {
	console.error('fonts.css not found at', cssPath)
	process.exit(1)
}
if (!existsSync(fontsDir)) {
	console.error('fonts dir not found at', fontsDir)
	process.exit(1)
}

const files = readdirSync(fontsDir)

let css = readFileSync(cssPath, 'utf8')

const mappings = [
	{ key: 'Inter', pattern: /Inter[^\\s']*\.woff2/i },
	{ key: 'Roboto', pattern: /Roboto[^\\s']*\.woff2/i },
	{ key: 'Merriweather', pattern: /Merriweather[^\\s']*\.woff2/i },
	{ key: 'SourceCodePro', pattern: /SourceCodePro[^\\s']*\.woff2/i },
]

for (const m of mappings) {
	const found = files.find(f => f.toLowerCase().includes(m.key.toLowerCase()))
	if (found) {
		// replace any occurrence of fonts/<key>*.woff2 with fonts/<found>
		css = css.replace(
			new RegExp(`fonts\\/` + m.key + `[^\\)\\s']*\\.woff2`, 'gi'),
			`fonts/${found}`,
		)
		console.log('Mapped', m.key, '->', found)
	} else {
		console.warn('No font file found for', m.key)
	}
}

writeFileSync(cssPath, css, 'utf8')
console.log('Updated', cssPath)
