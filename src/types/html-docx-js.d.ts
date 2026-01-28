declare module 'html-docx-js' {
	interface DocxOptions {
		orientation?: 'portrait' | 'landscape'
		margins?: {
			top?: number
			right?: number
			bottom?: number
			left?: number
			header?: number
			footer?: number
			gutter?: number
		}
	}

	/**
	 * Convert HTML to DOCX format
	 * @param html - Complete HTML document string (must include DOCTYPE, html, body tags)
	 * @param options - Optional page setup options
	 * @returns Buffer in Node.js, Blob in browser
	 */
	function asBlob(html: string, options?: DocxOptions): Buffer

	export = { asBlob }
}
