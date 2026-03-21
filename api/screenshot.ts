import type { VercelRequest, VercelResponse } from '@vercel/node'
import { chromium as playwrightCore, type Browser } from 'playwright-core'
import {
	parseFrontmatterFromString,
	extractTagMap,
} from '../src/core/frontmatter.js'
import { resolveView } from '../src/core/view/resolve.js'
import { generateHtml } from '../src/core/html-generator.js'
import { fitToPagesOnPage } from '../src/core/page-fit/index.js'
import { A4_WIDTH_PX } from '../src/core/page-fit/types.js'
import type { DocumentContext } from '../src/core/types.js'
import type { ViewLayer } from '../src/core/view/types.js'

const MAX_MARKDOWN_LENGTH = 50_000
// A4 page height in pixels at 96dpi — same viewport used by the PDF renderer
const A4_HEIGHT_PX = 1123

async function launchBrowser(): Promise<Browser> {
	if (process.env['VERCEL']) {
		const chromium = await import('@sparticuz/chromium')
		return playwrightCore.launch({
			args: chromium.default.args,
			executablePath: await chromium.default.executablePath(),
			headless: true,
		})
	}
	return playwrightCore.launch({ headless: true })
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method not allowed' })
		return
	}

	try {
		const { markdown } = req.body as { markdown?: string }

		if (!markdown || typeof markdown !== 'string') {
			res.status(400).json({ error: 'Missing or invalid markdown field' })
			return
		}

		if (markdown.length > MAX_MARKDOWN_LENGTH) {
			res.status(400).json({ error: 'Content too large (50KB max)' })
			return
		}

		const parsed = parseFrontmatterFromString(markdown)
		if (!parsed.ok) {
			res.status(400).json({ error: parsed.error })
			return
		}

		const layer: ViewLayer = {}
		if (parsed.config) {
			if (parsed.config.sections) layer.sections = parsed.config.sections
			if (parsed.config['bullet-order'])
				layer.bulletOrder = parsed.config['bullet-order']
			if (parsed.config.vars) layer.vars = parsed.config.vars
			if (parsed.config.style) layer.style = parsed.config.style
			if (parsed.config.pages) layer.pages = parsed.config.pages
		}

		const view = resolveView([layer])
		view.format = 'html'

		const doc: DocumentContext = {
			content: parsed.content,
			icons: parsed.config?.icons,
			tagMap: extractTagMap(parsed.config?.tags),
			baseDir: process.cwd(),
		}

		const needsPageFit = view.pages !== null
		const html = await generateHtml(doc, view, { tailwind: 'cdn' })

		let finalHtml = html

		const browser = await launchBrowser()
		try {
			const page = await browser.newPage()
			try {
				await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX })
				await page.setContent(html, { waitUntil: 'networkidle' })

				if (needsPageFit) {
					try {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const result = await fitToPagesOnPage(
							page as any,
							html,
							view.pages!,
						)
						finalHtml = result.html
						await page.setContent(finalHtml, { waitUntil: 'networkidle' })
					} catch {
						// Ignore page fit errors — screenshot the original layout
					}
				}

				const screenshot = await page.screenshot({
					type: 'jpeg',
					quality: 85,
					clip: { x: 0, y: 0, width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
				})

				res.setHeader('Content-Type', 'image/jpeg')
				res.status(200).send(Buffer.from(screenshot))
			} finally {
				await page.close()
			}
		} finally {
			await browser.close()
		}
	} catch (err) {
		console.error('Screenshot error:', err)
		const message =
			err instanceof Error ? err.message : 'Screenshot generation failed'
		res.status(500).json({ error: message })
	}
}
