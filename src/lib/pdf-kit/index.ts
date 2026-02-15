/**
 * PDF buffer utilities.
 */

/** Count /Type /Page entries in a PDF buffer. */
export function countPdfPages(buffer: Buffer): number {
	const text = buffer.toString('latin1')
	return (text.match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length
}
