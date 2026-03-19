import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
	const root = path.resolve(__dirname, '..')
	const inlined = path.join(root, 'tmp-render.inlined.html')
	const out = path.join(root, 'resume-inlined.pdf')

	if (!fs.existsSync(inlined)) {
		console.error('Missing', inlined)
		process.exit(2)
	}

	const html = fs.readFileSync(inlined, 'utf8')

	const browser = await chromium.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	})
	const page = await browser.newPage({
		viewport: { width: 1200, height: 1600 },
	})
	await page.setContent(html, { waitUntil: 'load' })
	await page.evaluate(async () => {
		if ('fonts' in document) {
			await document.fonts.ready
		}
	})
	await page.pdf({ path: out, format: 'A4', printBackground: true })
	await browser.close()

	console.log('Wrote', out)
}

run().catch(err => {
	console.error(err)
	process.exit(1)
})
