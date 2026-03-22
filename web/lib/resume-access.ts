import { and, eq, inArray, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
	resumeCollaborators,
	resumes,
	type Resume,
	type ResumeCollaborator,
} from '@/lib/db/schema'

export type CollaboratorRole = 'viewer' | 'commenter' | 'editor'
export type ResumeAccessRole = 'owner' | CollaboratorRole

export interface ResumeViewerIdentity {
	id: string
	email: string | null | undefined
	name?: string | null
	avatarUrl?: string | null
}

export interface ResumeAccess {
	resume: Resume
	role: ResumeAccessRole
	collaborator: ResumeCollaborator | null
	canView: boolean
	canEdit: boolean
	canComment: boolean
	canManageCollaborators: boolean
	canManageShare: boolean
	canCreateSnapshots: boolean
	canRestoreSnapshots: boolean
	canGenerateThumbnail: boolean
	canDelete: boolean
	canDuplicate: boolean
}

export function normalizeEmail(email: string | null | undefined) {
	return email?.trim().toLowerCase() ?? ''
}

function buildAccess(
	resume: Resume,
	role: ResumeAccessRole,
	collaborator: ResumeCollaborator | null,
): ResumeAccess {
	const isOwner = role === 'owner'
	const canEdit = isOwner || role === 'editor'
	const canComment = role === 'commenter'

	return {
		resume,
		role,
		collaborator,
		canView: true,
		canEdit,
		canComment,
		canManageCollaborators: isOwner,
		canManageShare: isOwner,
		canCreateSnapshots: canEdit,
		canRestoreSnapshots: canEdit,
		canGenerateThumbnail: canEdit,
		canDelete: isOwner,
		canDuplicate: canEdit,
	}
}

async function syncCollaboratorIdentity(
	collaborator: ResumeCollaborator,
	viewer: ResumeViewerIdentity,
	normalizedEmail: string,
) {
	const nextName = viewer.name?.trim() || null
	const nextAvatarUrl = viewer.avatarUrl?.trim() || null
	const needsUpdate =
		collaborator.userId !== viewer.id
		|| collaborator.acceptedAt === null
		|| collaborator.displayName !== nextName
		|| collaborator.avatarUrl !== nextAvatarUrl
		|| collaborator.email !== normalizedEmail

	if (!needsUpdate) return collaborator

	const [updated] = await db
		.update(resumeCollaborators)
		.set({
			userId: viewer.id,
			email: normalizedEmail,
			displayName: nextName,
			avatarUrl: nextAvatarUrl,
			acceptedAt: collaborator.acceptedAt ?? new Date(),
			updatedAt: new Date(),
		})
		.where(eq(resumeCollaborators.id, collaborator.id))
		.returning()

	return updated ?? collaborator
}

export async function getResumeAccess(
	resumeId: string,
	viewer: ResumeViewerIdentity,
): Promise<ResumeAccess | null> {
	const normalizedEmail = normalizeEmail(viewer.email)
	const resume = await db.query.resumes.findFirst({
		where: eq(resumes.id, resumeId),
	})

	if (!resume) return null
	if (resume.userId === viewer.id) {
		return buildAccess(resume, 'owner', null)
	}
	if (!normalizedEmail) return null

	const collaborator = await db.query.resumeCollaborators.findFirst({
		where: and(
			eq(resumeCollaborators.resumeId, resumeId),
			or(
				eq(resumeCollaborators.userId, viewer.id),
				eq(resumeCollaborators.email, normalizedEmail),
			),
		),
	})

	if (!collaborator) return null

	const hydrated = await syncCollaboratorIdentity(
		collaborator,
		viewer,
		normalizedEmail,
	)

	return buildAccess(resume, hydrated.role, hydrated)
}

export async function listAccessibleResumes(viewer: ResumeViewerIdentity) {
	const normalizedEmail = normalizeEmail(viewer.email)
	const owned = await db
		.select({
			id: resumes.id,
			title: resumes.title,
			tags: resumes.tags,
			createdAt: resumes.createdAt,
			updatedAt: resumes.updatedAt,
			accessRole: resumes.userId,
		})
		.from(resumes)
		.where(eq(resumes.userId, viewer.id))

	const collaboratorRows =
		normalizedEmail ?
			await db
				.select({
					resumeId: resumeCollaborators.resumeId,
					role: resumeCollaborators.role,
				})
				.from(resumeCollaborators)
				.where(
					or(
						eq(resumeCollaborators.userId, viewer.id),
						eq(resumeCollaborators.email, normalizedEmail),
					),
				)
		:	[]

	const sharedIds = collaboratorRows
		.map(row => row.resumeId)
		.filter(id => !owned.some(resume => resume.id === id))

	const shared =
		sharedIds.length > 0 ?
			await db
				.select({
					id: resumes.id,
					title: resumes.title,
					tags: resumes.tags,
					createdAt: resumes.createdAt,
					updatedAt: resumes.updatedAt,
				})
				.from(resumes)
				.where(inArray(resumes.id, sharedIds))
		:	[]

	const sharedWithRole = shared.map(resume => ({
		...resume,
		accessRole:
			collaboratorRows.find(row => row.resumeId === resume.id)?.role
			?? 'viewer',
	}))

	return [
		...owned.map(resume => ({ ...resume, accessRole: 'owner' })),
		...sharedWithRole,
	].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	)
}
