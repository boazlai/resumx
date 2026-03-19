import { Node, mergeAttributes } from '@tiptap/core'

export interface SectionOptions {
	HTMLAttributes: Record<string, any>
}

export const Section = Node.create<SectionOptions>({
	name: 'section',
	group: 'block',
	content: 'block*',
	defining: true,
	addOptions() {
		return {
			HTMLAttributes: {},
		}
	},
	addAttributes() {
		return {
			name: { default: '' },
		}
	},
	parseHTML() {
		return [
			{
				tag: 'section[data-section]',
			},
		]
	},
	renderHTML({ HTMLAttributes }) {
		return [
			'section',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
			0,
		]
	},
})
