#!/usr/bin/env npx tsx
/**
 * Generate style option types from CSS custom properties in base.css.
 *
 * Parses the :root block in styles/common/base.css, extracts variable names
 * and enum constraints from inline comments, then writes:
 *   - src/core/style-options.generated.ts  (TypeScript constants + types)
 *   - schemas/style-options.schema.json    (JSON Schema for editor tooling)
 *
 * CSS is the single source of truth. Variables marked @internal are excluded.
 *
 * Comment conventions:
 *   --var: default;  /* value1 | value2 | value3 *\/    → enum
 *   --var: default;  /* any color *\/                   → freeform string
 *   --var: default;  /* @number any unitless ratio *\/  → string | number
 *   --var: default;  /* @internal ... *\/               → excluded
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CSS_PATH = resolve(ROOT, 'styles/common/base.css')
const TS_OUT = resolve(ROOT, 'src/core/style-options.generated.ts')
const JSON_OUT = resolve(ROOT, 'schemas/style-options.schema.json')

interface StyleOptionDef {
	name: string
	values: (string | number)[] | null
	numeric: boolean
}

/**
 * Detect whether a CSS comment describes an enum (pipe-separated values)
 * or a freeform value (starts with "any" or has no pipes).
 */
function parseComment(comment: string): (string | number)[] | null {
	const trimmed = comment.trim()
	if (trimmed.startsWith('any ') || trimmed === 'any') return null
	if (!trimmed.includes('|')) return null

	const parts = trimmed.split('|').map(s => s.trim())
	if (parts.some(p => p.startsWith('any ') || p === 'any')) return null
	if (parts.some(p => p.includes(' '))) return null
	if (parts.length < 2) return null

	return parts.map(p => (/^\d+$/.test(p) ? Number(p) : p))
}

export function extractStyleOptions(css: string): StyleOptionDef[] {
	const rootMatch = css.match(/:root\s*\{([\s\S]*?)\n\t\}/)
	if (!rootMatch?.[1]) {
		throw new Error('Could not find :root block in base.css')
	}

	const rootContent = rootMatch[1]
	const options: StyleOptionDef[] = []

	const varStartPattern = /--([\w-]+)\s*:/g
	let startMatch: RegExpExecArray | null

	while ((startMatch = varStartPattern.exec(rootContent)) !== null) {
		const varName = startMatch[1]!
		const afterName = rootContent.slice(startMatch.index + startMatch[0].length)

		const semiIdx = afterName.indexOf(';')
		if (semiIdx === -1) continue

		const afterSemi = afterName.slice(semiIdx + 1)
		const commentMatch = afterSemi.match(/^\s*\/\*\s*(.*?)\s*\*\//)
		const comment = commentMatch?.[1] ?? null

		if (comment?.startsWith('@internal')) continue

		const numeric = comment?.startsWith('@number') ?? false
		const effectiveComment =
			numeric ?
				comment!.slice('@number'.length).replace(/^[,\s]+/, '')
			:	comment

		options.push({
			name: varName,
			values: effectiveComment ? parseComment(effectiveComment) : null,
			numeric,
		})
	}

	return options
}

function generateTS(options: StyleOptionDef[]): string {
	const names = options.map(o => `\t'${o.name}',`).join('\n')
	const enums = options
		.filter(o => o.values !== null)
		.map(o => {
			const vals = o.values!.map(v => `'${v}'`).join(', ')
			return `\t'${o.name}': [${vals}],`
		})
		.join('\n')
	// Number enum values are stringified (e.g. '400') because the
	// runtime validator coerces rawValue to String before comparison.

	return `// Auto-generated from styles/common/base.css — do not edit manually.
// Run: pnpm run generate:style-options

export const STYLE_OPTIONS = [
${names}
] as const

export type StyleOption = (typeof STYLE_OPTIONS)[number]

export const STYLE_ENUM_VALUES: Partial<
\tRecord<StyleOption, readonly string[]>
> = {
${enums}
}
`
}

function generateJSONSchema(options: StyleOptionDef[]): string {
	const properties: Record<string, object> = {}
	for (const opt of options) {
		if (opt.values) {
			const hasMixedTypes = opt.values.some(v => typeof v === 'number')
			if (hasMixedTypes) {
				properties[opt.name] = { enum: opt.values }
			} else {
				properties[opt.name] = { type: 'string', enum: opt.values }
			}
		} else if (opt.numeric) {
			properties[opt.name] = { type: ['string', 'number'] }
		} else {
			properties[opt.name] = { type: 'string' }
		}
	}

	const schema = {
		$schema: 'http://json-schema.org/draft-07/schema#',
		description:
			'Style options for Resumx frontmatter. Auto-generated from styles/common/base.css.',
		type: 'object',
		properties,
		additionalProperties: false,
	}

	return JSON.stringify(schema, null, '\t') + '\n'
}

export function generate(): { ts: string; json: string } {
	const css = readFileSync(CSS_PATH, 'utf-8')
	const options = extractStyleOptions(css)

	if (options.length === 0) {
		throw new Error('No style options found in base.css :root block')
	}

	return {
		ts: generateTS(options),
		json: generateJSONSchema(options),
	}
}

const isMain =
	process.argv[1]
	&& resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
	const css = readFileSync(CSS_PATH, 'utf-8')
	const options = extractStyleOptions(css)
	const { ts, json } = generate()
	writeFileSync(TS_OUT, ts)
	writeFileSync(JSON_OUT, json)
	console.log(
		`Generated ${options.length} style options:\n  ${TS_OUT}\n  ${JSON_OUT}`,
	)
}
