#!/usr/bin/env node
import { readdirSync, copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const fontsDir = resolve(process.cwd(), 'styles', 'fonts')
if (!existsSync(fontsDir)) {
	console.error('fonts directory not found:', fontsDir)
	process.exit(1)
}

const files = readdirSync(fontsDir).filter(f =>
	f.toLowerCase().endsWith('.woff2'),
)
if (files.length === 0) {
	console.error('no woff2 files found in', fontsDir)
	process.exit(1)
}

function findAndCopy(pattern, outName) {
	const found = files.find(f => f.toLowerCase().includes(pattern))
	if (!found) {
		console.warn('no font matching', pattern)
		return
	}
	const src = resolve(fontsDir, found)
	const dest = resolve(fontsDir, outName)
	copyFileSync(src, dest)
	console.log('copied', found, '->', outName)
}

findAndCopy('inter', 'Inter-Regular.woff2')
findAndCopy('inter', 'Inter-Bold.woff2')
findAndCopy('roboto', 'Roboto-Regular.woff2')
findAndCopy('merriweather', 'Merriweather-Regular.woff2')
findAndCopy('sourcecodepro', 'SourceCodePro-Regular.woff2')

console.log('done')
