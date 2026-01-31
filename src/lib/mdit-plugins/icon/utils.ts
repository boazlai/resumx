import { escapeHtml } from '@mdit/helper'

/**
 * Builds the HTML string for an Iconify icon.
 *
 * @param iconId - Iconify id (e.g. `devicon:typescript`, `mdi:home`). Trimmed and escaped.
 * @returns HTML string: `<iconify-icon icon="..." style="..."></iconify-icon>`.
 */
export function iconifyHtml(iconId: string): string {
	const id = iconId.trim()
	return `<span class="iconify" data-icon="${escapeHtml(id)}" style="display: inline-block;"></span>`
}
