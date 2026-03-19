import { Node, mergeAttributes } from '@tiptap/core'

export interface EntryOptions {
	HTMLAttributes: Record<string, any>
}

export const Entry = Node.create<EntryOptions>({
	name: 'entry',
	group: 'block',
	content: 'block*',
	defining: true,
	addOptions() {
		return { HTMLAttributes: {} }
	},
	addAttributes() {
		return {
			company: { default: '' },
			role: { default: '' },
			dates: { default: '' },
			id: { default: null },
		}
	},
	parseHTML() {
		return [{ tag: 'div[data-entry]' }]
	},
	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(
				{ 'data-entry': true },
				this.options.HTMLAttributes,
				HTMLAttributes,
			),
			0,
		]
	},
})
