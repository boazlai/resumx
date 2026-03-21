import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	boolean,
	unique,
} from 'drizzle-orm/pg-core'

export const resumes = pgTable('resumes', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	title: text('title').notNull().default('Untitled Resume'),
	markdown: text('markdown').notNull().default(''),
	tags: text('tags').array().notNull().default([]),
	thumbnailUrl: text('thumbnail_url'),
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

export const userPreferences = pgTable('user_preferences', {
	userId: uuid('user_id').primaryKey(),
	defaultFont: text('default_font'),
	autoSave: boolean('auto_save').notNull().default(true),
	autoSaveInterval: integer('auto_save_interval').notNull().default(10),
	autoCompile: boolean('auto_compile').notNull().default(true),
	linkedinUrl: text('linkedin_url'),
	githubUrl: text('github_url'),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export type UserPreferences = typeof userPreferences.$inferSelect

export const resumeSnapshots = pgTable('resume_snapshots', {
	id: uuid('id').primaryKey().defaultRandom(),
	resumeId: uuid('resume_id').notNull(),
	userId: uuid('user_id').notNull(),
	markdown: text('markdown').notNull(),
	label: text('label'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
})

export type ResumeSnapshot = typeof resumeSnapshots.$inferSelect

export const resumeShares = pgTable(
	'resume_shares',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		resumeId: uuid('resume_id').notNull(),
		userId: uuid('user_id').notNull(),
		token: text('token').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	t => [unique().on(t.token)],
)

export type ResumeShare = typeof resumeShares.$inferSelect
