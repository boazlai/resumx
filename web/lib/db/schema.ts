import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	unique,
} from 'drizzle-orm/pg-core'

export const resumes = pgTable('resumes', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	title: text('title').notNull().default('Untitled Resume'),
	markdown: text('markdown').notNull().default(''),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export type Resume = typeof resumes.$inferSelect
export type NewResume = typeof resumes.$inferInsert

export const userIcons = pgTable(
	'user_icons',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),
		name: text('name').notNull(),
		url: text('url').notNull(),
		format: text('format').notNull(), // svg, png, jpg
		fileSize: integer('file_size').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	t => [unique().on(t.userId, t.name)],
)

export type UserIcon = typeof userIcons.$inferSelect
export type NewUserIcon = typeof userIcons.$inferInsert
