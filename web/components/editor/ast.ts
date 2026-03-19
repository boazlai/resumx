export type ASTNode = DocNode | SectionNode | EntryNode | BulletNode | TextNode

export interface DocNode {
	type: 'doc'
	children: ASTNode[]
}

export interface SectionNode {
	type: 'section'
	name: string
	children: ASTNode[]
}

export interface EntryNode {
	type: 'entry'
	id?: string
	company?: string
	role?: string
	dates?: string
	tags?: string[]
	children: ASTNode[] // usually BulletNode or TextNode
}

export interface BulletNode {
	type: 'bullet'
	tag?: string
	text: string
}

export interface TextNode {
	type: 'text'
	text: string
}
