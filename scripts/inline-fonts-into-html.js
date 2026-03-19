import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const htmlPath = path.join(root, 'tmp-render.html')
const outPath = path.join(root, 'tmp-render.inlined.html')

if (!fs.existsSync(htmlPath)) {
	console.error('tmp-render.html not found')
	process.exit(2)
}

let html = fs.readFileSync(htmlPath, 'utf8')

const fontUrlRe = /url\(['"]?(fonts\/[^'"\)]+)['"]?\)/g
let match
const replaced = new Map()

while ((match = fontUrlRe.exec(html)) !== null) {
	const rel = match[1]
	if (replaced.has(rel)) continue
	const filename = path.basename(rel)

	// candidate directories
	const candidates = [
		path.join(root, 'styles', 'fonts', filename),
		path.join(root, 'public', 'fonts', filename),
		path.join(root, 'styles', 'fonts', rel),
		path.join(root, 'public', rel),
		path.join(root, 'styles', rel),
		path.join(root, rel),
	]

	const found = candidates.find(p => fs.existsSync(p))
	if (!found) {
		console.warn(
			'Font file not found for',
			rel,
			'checked',
			candidates.map(p => path.relative(root, p)).join(', '),
		)
		continue
	}

	const buf = fs.readFileSync(found)
	const b64 = buf.toString('base64')
	const dataUri = `url('data:font/woff2;base64,${b64}')`
	html = html.split(match[0]).join(dataUri)
	replaced.set(rel, true)
	console.log('Inlined', rel, '->', path.relative(root, found))
}

fs.writeFileSync(outPath, html, 'utf8')
console.log('Wrote', outPath)
