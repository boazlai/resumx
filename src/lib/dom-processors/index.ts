/**
 * DOM Processor Pipeline
 *
 * A unified system for structural HTML transformations.
 * Each processor receives HTML and a PipelineContext, returns modified HTML.
 *
 * Design:
 * - Processors are independent and composable
 * - Order matters: processors run in array order
 * - Context provides config (user settings) and env (derived values like CSS)
 */

import { filterByRole } from './filter-by-role/index.js'
import { extractHeader } from './extract-header/index.js'
import { processColumns } from './process-columns/index.js'
import { wrapSections } from './wrap-sections/index.js'
import type { DOMProcessor, PipelineContext } from './types.js'

/**
 * Default processor pipeline
 * Order matters:
 * 1. filterByRole - remove non-matching role content
 * 2. extractHeader - pull content before first h2 into <header>
 * 3. processColumns - handle <hr>, create two-column layout
 * 4. wrapSections - wrap h2 groups in <section> tags
 */
export const defaultProcessors: DOMProcessor[] = [
	{ name: 'filterByRole', process: filterByRole },
	{ name: 'extractHeader', process: extractHeader },
	{ name: 'processColumns', process: processColumns },
	{ name: 'wrapSections', process: wrapSections },
]

/**
 * Run HTML through the processor pipeline
 */
export function runPipeline(
	html: string,
	ctx: PipelineContext,
	processors: DOMProcessor[] = defaultProcessors,
): string {
	return processors.reduce((h, processor) => processor.process(h, ctx), html)
}

// Re-export types
export type {
	DOMProcessor,
	PipelineContext,
	PipelineConfig,
	PipelineEnv,
} from './types.js'

// Re-export individual processors for testing
export { filterByRole } from './filter-by-role/index.js'
export { extractHeader } from './extract-header/index.js'
export { processColumns } from './process-columns/index.js'
export { wrapSections, slugify } from './wrap-sections/index.js'
