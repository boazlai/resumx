import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

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
