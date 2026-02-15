/**
 * Convert text to URL-friendly slug
 * "Work Experience" -> "work-experience"
 * "Technical Skills & Tools" -> "technical-skills-and-tools"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/&/g, 'and') // Convert & to 'and'
		.replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Remove consecutive hyphens
		.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}
