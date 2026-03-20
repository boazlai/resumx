import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'
import { Facet } from '@codemirror/state'
import manifest from '@/lib/icons-manifest.json'

const builtInNames = new Set(manifest.map(i => i.name))

/** Icon token found in the document, e.g. `:react:` or `:devicon/react:` */
const ICON_RE = /:([\w][\w/.-]{0,60}):/g

interface IconAutoInsertConfig {
	/** The current YAML frontmatter string (without `---` fences) */
	frontmatter: string
	/** User-uploaded icons (name → URL) */
	userIcons: Map<string, string>
	/** Callback to update frontmatter with new icon entries */
	onUpdate: (newFrontmatter: string) => void
}

/**
 * Facet that provides the config to the ViewPlugin.
 * The editor component reconfigures this whenever frontmatter or user icons change.
 */
export const iconAutoInsertConfig = Facet.define<
	IconAutoInsertConfig,
	IconAutoInsertConfig
>({
	combine(inputs) {
		return (
			inputs[inputs.length - 1] ?? {
				frontmatter: '',
				userIcons: new Map(),
				onUpdate: () => {},
			}
		)
	},
})

/**
 * Extract existing icon keys from the `icons:` block in frontmatter YAML.
 * Handles the simple flat format: `icons:\n  name: 'url'\n  name2: 'url2'`
 */
function parseExistingIcons(frontmatter: string): Set<string> {
	const result = new Set<string>()
	const match = frontmatter.match(/^icons:\s*$/m)
	if (!match) return result

	const startIdx = (match.index ?? 0) + match[0].length
	const lines = frontmatter.slice(startIdx).split('\n')
	for (const line of lines) {
		// Stop at next top-level key or empty block
		if (/^\S/.test(line) && line.trim() !== '') break
		const m = line.match(/^\s+([\w/.-]+)\s*:/)
		if (m) result.add(m[1])
	}
	return result
}

/**
 * Append icon entries to the frontmatter `icons:` block.
 * If no `icons:` block exists, creates one at the end.
 */
function appendIconsToFrontmatter(
	frontmatter: string,
	newEntries: Map<string, string>,
): string {
	if (newEntries.size === 0) return frontmatter

	const lines = Array.from(newEntries)
		.map(([name, url]) => `  ${name}: '${url}'`)
		.join('\n')

	if (/^icons:\s*$/m.test(frontmatter)) {
		// Find the end of the icons block and append
		const result = frontmatter.replace(/^(icons:\s*$)/m, `$1\n${lines}`)
		return result
	}

	// No icons block exists — create one at the end
	return `${frontmatter.trimEnd()}\nicons:\n${lines}`
}

export const iconAutoInsert = ViewPlugin.fromClass(
	class {
		private timer: ReturnType<typeof setTimeout> | null = null

		update(update: ViewUpdate) {
			if (!update.docChanged) return

			// Debounce to avoid rapid re-parses
			if (this.timer) clearTimeout(this.timer)
			this.timer = setTimeout(() => this.check(update.view), 500)
		}

		check(view: EditorView) {
			const config = view.state.facet(iconAutoInsertConfig)
			if (!config.onUpdate) return

			const doc = view.state.doc.toString()
			const existing = parseExistingIcons(config.frontmatter)
			const toAdd = new Map<string, string>()

			for (const match of doc.matchAll(ICON_RE)) {
				const name = match[1]

				// Skip if already in frontmatter
				if (existing.has(name)) continue

				// Skip built-in icons (no URL needed)
				if (builtInNames.has(name)) continue

				// User-uploaded icon
				if (config.userIcons.has(name)) {
					toAdd.set(name, config.userIcons.get(name)!)
					continue
				}

				// Iconify icon (contains `/`)
				if (name.includes('/')) {
					const url = `https://api.iconify.design/${name}.svg`
					toAdd.set(name, url)
				}
			}

			if (toAdd.size > 0) {
				const newFrontmatter = appendIconsToFrontmatter(
					config.frontmatter,
					toAdd,
				)
				config.onUpdate(newFrontmatter)
			}
		}

		destroy() {
			if (this.timer) clearTimeout(this.timer)
		}
	},
)
