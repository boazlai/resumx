/**
 * Structure Plugins
 *
 * Validates the fundamental layout and organization of a resume document.
 * Ensures the resume follows the expected markdown structure with proper
 * heading hierarchy and essential contact information.
 *
 * ## Plugins
 *
 * | Plugin          | Code            | Severity | Description                                    |
 * |-----------------|-----------------|----------|------------------------------------------------|
 * | missingName     | missing-name    | error    | No H1 heading found (resume must have a name)  |
 * | missingContact  | missing-contact | error    | No email or phone number after the H1 heading  |
 * | noSections      | no-sections     | error    | No H2 headings found (no resume sections)      |
 * | noEntries       | no-entries      | warning  | No H3 headings found (no job/education entries)|
 *
 * ## Expected Structure
 *
 * ```markdown
 * # Name                    <- H1 (required)
 * > email@example.com       <- Contact info (required)
 *
 * ## Section                <- H2 (at least one required)
 * ### Entry                 <- H3 (recommended)
 * - Bullet point
 * ```
 *
 * @module validator/plugins/structure
 */

export { missingNamePlugin } from './missing-name.js'
export { missingContactPlugin } from './missing-contact.js'
export { noSectionsPlugin } from './no-sections.js'
export { noEntriesPlugin } from './no-entries.js'
